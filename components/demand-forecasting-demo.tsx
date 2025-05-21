"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DemandForecastChart } from "@/components/demand-forecast-chart"
import { SimpleChartView } from "@/components/simple-chart-view"
import { TestResultsCard } from "@/components/test-results-card"
import { ModelInfoCard } from "@/components/model-info-card"
import { JobStatusCard } from "@/components/job-status-card"
import { EndpointStatusCard } from "@/components/endpoint-status-card"
import { CategorySelector } from "@/components/category-selector"
import {
  generateForecastData,
  testForecastAccuracy,
  normalizeTimeSeriesData,
  generateCategoryData,
} from "@/lib/forecast-utils"
import { DataImportDialog } from "@/components/data-import-dialog"
import { Download, Upload, AlertTriangle, RefreshCw, BarChart3, Table } from "lucide-react"
import type { DataPoint } from "@/lib/types"
import { DataDebug } from "@/components/data-debug"
import { SampleDataButton } from "@/components/sample-data-button"
import { DataTable } from "@/components/data-table"

export function DemandForecastingDemo() {
  const [historicalData, setHistoricalData] = useState<DataPoint[]>(() => {
    const allCategoryData = generateCategoryData(24).flatMap((category) => {
      const sortedData = [...category.data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      return sortedData
    })

    const sortedAllData = [...allCategoryData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    console.log("Initial historical data with categories:", sortedAllData)
    return sortedAllData
  })

  const [forecastData, setForecastData] = useState<DataPoint[]>(() => {
    const allCategoryData = generateCategoryData(24).flatMap((category) => category.data)
    const forecast = generateForecastData(allCategoryData, 12)
    console.log("Initial forecast data:", forecast)
    return forecast
  })

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [testPeriods, setTestPeriods] = useState(6)
  const [seasonalityFactor, setSeasonalityFactor] = useState(20)
  const [trendFactor, setTrendFactor] = useState(5)
  const [noiseFactor, setNoiseFactor] = useState(10)
  const [testResults, setTestResults] = useState<null | {
    mape: number
    rmse: number
    accuracy: number
  }>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [dataState, setDataState] = useState<"initial" | "loading" | "success" | "error">("initial")
  const [viewMode, setViewMode] = useState<"chart" | "simple" | "table">("chart")
  const [parameterUpdateCounter, setParameterUpdateCounter] = useState(0)

  const [jobName, setJobName] = useState<string | null>(null)
  const [endpointInfo, setEndpointInfo] = useState<{
    endpointName: string
    endpointConfigName: string
    modelName: string
  } | null>(null)
  const [isCreatingJob, setIsCreatingJob] = useState(false)
  const [isDeployingModel, setIsDeployingModel] = useState(false)
  const [isGeneratingForecast, setIsGeneratingForecast] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    if (historicalData && historicalData.length > 0) {
      try {
        console.log("Regenerating forecast with parameters:", {
          seasonalityFactor,
          trendFactor,
          noiseFactor,
          forecastMonths: testPeriods,
          selectedCategory,
        })

        const dataToForecast = selectedCategory
          ? historicalData.filter((point) => point.category === selectedCategory)
          : historicalData

        if (dataToForecast.length === 0) {
          console.warn(`No historical data available for category: ${selectedCategory}`)
          setForecastData([])
          return
        }

        const sortedDataToForecast = [...dataToForecast].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        )

        const newForecast = generateForecastData(sortedDataToForecast, testPeriods, {
          seasonality: seasonalityFactor / 100,
          trend: trendFactor / 100,
          noise: noiseFactor / 100,
        })

        const sortedForecast = [...newForecast].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        console.log("New forecast data generated:", sortedForecast)
        setForecastData(sortedForecast)

        setParameterUpdateCounter((prev) => prev + 1)
      } catch (err) {
        console.error("Error generating forecast:", err)
      }
    }
  }, [historicalData, seasonalityFactor, trendFactor, noiseFactor, testPeriods, selectedCategory])

  const handleGenerateNewData = () => {
    setDataState("loading")

    try {
      const allCategoryData = generateCategoryData(24).flatMap((category) => {
        const sortedData = [...category.data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        return sortedData
      })

      const sortedAllData = [...allCategoryData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      console.log("Generated new historical data with categories:", sortedAllData)

      setHistoricalData(sortedAllData)
      setTestResults(null)
      setImportError(null)
      setDataState("success")
    } catch (err) {
      console.error("Error generating new data:", err)
      setImportError(`Error generating data: ${err instanceof Error ? err.message : "Unknown error"}`)
      setDataState("error")
    }
  }

  const handleTestForecast = () => {
    setIsLoading(true)

    setTimeout(() => {
      try {
        const dataToTest = selectedCategory
          ? historicalData.filter((point) => point.category === selectedCategory)
          : historicalData

        const forecastToTest = selectedCategory
          ? forecastData.filter((point) => point.category === selectedCategory)
          : forecastData

        if (dataToTest.length === 0 || forecastToTest.length === 0) {
          setImportError(`No data available for category: ${selectedCategory}`)
          setIsLoading(false)
          return
        }

        const results = testForecastAccuracy(dataToTest, forecastToTest, testPeriods, {
          seasonality: seasonalityFactor,
          trend: trendFactor,
          noise: noiseFactor,
        })
        setTestResults(results)
        setIsLoading(false)
      } catch (err) {
        console.error("Error testing forecast:", err)
        setImportError(`Error testing forecast: ${err instanceof Error ? err.message : "Unknown error"}`)
        setIsLoading(false)
      }
    }, 1500)
  }

  const handleDataImported = (importedData: DataPoint[]) => {
    console.log("Received imported data:", importedData)
    setImportError(null)
    setDataState("loading")

    if (!importedData || importedData.length === 0) {
      setImportError("No valid data received from import")
      setDataState("error")
      return
    }

    try {
      const normalized = normalizeTimeSeriesData(importedData)
      console.log("Normalized data:", normalized)

      if (!normalized || normalized.length === 0) {
        setImportError("Normalization resulted in empty dataset")
        setDataState("error")
        return
      }

      setHistoricalData(normalized)

      if (selectedCategory) {
        const hasCategory = normalized.some((point) => point.category === selectedCategory)
        if (!hasCategory) {
          console.log(`Selected category "${selectedCategory}" not found in imported data. Resetting selection.`)
          setSelectedCategory(null)
        }
      }

      setDataState("success")
    } catch (err) {
      console.error("Error processing imported data:", err)
      setImportError(`Error processing data: ${err instanceof Error ? err.message : "Unknown error"}`)
      setDataState("error")
    }
  }

  const handleExportData = () => {
    const dataToExport = selectedCategory
      ? historicalData.filter((point) => point.category === selectedCategory)
      : historicalData

    const forecastToExport = selectedCategory
      ? forecastData.filter((point) => point.category === selectedCategory)
      : forecastData

    const combinedData = [
      ...dataToExport.map((point) => ({
        date: new Date(point.date).toISOString().split("T")[0],
        category: point.category || "N/A",
        actual: point.actual,
        forecast: null,
      })),
      ...forecastToExport.map((point) => ({
        date: new Date(point.date).toISOString().split("T")[0],
        category: point.category || "N/A",
        actual: null,
        forecast: point.forecast,
      })),
    ]

    const headers = ["date", "category", "actual", "forecast"]
    const csvContent = [
      headers.join(","),
      ...combinedData.map((row) => headers.map((header) => row[header as keyof typeof row] ?? "").join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = selectedCategory
      ? `demand_forecast_${selectedCategory.toLowerCase().replace(/\s+/g, "_")}.csv`
      : "demand_forecast_data.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCreateJob = async () => {
    setIsCreatingJob(true)
    setApiError(null)

    try {
      const dataToProcess = selectedCategory
        ? historicalData.filter((point) => point.category === selectedCategory)
        : historicalData

      const response = await fetch("/api/forecast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create_job",
          data: {
            historicalData: dataToProcess,
            category: selectedCategory,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setJobName(data.jobName)
    } catch (err) {
      console.error("Error creating job:", err)
      setApiError(`Failed to create AutoML job: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsCreatingJob(false)
    }
  }

  const handleDeployModel = async (jobName: string) => {
    setIsDeployingModel(true)
    setApiError(null)

    try {
      const response = await fetch("/api/forecast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "deploy_model",
          data: {
            jobName,
            category: selectedCategory,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setEndpointInfo({
        endpointName: data.endpointName,
        endpointConfigName: data.endpointConfigName,
        modelName: data.modelName,
      })
    } catch (err) {
      console.error("Error deploying model:", err)
      setApiError(`Failed to deploy model: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsDeployingModel(false)
    }
  }

  const handleGetForecast = async (endpointName: string) => {
    setIsGeneratingForecast(true)
    setApiError(null)

    try {
      const dataToProcess = selectedCategory
        ? historicalData.filter((point) => point.category === selectedCategory)
        : historicalData

      const response = await fetch("/api/forecast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get_forecast",
          data: {
            endpointName,
            historicalData: dataToProcess,
            forecastHorizon: 12,
            category: selectedCategory,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setForecastData(data.forecast)
    } catch (err) {
      console.error("Error getting forecast:", err)
      setApiError(`Failed to get forecast: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsGeneratingForecast(false)
    }
  }

  const handleCleanupResources = async (endpointName: string, endpointConfigName: string, modelName: string) => {
    try {
      const response = await fetch("/api/forecast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "cleanup_resources",
          data: {
            endpointName,
            endpointConfigName,
            modelName,
            category: selectedCategory,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      setEndpointInfo(null)
    } catch (err) {
      console.error("Error cleaning up resources:", err)
      setApiError(`Failed to clean up resources: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <CategorySelector selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">Demand Forecast Visualization</CardTitle>
                <CardDescription className="text-base">
                  {selectedCategory
                    ? `Historical data and forecasted demand for ${selectedCategory}`
                    : "Historical data and forecasted demand for all product categories"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <SampleDataButton />
                <div className="border rounded-md overflow-hidden">
                  <Tabs defaultValue={viewMode} value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                    <TabsList className="grid grid-cols-3 h-8">
                      <TabsTrigger value="chart" className="text-sm">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Chart
                      </TabsTrigger>
                      <TabsTrigger value="simple" className="text-sm">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Simple
                      </TabsTrigger>
                      <TabsTrigger value="table" className="text-sm">
                        <Table className="h-4 w-4 mr-1" />
                        Table
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {importError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-base">Error</AlertTitle>
                <AlertDescription className="text-base">{importError}</AlertDescription>
              </Alert>
            )}

            {apiError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-base">API Error</AlertTitle>
                <AlertDescription className="text-base">{apiError}</AlertDescription>
              </Alert>
            )}

            {dataState === "loading" || isGeneratingForecast ? (
              <div className="w-full aspect-[4/3] sm:aspect-[16/9] flex items-center justify-center border rounded-md bg-muted/20">
                <div className="flex flex-col items-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                  <p className="text-base text-muted-foreground">
                    {isGeneratingForecast ? "Generating forecast..." : "Loading data..."}
                  </p>
                </div>
              </div>
            ) : viewMode === "chart" ? (
              <DemandForecastChart
                key={`chart-${parameterUpdateCounter}`}
                historicalData={historicalData}
                forecastData={forecastData}
                selectedCategory={selectedCategory}
              />
            ) : viewMode === "simple" ? (
              <SimpleChartView
                key={`simple-${parameterUpdateCounter}`}
                historicalData={historicalData}
                forecastData={forecastData}
                selectedCategory={selectedCategory}
              />
            ) : (
              <DataTable
                key={`table-${parameterUpdateCounter}`}
                historicalData={historicalData}
                forecastData={forecastData}
                selectedCategory={selectedCategory}
              />
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
              <Button onClick={handleGenerateNewData} variant="outline" className="mr-2 text-base">
                Generate New Data
              </Button>
              <Button onClick={handleTestForecast} disabled={isLoading} className="text-base">
                {isLoading ? "Testing..." : "Test Forecast Accuracy"}
              </Button>
            </div>
            <div>
              <Button
                onClick={() => setIsImportDialogOpen(true)}
                variant="outline"
                className="mr-2 text-base"
                title="Import your own data"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button onClick={handleExportData} variant="outline" title="Export data as CSV" className="text-base">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-6">
        <Tabs defaultValue={jobName ? "job" : "model"}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="model" className="text-base">
              Model Info
            </TabsTrigger>
            <TabsTrigger value="job" className="text-base">
              AutoML Job
            </TabsTrigger>
          </TabsList>
          <TabsContent value="model">
            <ModelInfoCard />
          </TabsContent>
          <TabsContent value="job">
            {jobName ? (
              <JobStatusCard jobName={jobName} onDeployModel={handleDeployModel} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AutoML Job</CardTitle>
                  <CardDescription className="text-base">SageMaker AutoML job information</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-base text-muted-foreground">
                    This demo uses Amazon SageMaker Autopilot to automatically select the best algorithm and
                    hyperparameters for your forecasting task.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {endpointInfo && (
          <EndpointStatusCard
            endpointName={endpointInfo.endpointName}
            endpointConfigName={endpointInfo.endpointConfigName}
            modelName={endpointInfo.modelName}
            onGetForecast={handleGetForecast}
            onCleanup={handleCleanupResources}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Parameters</CardTitle>
            <CardDescription className="text-base">
              Adjust parameters to simulate different future scenarios
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="test-periods" className="text-base">
                  Test Periods
                </Label>
                <span className="text-base text-muted-foreground">{testPeriods} months</span>
              </div>
              <Slider
                id="test-periods"
                min={1}
                max={12}
                step={1}
                value={[testPeriods]}
                onValueChange={(value) => {
                  console.log("Test periods changed to:", value[0])
                  setTestPeriods(value[0])
                }}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="seasonality" className="text-base">
                  Seasonality Factor
                </Label>
                <span className="text-base text-muted-foreground">{seasonalityFactor}%</span>
              </div>
              <Slider
                id="seasonality"
                min={0}
                max={50}
                step={1}
                value={[seasonalityFactor]}
                onValueChange={(value) => {
                  console.log("Seasonality changed to:", value[0])
                  setSeasonalityFactor(value[0])
                }}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="trend" className="text-base">
                  Trend Factor
                </Label>
                <span className="text-base text-muted-foreground">{trendFactor}%</span>
              </div>
              <Slider
                id="trend"
                min={-20}
                max={20}
                step={1}
                value={[trendFactor]}
                onValueChange={(value) => {
                  console.log("Trend changed to:", value[0])
                  setTrendFactor(value[0])
                }}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="noise" className="text-base">
                  Noise Factor
                </Label>
                <span className="text-base text-muted-foreground">{noiseFactor}%</span>
              </div>
              <Slider
                id="noise"
                min={0}
                max={30}
                step={1}
                value={[noiseFactor]}
                onValueChange={(value) => {
                  console.log("Noise changed to:", value[0])
                  setNoiseFactor(value[0])
                }}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleTestForecast} disabled={isLoading} className="w-full text-base">
              {isLoading ? "Testing..." : "Test Forecast Accuracy"}
            </Button>
          </CardFooter>
        </Card>

        {testResults && <TestResultsCard results={testResults} />}
      </div>
      <DataImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onDataImported={handleDataImported}
      />
      <DataDebug historicalData={historicalData} forecastData={forecastData} />
    </div>
  )
}
