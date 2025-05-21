"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import type { DataPoint } from "@/lib/types"
import { DEFAULT_CATEGORIES } from "@/lib/forecast-utils"

// Import chart components directly to avoid any potential issues
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Bar } from "react-chartjs-2"

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

interface DemandForecastChartProps {
  historicalData: DataPoint[]
  forecastData: DataPoint[]
  selectedCategory: string | null
}

export function DemandForecastChart({ historicalData, forecastData, selectedCategory }: DemandForecastChartProps) {
  const [chartData, setChartData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [fallbackView, setFallbackView] = useState(false)

  useEffect(() => {
    console.log("Chart received new data:", {
      historicalDataLength: historicalData?.length,
      forecastDataLength: forecastData?.length,
      selectedCategory,
    })
  }, [historicalData, forecastData, selectedCategory])

  useEffect(() => {
    try {
      // Validate data
      if (!historicalData || historicalData.length === 0) {
        setError("No historical data available")
        return
      }

      console.log("Chart component received data:", {
        historicalDataLength: historicalData.length,
        forecastDataLength: forecastData.length,
        forecastPeriods: forecastData.length,
      })

      // Filter data by category if selected
      const filteredHistoricalData = selectedCategory
        ? historicalData.filter((point) => point.category === selectedCategory)
        : historicalData

      const filteredForecastData = selectedCategory
        ? forecastData.filter((point) => point.category === selectedCategory)
        : forecastData

      if (filteredHistoricalData.length === 0) {
        setError(`No historical data available for category: ${selectedCategory}`)
        return
      }

      // Sort the filtered data by date
      const sortedHistoricalData = [...filteredHistoricalData].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      )

      const sortedForecastData = [...filteredForecastData].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      )

      // Combine all data points to ensure proper date sorting
      const combinedData = [
        ...sortedHistoricalData.map((point) => ({
          date: new Date(point.date),
          actual: point.actual,
          forecast: null,
          type: "historical",
        })),
        ...sortedForecastData.map((point) => ({
          date: new Date(point.date),
          actual: null,
          forecast: point.forecast,
          type: "forecast",
        })),
      ]

      // Sort by date again to ensure chronological order
      combinedData.sort((a, b) => a.date.getTime() - b.date.getTime())

      // Prepare data for Chart.js
      const labels: string[] = []
      const actualValues: (number | null)[] = []
      const forecastValues: (number | null)[] = []

      // Process sorted data
      combinedData.forEach((point) => {
        if (point && point.date) {
          try {
            if (!isNaN(point.date.getTime())) {
              labels.push(formatDate(point.date))
              if (point.type === "historical") {
                actualValues.push(point.actual)
                forecastValues.push(null)
              } else {
                actualValues.push(null)
                forecastValues.push(point.forecast)
              }
            }
          } catch (e) {
            console.error("Error processing data point:", point, e)
          }
        }
      })

      if (labels.length === 0) {
        setError("No valid data points to display")
        return
      }

      // Get colors for selected category
      let historicalColor = "rgba(14, 165, 233, 0.8)" // Solid blue
      let forecastColor = "rgba(249, 115, 22, 0.8)" // Solid orange
      let historicalBorderColor = "rgb(14, 165, 233)"
      let forecastBorderColor = "rgb(249, 115, 22)"

      if (selectedCategory) {
        const categoryInfo = DEFAULT_CATEGORIES.find((c) => c.name === selectedCategory)
        if (categoryInfo) {
          const color = categoryInfo.color

          // For historical data: use solid color
          historicalColor = color
          historicalBorderColor = color

          // For forecast data: use a complementary or contrasting color
          switch (categoryInfo.name) {
            case "Electronics":
              forecastColor = "#9333ea" // Purple for Electronics forecast
              forecastBorderColor = "#9333ea"
              break
            case "Clothing":
              forecastColor = "#0891b2" // Cyan for Clothing forecast
              forecastBorderColor = "#0891b2"
              break
            case "Home & Kitchen":
              forecastColor = "#7c3aed" // Violet for Home & Kitchen forecast
              forecastBorderColor = "#7c3aed"
              break
            case "Toys & Games":
              forecastColor = "#0284c7" // Sky blue for Toys & Games forecast
              forecastBorderColor = "#0284c7"
              break
            case "Beauty":
              forecastColor = "#ea580c" // Orange for Beauty forecast
              forecastBorderColor = "#ea580c"
              break
            default:
              forecastColor = "#f97316" // Default orange
              forecastBorderColor = "#f97316"
          }
        }
      }

      // Create Chart.js data object
      const data = {
        labels,
        datasets: [
          {
            label: "Historical",
            data: actualValues,
            backgroundColor: historicalColor,
            borderColor: historicalBorderColor,
            borderWidth: 1,
            hoverBackgroundColor: historicalBorderColor,
          },
          {
            label: "Forecast",
            data: forecastValues,
            backgroundColor: forecastColor,
            borderColor: forecastBorderColor,
            borderWidth: 1,
            hoverBackgroundColor: forecastBorderColor,
            borderDash: [5, 5],
          },
        ],
      }

      console.log(`Chart prepared with ${labels.length} total data points (${forecastData.length} forecast points)`)
      setChartData(data)
      setError(null)
    } catch (err) {
      console.error("Error preparing chart data:", err)
      setError(`Error preparing chart: ${err instanceof Error ? err.message : "Unknown error"}`)
      setFallbackView(true)
    }
  }, [historicalData, forecastData, selectedCategory])

  // If there's an error, show error message
  if (error) {
    return (
      <Alert variant="destructive" className="w-full">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="text-base">Visualization Error</AlertTitle>
        <AlertDescription className="text-base">{error}</AlertDescription>
      </Alert>
    )
  }

  // If chart data is not ready yet, show loading
  if (!chartData) {
    return (
      <div className="w-full aspect-[4/3] sm:aspect-[16/9] flex items-center justify-center border rounded-md bg-muted/20">
        <p className="text-base text-muted-foreground">Preparing visualization...</p>
      </div>
    )
  }

  // If fallback view is enabled, show a simple table
  if (fallbackView) {
    return (
      <FallbackTableView
        historicalData={historicalData}
        forecastData={forecastData}
        selectedCategory={selectedCategory}
      />
    )
  }

  // Render the chart with larger font sizes
  return (
    <div className="w-full aspect-[4/3] sm:aspect-[16/9]">
      <Bar
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: true,
          animation: {
            duration: 0, // Disable animations to ensure immediate updates
          },
          scales: {
            x: {
              stacked: false,
              title: {
                display: true,
                text: "Month",
                font: {
                  size: 14, // Larger font for axis title
                },
              },
              ticks: {
                font: {
                  size: 13, // Larger font for axis labels
                },
              },
            },
            y: {
              stacked: false,
              title: {
                display: true,
                text: "Value",
                font: {
                  size: 14, // Larger font for axis title
                },
              },
              ticks: {
                font: {
                  size: 13, // Larger font for axis labels
                },
              },
              beginAtZero: true,
            },
          },
          plugins: {
            legend: {
              position: "top" as const,
              labels: {
                usePointStyle: true,
                pointStyle: "rect",
                font: {
                  size: 14, // Larger font for legend
                },
              },
            },
            tooltip: {
              mode: "index" as const,
              intersect: false,
              titleFont: {
                size: 14, // Larger font for tooltip title
              },
              bodyFont: {
                size: 13, // Larger font for tooltip body
              },
            },
          },
        }}
      />

      {/* Add a visual legend explanation with larger font */}
      <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4" style={{ backgroundColor: "rgba(14, 165, 233, 0.8)" }}></div>
          <span className="text-base">Historical Data</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4" style={{ backgroundColor: "rgba(249, 115, 22, 0.8)" }}></div>
          <span className="text-base">Forecast Data</span>
        </div>
      </div>
    </div>
  )
}

