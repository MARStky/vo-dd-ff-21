import {
  CreateAutoMLJobCommand,
  DescribeAutoMLJobCommand,
  ListCandidatesForAutoMLJobCommand,
  CreateModelCommand,
  CreateEndpointConfigCommand,
  CreateEndpointCommand,
  DescribeEndpointCommand,
  DeleteModelCommand,
  DeleteEndpointConfigCommand,
  DeleteEndpointCommand,
  InvokeEndpointCommand,
} from "@aws-sdk/client-sagemaker"
import { getSageMakerClient } from "./aws-config"
import { uploadDatasetToS3 } from "./s3-client"
import { getConfig } from "./config"
import type { DataPoint, JobStatusResponse, EndpointStatusResponse } from "./types"

const JOB_PREFIX = "retail-forecast-"

/**
 * Creates a SageMaker AutoML job for time series forecasting
 * @param historicalData Historical data points
 * @param targetColumn Name of the target column (default: "value")
 * @returns Object with job name and ARN
 */
export async function createForecastingJob(historicalData: DataPoint[], targetColumn = "value") {
  try {
    // 1. Get configuration
    const config = await getConfig()

    // 2. Upload data to S3
    const datasetPath = await uploadDatasetToS3(historicalData)

    // 3. Create a unique job name
    const jobName = `${JOB_PREFIX}${Date.now()}`

    // 4. Get SageMaker client
    const sageMakerClient = getSageMakerClient()

    // 5. Create AutoML job
    const response = await sageMakerClient.send(
      new CreateAutoMLJobCommand({
        AutoMLJobName: jobName,
        ProblemType: "Forecasting",
        AutoMLJobConfig: {
          CompletionCriteria: {
            MaxCandidates: 10,
            MaxRuntimePerTrainingJobInSeconds: 3600,
          },
        },
        InputDataConfig: [
          {
            DataSource: {
              S3DataSource: {
                S3DataType: "S3Prefix",
                S3Uri: datasetPath,
              },
            },
            TargetAttributeName: targetColumn,
          },
        ],
        OutputDataConfig: {
          S3OutputPath: `s3://${config.dataBucket}/output/`,
        },
        RoleArn: config.sageMakerRoleArn,
      }),
    )

    return {
      jobName,
      jobArn: response.AutoMLJobArn,
    }
  } catch (error) {
    console.error("Error creating forecasting job:", error)
    throw error
  }
}

/**
 * Gets the status of an AutoML job
 * @param jobName Name of the AutoML job
 * @returns Job status information
 */
export async function getJobStatus(jobName: string): Promise<JobStatusResponse> {
  try {
    const sageMakerClient = getSageMakerClient()

    const response = await sageMakerClient.send(
      new DescribeAutoMLJobCommand({
        AutoMLJobName: jobName,
      }),
    )

    // Get best candidate if job is complete
    let bestCandidate = null
    if (response.AutoMLJobStatus === "Completed") {
      const candidatesResponse = await sageMakerClient.send(
        new ListCandidatesForAutoMLJobCommand({
          AutoMLJobName: jobName,
        }),
      )

      bestCandidate = candidatesResponse.Candidates?.[0]
    }

    return {
      jobName,
      status: response.AutoMLJobStatus || "Unknown",
      bestCandidate,
      endTime: response.EndTime,
      failureReason: response.FailureReason,
    }
  } catch (error) {
    console.error("Error getting job status:", error)
    throw error
  }
}

/**
 * Deploys the best model from an AutoML job
 * @param jobName Name of the completed AutoML job
 * @returns Object with model, endpoint config, and endpoint names
 */
export async function deployBestModel(jobName: string) {
  try {
    const sageMakerClient = getSageMakerClient()
    const config = await getConfig()

    // 1. Get the best candidate from the job
    const jobStatus = await getJobStatus(jobName)

    if (jobStatus.status !== "Completed") {
      throw new Error(`Job ${jobName} is not completed. Current status: ${jobStatus.status}`)
    }

    if (!jobStatus.bestCandidate) {
      throw new Error(`No best candidate found for job ${jobName}`)
    }

    // 2. Create model name, endpoint config name, and endpoint name
    const modelName = `${jobName}-model`
    const endpointConfigName = `${jobName}-config`
    const endpointName = `${jobName}-endpoint`

    // 3. Create model
    await sageMakerClient.send(
      new CreateModelCommand({
        ModelName: modelName,
        ExecutionRoleArn: config.sageMakerRoleArn,
        PrimaryContainer: {
          ModelDataUrl: jobStatus.bestCandidate.InferenceContainers[0].ModelDataUrl,
          Image: jobStatus.bestCandidate.InferenceContainers[0].Image,
          Environment: jobStatus.bestCandidate.InferenceContainers[0].Environment,
        },
      }),
    )

    // 4. Create endpoint configuration
    await sageMakerClient.send(
      new CreateEndpointConfigCommand({
        EndpointConfigName: endpointConfigName,
        ProductionVariants: [
          {
            VariantName: "AllTraffic",
            ModelName: modelName,
            InitialInstanceCount: 1,
            InstanceType: "ml.m5.large",
          },
        ],
      }),
    )

    // 5. Create endpoint
    await sageMakerClient.send(
      new CreateEndpointCommand({
        EndpointName: endpointName,
        EndpointConfigName: endpointConfigName,
      }),
    )

    return {
      modelName,
      endpointConfigName,
      endpointName,
    }
  } catch (error) {
    console.error("Error deploying best model:", error)
    throw error
  }
}

