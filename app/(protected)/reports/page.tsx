"use client"

import { useEffect, useMemo, useState } from "react"
import { authFetch } from "@/lib/authFetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api"

/* ================= TYPES ================= */

type Period = "daily" | "monthly" | "yearly"

type Summary = {
  sales: number
  cost: number
  profit: number
  invoices: number
  products_sold: number
}

type ChartRow = {
  label: string
  sales: number
  profit: number
}

type ProductRow = {
  id: number
  name: string
  units_sold: number
  revenue: number
}

/* ================= PAGE ================= */

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("monthly")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const [summary, setSummary] = useState<Summary | null>(null)
  const [chartData, setChartData] = useState<ChartRow[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 8

  /* ================= LOAD REPORT ================= */

  const loadReport = async () => {
    const q = `period=${period}&from=${from}&to=${to}`

    const [s, c, p] = await Promise.all([
      authFetch(`${API_BASE_URL}/reports/summary?${q}`),
      authFetch(`${API_BASE_URL}/reports/chart?${q}`),
      authFetch(`${API_BASE_URL}/reports/top-products?${q}`),
    ])

    const summaryJson = await s.json()
    const chartJson = await c.json()
    const productsJson = await p.json()

    setSummary(summaryJson ?? null)

    // ✅ CRITICAL FIX — normalize chart data
    setChartData(
      Array.isArray(chartJson)
        ? chartJson
        : Array.isArray(chartJson?.data)
        ? chartJson.data
        : []
    )

    setProducts(Array.isArray(productsJson) ? productsJson : [])
  }

  useEffect(() => {
    loadReport()
  }, [period])

  /* ================= FILTERED PRODUCTS ================= */

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [products, search])

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE)

  const paginated = filteredProducts.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  /* ================= UI ================= */

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reports</h1>

        <div className="flex gap-2">
          {(["daily", "monthly", "yearly"] as Period[]).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? "default" : "outline"}
              onClick={() => setPeriod(p)}
            >
              {p.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* DATE FILTER */}
      <Card>
        <CardContent className="grid md:grid-cols-3 gap-4 pt-6">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Button onClick={loadReport}>Apply</Button>
        </CardContent>
      </Card>

      {/* ================= DASHBOARD MINI WIDGETS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Widget title="Sales" value={summary?.sales} />
        <Widget title="Profit" value={summary?.profit} highlight />
        <Widget title="Invoices" value={summary?.invoices} />
        <Widget title="Products Sold" value={summary?.products_sold} />
        <Widget
          title="Margin"
          value={
            summary
              ? Math.round((summary.profit / summary.sales) * 100)
              : 0
          }
          suffix="%"
        />
      </div>

      {/* ================= CHARTS ================= */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sales" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profit Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="profit" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ================= TOP PRODUCTS ================= */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Top Products</CardTitle>
          <Input
            placeholder="Search product…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-60"
          />
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.map((p) => (
                <TableRow key={`${p.id}-${p.name}`}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell className="text-right">{p.units_sold}</TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{p.revenue.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ================= SMALL COMPONENTS ================= */

function Widget({
  title,
  value,
  highlight,
  suffix = "",
}: {
  title: string
  value?: number
  highlight?: boolean
  suffix?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold ${
            highlight ? "text-green-600" : ""
          }`}
        >
          {value?.toLocaleString() ?? 0}
          {suffix}
        </div>
      </CardContent>
    </Card>
  )
}