// Fallback table view with larger font
function FallbackTableView({ historicalData, forecastData, selectedCategory }: DemandForecastChartProps) {
  // Filter data by category if selected
  const filteredHistoricalData = selectedCategory
    ? historicalData.filter((point) => point.category === selectedCategory)
    : historicalData

  const filteredForecastData = selectedCategory
    ? forecastData.filter((point) => point.category === selectedCategory)
    : forecastData

  // Combine and sort data
  const combinedData = [
    ...filteredHistoricalData.map((point) => ({
      date: new Date(point.date),
      actual: point.actual,
      forecast: null,
      category: point.category,
    })),
    ...filteredForecastData.map((point) => ({
      date: new Date(point.date),
      actual: null,
      forecast: point.forecast,
      category: point.category,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-center mb-4">
          <h3 className="font-medium text-lg">
            Demand Forecast Data {selectedCategory ? `(${selectedCategory})` : "(All Categories)"} (Fallback View)
          </h3>
          <p className="text-base text-muted-foreground">
            Chart rendering failed. Showing data in table format instead.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2 text-left text-base">Date</th>
                <th className="border p-2 text-left text-base">Category</th>
                <th className="border p-2 text-left text-base">Historical</th>
                <th className="border p-2 text-left text-base">Forecast</th>
              </tr>
            </thead>
            <tbody>
              {combinedData.map((point, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                  <td className="border p-2 text-base">{formatDate(point.date)}</td>
                  <td className="border p-2 text-base">{point.category || "N/A"}</td>
                  <td className="border p-2 text-base">{point.actual !== null ? point.actual : "-"}</td>
                  <td className="border p-2 text-base">{point.forecast !== null ? point.forecast : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// Improved date formatter that ensures consistent month-year format
function formatDate(date: Date): string {
  try {
    // Use a consistent format with full month name and year
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "numeric",
    }).format(date)
  } catch (e) {
    console.error("Error formatting date:", e)
    return date.toISOString().substring(0, 7)
  }
}
