"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { DataPoint } from "@/lib/types"

interface DataTableProps {
  historicalData: DataPoint[]
  forecastData: DataPoint[]
  selectedCategory: string | null
}

export function DataTable({ historicalData, forecastData, selectedCategory }: DataTableProps) {
  // Filter data by category if selected
  const filteredHistoricalData = selectedCategory
    ? historicalData.filter((point) => point.category === selectedCategory)
    : historicalData

  const filteredForecastData = selectedCategory
    ? forecastData.filter((point) => point.category === selectedCategory)
    : forecastData

  // Sort the filtered data by date
  const sortedHistoricalData = [...filteredHistoricalData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  const sortedForecastData = [...filteredForecastData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  // Combine and sort data
  const combinedData = [
    ...sortedHistoricalData.map((point) => ({
      date: new Date(point.date),
      actual: point.actual,
      forecast: null,
      category: point.category,
    })),
    ...sortedForecastData.map((point) => ({
      date: new Date(point.date),
      actual: null,
      forecast: point.forecast,
      category: point.category,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  if (combinedData.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md">
        <p className="text-base text-muted-foreground">
          {selectedCategory ? `No data available for category: ${selectedCategory}` : "No data available"}
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-base">Date</TableHead>
              {!selectedCategory && <TableHead className="text-base">Category</TableHead>}
              <TableHead className="text-right text-base">Historical</TableHead>
              <TableHead className="text-right text-base">Forecast</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {combinedData.map((point, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium text-base">
                  {point.date.toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                </TableCell>
                {!selectedCategory && <TableCell className="text-base">{point.category || "N/A"}</TableCell>}
                <TableCell className="text-right text-base">
                  {point.actual !== null ? point.actual.toLocaleString() : "-"}
                </TableCell>
                <TableCell className="text-right text-base">
                  {point.forecast !== null ? point.forecast.toLocaleString() : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
