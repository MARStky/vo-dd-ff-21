/**
 * Represents a single data point for time series forecasting
 */
export interface DataPoint {
  date: string
  actual: number | null
  forecast: number | null
  category?: string
}

/**
 * Represents a collection of data points for a specific category
 */
export interface CategoryData {
  name: string
  color: string
  data: DataPoint[]
}

/**
 * Configuration for the application
 */
export interface AppConfig {
  dataBucket: string
  sageMakerRoleArn: string
  region: string
  environment: string
}

/**
 * SageMaker job status response
 */
export interface JobStatusResponse {
  jobName: string
  status: string
  bestCandidate?: any
  endTime?: Date
  failureReason?: string
}

/**
 * SageMaker endpoint status response
 */
export interface EndpointStatusResponse {
  endpointName: string
  status: string
  creationTime: Date
  lastModifiedTime: Date
}

/**
 * Forecast test results
 */
export interface ForecastTestResults {
  mape: number
  rmse: number
  accuracy: number
}