/**
 * Gets the status of a SageMaker endpoint
 * @param endpointName Name of the endpoint
 * @returns Endpoint status information
 */
export async function getEndpointStatus(endpointName: string): Promise<EndpointStatusResponse> {
  try {
    const sageMakerClient = getSageMakerClient()

    const response = await sageMakerClient.send(
      new DescribeEndpointCommand({
        EndpointName: endpointName,
      }),
    )

    return {
      endpointName,
      status: response.EndpointStatus || "Unknown",
      creationTime: response.CreationTime || new Date(),
      lastModifiedTime: response.LastModifiedTime || new Date(),
    }
  } catch (error) {
    console.error("Error getting endpoint status:", error)
    throw error
  }
}

/**
 * Gets forecast from a deployed SageMaker endpoint
 * @param endpointName Name of the endpoint
 * @param historicalData Historical data points
 * @param forecastHorizon Number of periods to forecast
 * @returns Array of forecast data points
 */
export async function getForecastFromEndpoint(
  endpointName: string,
  historicalData: DataPoint[],
  forecastHorizon: number,
): Promise<DataPoint[]> {
  try {
    const sageMakerClient = getSageMakerClient()

    // 1. Prepare input data in the format expected by the model
    const inputData = prepareInputData(historicalData)

    // 2. Invoke the endpoint
    const response = await sageMakerClient.send(
      new InvokeEndpointCommand({
        EndpointName: endpointName,
        ContentType: "application/json",
        Body: JSON.stringify({
          instances: inputData,
          configuration: {
            forecast_horizon: forecastHorizon,
          },
        }),
      }),
    )

    // 3. Parse the response
    const responseBody = JSON.parse(Buffer.from(response.Body as Uint8Array).toString("utf-8"))

    // 4. Convert the response to DataPoint format
    return parseForecastResponse(responseBody, historicalData, forecastHorizon)
  } catch (error) {
    console.error("Error getting forecast from endpoint:", error)
    throw error
  }
}

/**
 * Cleans up SageMaker resources (endpoint, endpoint config, model)
 * @param endpointName Name of the endpoint
 * @param endpointConfigName Name of the endpoint configuration
 * @param modelName Name of the model
 * @returns Success message
 */
export async function cleanupSageMakerResources(endpointName: string, endpointConfigName: string, modelName: string) {
  try {
    const sageMakerClient = getSageMakerClient()

    // 1. Delete endpoint
    await sageMakerClient.send(
      new DeleteEndpointCommand({
        EndpointName: endpointName,
      }),
    )

    // 2. Delete endpoint configuration
    await sageMakerClient.send(
      new DeleteEndpointConfigCommand({
        EndpointConfigName: endpointConfigName,
      }),
    )

    // 3. Delete model
    await sageMakerClient.send(
      new DeleteModelCommand({
        ModelName: modelName,
      }),
    )

    return {
      success: true,
      message: "Resources cleaned up successfully",
    }
  } catch (error) {
    console.error("Error cleaning up SageMaker resources:", error)
    throw error
  }
}

/**
 * Prepares input data for the SageMaker model
 * @param historicalData Historical data points
 * @returns Formatted input data
 */
function prepareInputData(historicalData: DataPoint[]): any[] {
  // Sort data by date
  const sortedData = [...historicalData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Convert to the format expected by the model
  return sortedData.map((point) => ({
    timestamp: new Date(point.date).toISOString(),
    target: point.actual || 0,
    // Add any additional features that might be needed by the model
    category: point.category || "default",
  }))
}

/**
 * Parses the forecast response from SageMaker
 * @param response Response from SageMaker endpoint
 * @param historicalData Historical data points
 * @param forecastHorizon Number of periods forecasted
 * @returns Array of forecast data points
 */
function parseForecastResponse(response: any, historicalData: DataPoint[], forecastHorizon: number): DataPoint[] {
  // Get the last date from historical data
  const sortedHistoricalData = [...historicalData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  const lastDate = new Date(sortedHistoricalData[sortedHistoricalData.length - 1].date)
  const category = sortedHistoricalData[0]?.category

  // Extract predictions from response
  const predictions = response.predictions || []

  // Create forecast data points
  const forecastData: DataPoint[] = []

  for (let i = 0; i < forecastHorizon; i++) {
    const forecastDate = new Date(lastDate)
    forecastDate.setMonth(lastDate.getMonth() + i + 1)

    // Ensure we're using the first day of the month for consistency
    forecastDate.setDate(1)

    // Get the forecast value from the response, or use a fallback
    const forecastValue = predictions[i]?.mean || null

    forecastData.push({
      date: forecastDate.toISOString(),
      actual: null,
      forecast: forecastValue !== null ? Math.round(forecastValue) : null,
      category,
    })
  }

  return forecastData
}
