"use client"

import { useState } from "react"
import type { DataPoint, JobStatusResponse, EndpointStatusResponse } from "@/lib/types"

/**
 * Hook for interacting with the forecast API
 */
export function useForecastApi() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Creates a new forecasting job
   * @param historicalData Historical data points
   * @returns Job information
   */
  const createJob = async (historicalData: DataPoint[]) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/forecast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create_job",
          data: { historicalData },
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(`Failed to create job: ${errorMessage}`)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Gets the status of a job
   * @param jobName Job name
   * @returns Job status
   */
  const getJobStatus = async (jobName: string): Promise<JobStatusResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/forecast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get_job_status",
          data: { jobName },
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(`Failed to get job status: ${errorMessage}`)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Deploys the best model from a job
   * @param jobName Job name
   * @returns Deployment information
   */
  const deployModel = async (jobName: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/forecast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "deploy_model",
          data: { jobName },
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(`Failed to deploy model: ${errorMessage}`)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Gets the status of an endpoint
   * @param endpointName Endpoint name
   * @returns Endpoint status
   */
  const getEndpointStatus = async (endpointName: string): Promise<EndpointStatusResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/forecast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get_endpoint_status",
          data: { endpointName },
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(`Failed to get endpoint status: ${errorMessage}`)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Gets forecast from an endpoint
   * @param endpointName Endpoint name
   * @param historicalData Historical data
   * @param forecastHorizon Forecast horizon
   * @returns Forecast data
   */
  const getForecast = async (
    endpointName: string,
    historicalData: DataPoint[],
    forecastHorizon: number,
  ): Promise<DataPoint[]> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/forecast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get_forecast",
          data: { endpointName, historicalData, forecastHorizon },
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      return data.forecast
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(`Failed to get forecast: ${errorMessage}`)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Cleans up SageMaker resources
   * @param endpointName Endpoint name
   * @param endpointConfigName Endpoint config name
   * @param modelName Model name
   * @returns Cleanup result
   */
  const cleanupResources = async (endpointName: string, endpointConfigName: string, modelName: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/forecast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "cleanup_resources",
          data: { endpointName, endpointConfigName, modelName },
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(`Failed to clean up resources: ${errorMessage}`)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    createJob,
    getJobStatus,
    deployModel,
    getEndpointStatus,
    getForecast,
    cleanupResources,
  }
}
