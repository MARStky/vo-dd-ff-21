import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Brain, BarChart3, Database, Cpu } from "lucide-react"

export function ModelInfoCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5" />
          <span>SageMaker Autopilot Model</span>
        </CardTitle>
        <CardDescription className="text-base">Automatically trained ML model for demand forecasting</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="text-base">
              Overview
            </TabsTrigger>
            <TabsTrigger value="features" className="text-base">
              Features
            </TabsTrigger>
            <TabsTrigger value="metrics" className="text-base">
              Metrics
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-4">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span className="text-base text-muted-foreground">Model Type</span>
                <Badge variant="outline" className="text-base">
                  XGBoost
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-base text-muted-foreground">Training Data</span>
                <span className="text-base">24 months</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base text-muted-foreground">Last Trained</span>
                <span className="text-base">Today</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base text-muted-foreground">Status</span>
                <Badge className="bg-green-500 text-base">Active</Badge>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="features" className="pt-4">
            <ul className="grid gap-2 text-base">
              <li className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span>Historical sales data</span>
              </li>
              <li className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span>Seasonal patterns</span>
              </li>
              <li className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <span>Promotional events</span>
              </li>
              <li className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span>Inventory levels</span>
              </li>
            </ul>
          </TabsContent>
          <TabsContent value="metrics" className="pt-4">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span className="text-base text-muted-foreground">Training MAPE</span>
                <span className="text-base">4.32%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base text-muted-foreground">Validation MAPE</span>
                <span className="text-base">5.87%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base text-muted-foreground">Training Time</span>
                <span className="text-base">5 seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base text-muted-foreground">Model Size</span>
                <span className="text-base">4.2 MB</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
