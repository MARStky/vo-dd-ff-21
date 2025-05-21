import { type NextRequest, NextResponse } from "next/server"
import {
  createForecastingJob,
  getJobStatus,
  deployBestModel,
  getEndpointStatus,
  getForecastFromEndpoint,
  cleanupSageMakerResources,
} from "@/lib/sagemaker-client"
import { getPresignedUploadUrl } from "@/lib/s3-client"

/**
 * API route handler for forecast operations
 */
export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()

    switch (action) {
      case "create_job":
        try {
          // Create a new forecasting job
          const { historicalData } = data
          const result = await createForecastingJob(historicalData)
          return NextResponse.json(result)
        } catch (error) {
          console.error("Error creating job:", error)
          return NextResponse.json(
            {
              error: "Failed to create forecasting job",
              details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
          )
        }

      case "get_job_status":
        try {
          // Get the status of an existing job
          const { jobName } = data
          const status = await getJobStatus(jobName)
          return NextResponse.json(status)
        } catch (error) {
          console.error("Error getting job status:", error)
          return NextResponse.json(
            {
              error: "Failed to get job status",
              details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
          )
        }

      case "deploy_model":
        try {
          // Deploy the best model from a job
          const { jobName: deployJobName } = data
          const deployResult = await deployBestModel(deployJobName)
          return NextResponse.json(deployResult)
        } catch (error) {
          console.error("Error deploying model:", error)
          return NextResponse.json(
            {
              error: "Failed to deploy model",
              details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
          )
        }

      case "get_endpoint_status":
        try {
          // Get the status of an endpoint
          const { endpointName: statusEndpointName } = data
          const endpointStatus = await getEndpointStatus(statusEndpointName)
          return NextResponse.json(endpointStatus)
        } catch (error) {
          console.error("Error getting endpoint status:", error)
          return NextResponse.json(
            {
              error: "Failed to get endpoint status",
              details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
          )
        }

      case "get_forecast":
        try {
          // Get forecast from a deployed endpoint
          const { endpointName, historicalData: histData, forecastHorizon } = data
          const forecast = await getForecastFromEndpoint(endpointName, histData, forecastHorizon)
          return NextResponse.json({ forecast })
        } catch (error) {
          console.error("Error getting forecast:", error)
          return NextResponse.json(
            {
              error: "Failed to get forecast",
              details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
          )
        }

      case "cleanup_resources":
        try {
          // Clean up SageMaker resources
          const { endpointName: cleanupEndpointName, endpointConfigName, modelName } = data
          const cleanupResult = await cleanupSageMakerResources(cleanupEndpointName, endpointConfigName, modelName)
          return NextResponse.json(cleanupResult)
        } catch (error) {
          console.error("Error cleaning up resources:", error)
          return NextResponse.json(
            {
              error: "Failed to clean up resources",
              details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
          )
        }

      case "get_upload_url":
        try {
          // Get a presigned URL for uploading a file
          const { filename, contentType } = data
          const uploadUrl = await getPresignedUploadUrl(filename, contentType)
          return NextResponse.json({ uploadUrl })
        } catch (error) {
          console.error("Error getting upload URL:", error)
          return NextResponse.json(
            {
              error: "Failed to generate upload URL",
              details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
          )
        }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in forecast API:", error)
    return NextResponse.json(
      {
        error: "Failed to process your request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
