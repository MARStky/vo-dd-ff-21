import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileSpreadsheet } from "lucide-react"

export function FileFormatGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileSpreadsheet className="h-5 w-5" />
          <span>Data Import Guide</span>
        </CardTitle>
        <CardDescription className="text-base">
          How to format your CSV file for importing historical sales data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium mb-2">Required Format</h3>
            <p className="text-base text-muted-foreground">Your CSV file should include at minimum these columns:</p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-base">Column</TableHead>
                <TableHead className="text-base">Description</TableHead>
                <TableHead className="text-base">Example</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-base">date</TableCell>
                <TableCell className="text-base">Date in YYYY-MM-DD format</TableCell>
                <TableCell className="text-base">2023-01-15</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-base">
                  value <span className="text-muted-foreground">or sales</span>
                </TableCell>
                <TableCell className="text-base">Numeric sales value</TableCell>
                <TableCell className="text-base">1250</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div>
            <h3 className="text-base font-medium mb-2">Example CSV</h3>
            <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
              date,value,category
              <br />
              2023-01-01,1250,Electronics
              <br />
              2023-02-01,1340,Electronics
              <br />
              2023-03-01,1100,Electronics
              <br />
              2023-04-01,1420,Electronics
            </pre>
          </div>

          <div>
            <h3 className="text-base font-medium mb-2">Tips</h3>
            <ul className="text-base space-y-1 list-disc pl-5">
              <li>Ensure dates are in chronological order</li>
              <li>Include at least 12 months of historical data for best results</li>
              <li>The system will automatically handle missing months</li>
              <li>Additional columns will be preserved but not used in forecasting</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
