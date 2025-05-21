"use client"

import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import { generateCategoryData } from "@/lib/forecast-utils"

export function SampleDataButton() {
  const handleDownloadSample = () => {
    // Create sample data with categories
    const categoryData = generateCategoryData(24)
    const sampleData = categoryData.flatMap((category) =>
      category.data.map((point) => ({
        date: point.date,
        value: point.actual,
        category: category.name,
      })),
    )

    // Sort by date
    sampleData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Convert to CSV
    const headers = ["date", "value", "category"]
    const csvContent = [
      headers.join(","),
      ...sampleData.map((point) => {
        const date = new Date(point.date).toISOString().split("T")[0]
        return `${date},${point.value},${point.category}`
      }),
    ].join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sample_sales_data.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownloadSample} className="flex items-center">
      <FileDown className="h-4 w-4 mr-2" />
      Download Sample Data
    </Button>
  )
}
