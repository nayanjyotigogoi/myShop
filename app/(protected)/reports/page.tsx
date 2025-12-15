"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"

// Mock data
const reportData = [
  { date: "2024-12-03", sales: 12500, cost: 8750, profit: 3750 },
  { date: "2024-12-02", sales: 11200, cost: 7840, profit: 3360 },
  { date: "2024-12-01", sales: 9800, cost: 6860, profit: 2940 },
  { date: "2024-11-30", sales: 14300, cost: 10010, profit: 4290 },
  { date: "2024-11-29", sales: 8500, cost: 5950, profit: 2550 },
]

const topProducts = [
  { id: 1, name: "Basic T-Shirt", sold: 125, revenue: 43750 },
  { id: 2, name: "Denim Shorts", sold: 89, revenue: 53311 },
  { id: 3, name: "Summer Dress", sold: 67, revenue: 53533 },
  { id: 4, name: "Jacket", sold: 45, revenue: 53955 },
  { id: 5, name: "Sweater", sold: 34, revenue: 30566 },
]

export default function ReportsPage() {
  const [startDate, setStartDate] = useState("2024-11-29")
  const [endDate, setEndDate] = useState("2024-12-03")

  const totalSales = reportData.reduce((sum, d) => sum + d.sales, 0)
  const totalCost = reportData.reduce((sum, d) => sum + d.cost, 0)
  const totalProfit = reportData.reduce((sum, d) => sum + d.profit, 0)
  const profitMargin = ((totalProfit / totalSales) * 100).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">Reports</h1>
        <p className="text-muted-foreground mt-2">Analyze your business performance</p>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-2 h-10"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-2 h-10" />
            </div>
            <div className="flex items-end">
              <Button className="w-full">Apply Filter</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">₹{totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{reportData.length} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Purchase Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">₹{totalCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((totalCost / totalSales) * 100).toFixed(1)}% of sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-accent">₹{totalProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{profitMargin}% margin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Daily Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">
              ₹{Math.round(totalProfit / reportData.length).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per day</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Report</CardTitle>
          <CardDescription>Daily sales, costs, and profit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Purchase Cost</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell className="font-medium">{row.date}</TableCell>
                    <TableCell className="text-right">₹{row.sales.toLocaleString()}</TableCell>
                    <TableCell className="text-right">₹{row.cost.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium text-accent">₹{row.profit.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{((row.profit / row.sales) * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Top Selling Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performing items</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Units Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">{product.sold}</TableCell>
                    <TableCell className="text-right font-medium">₹{product.revenue.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
