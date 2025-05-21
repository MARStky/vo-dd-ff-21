import { GetParameterCommand } from "@aws-sdk/client-ssm"
import { getSSMClient } from "./aws-config"
import type { AppConfig } from "./types"

// Default configuration that works in development
const defaultConfig: AppConfig = {
  dataBucket: process.env.DATA_BUCKET || "retail-forecasting-data",
  sageMakerRoleArn: process.env.SAGEMAKER_ROLE_ARN || "",
  region: process.env.AWS_REGION || "us-east-1",
  environment: process.env.ENVIRONMENT || "development",
}

/**
 * Gets application configuration from environment variables or SSM Parameter Store
 * @returns Application configuration
 */
export async function getConfig(): Promise<AppConfig> {
  // In development, use environment variables
  if (process.env.NODE_ENV === "development") {
    return defaultConfig
  }

  // In production, try to get config from SSM Parameter Store
  try {
    const environment = process.env.ENVIRONMENT || "production"
    const parameterName = `/retail-forecasting/${environment}/config`

    const ssmClient = getSSMClient()
    const response = await ssmClient.send(
      new GetParameterCommand({
        Name: parameterName,
        WithDecryption: true,
      }),
    )

    if (response.Parameter?.Value) {
      const configFromSSM = JSON.parse(response.Parameter.Value) as AppConfig
      return {
        ...defaultConfig, // Fallback values
        ...configFromSSM, // Override with SSM values
      }
    }
  } catch (error) {
    console.warn("Error fetching config from SSM, using default:", error)
  }

  // Fallback to environment variables
  return defaultConfig
}
