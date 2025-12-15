"use client"

import { useEffect, useState } from "react"
import { authFetch } from "@/lib/authFetch" // ✅ ADDED
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Search } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api"

// ---- Types from backend ----
type BackendProduct = {
  id: number
  code: string
  name: string
  category: string
  gender: string | null
  size: string | null
  color: string | null
  buy_price: string
  sell_price: string // MRP / shop selling price
  current_stock: number
}

type BackendSale = {
  id: number
  sale_date: string
  subtotal: string
  discount: string
  total: string
  items_count: number
  total_items: string | number
}

export default function DashboardPage() {
  // Products + sales
  const [products, setProducts] = useState<BackendProduct[]>([])
  const [sales, setSales] = useState<BackendSale[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingSales, setLoadingSales] = useState(false)

  // Product lookup (for salesperson)
  const [productSearchTerm, setProductSearchTerm] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<BackendProduct | null>(null)

  /* ---- Load products ---- */
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true)
        const res = await authFetch(`${API_BASE_URL}/products`) // ✅ FIXED
        if (!res.ok) throw new Error("Failed to load products")
        const data: BackendProduct[] = await res.json()
        setProducts(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingProducts(false)
      }
    }

    const loadSales = async () => {
      try {
        setLoadingSales(true)
        const res = await authFetch(`${API_BASE_URL}/sales`) // ✅ FIXED
        if (!res.ok) throw new Error("Failed to load sales")
        const data: BackendSale[] = await res.json()
        setSales(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingSales(false)
      }
    }

    loadProducts()
    loadSales()
  }, [])

  // ---- Helpers for date-based calcs ----
  const today = new Date()
  const todayISODate = today.toISOString().slice(0, 10) // YYYY-MM-DD

  const isSameDate = (iso: string, ymd: string) => iso.slice(0, 10) === ymd

  // ---- Today’s sales (from real sales) ----
  const todaysSales = sales.filter((s) => isSameDate(s.sale_date, todayISODate))
  const todaySalesTotal = todaysSales.reduce(
    (sum, sale) => sum + Number(sale.total || 0),
    0
  )

  // ---- Total stock value (from products) ----
  // You can switch to sell_price if you prefer “selling value”
  const totalStockValue = products.reduce((sum, p) => {
    const cost = Number(p.buy_price || 0)
    return sum + cost * p.current_stock
  }, 0)

  // ---- Low stock items from products ----
  const LOW_STOCK_THRESHOLD = 3
  const lowStockProducts = products.filter(
    (p) => p.current_stock > 0 && p.current_stock <= LOW_STOCK_THRESHOLD
  )
  const lowStockCount = lowStockProducts.length

  // ---- Sales trend (last 7 days) from real sales ----
  type SalesTrendPoint = { day: string; sales: number }

  const salesTrendData: SalesTrendPoint[] = (() => {
    const points: SalesTrendPoint[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(today.getDate() - i)
      const ymd = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString(undefined, { weekday: "short" })
      const totalForDay = sales
        .filter((s) => isSameDate(s.sale_date, ymd))
        .reduce((sum, s) => sum + Number(s.total || 0), 0)
      points.push({ day: label, sales: totalForDay })
    }
    return points
  })()

  // ---- “By category” chart from product stock value ----
  const categoryToValue: Record<string, number> = {}
  products.forEach((p) => {
    const category = p.category || "Uncategorized"
    const value = Number(p.sell_price || 0) * p.current_stock
    categoryToValue[category] = (categoryToValue[category] || 0) + value
  })

  const categoryChartData = Object.entries(categoryToValue).map(
    ([category, value]) => ({
      category,
      stockValue: value,
    })
  )

  // ---- Product lookup filtering ----
  const filteredProducts = products.filter((p) => {
    const term = productSearchTerm.toLowerCase().trim()
    if (!term) return true
    return (
      p.name.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term) ||
      (p.category && p.category.toLowerCase().includes(term)) ||
      (p.size && p.size.toLowerCase().includes(term))
    )
  })

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-balance">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Live overview from your database, plus quick price lookup for your sales team.
        </p>
      </div>

      {/* Product Price Lookup (for salesperson + customer view) */}
      <Card>
        <CardHeader>
          <CardTitle>Check Price</CardTitle>
          <CardDescription>
            Search any product and Check the MRP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Search + list */}
            <div className="lg:col-span-2 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, code, category, size..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>

              <div className="border rounded max-h-64 overflow-y-auto">
                {loadingProducts ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Loading products...
                  </p>
                ) : products.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No products available.
                  </p>
                ) : filteredProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No products match your search.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead className="text-right">MRP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.slice(0, 30).map((p) => (
                        <TableRow
                          key={p.id}
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => setSelectedProduct(p)}
                        >
                          <TableCell className="font-medium">
                            {p.name}
                            {p.code && (
                              <span className="block text-xs text-muted-foreground">
                                Code: {p.code}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{p.category}</TableCell>
                          <TableCell>{p.size}</TableCell>
                          <TableCell className="text-right">
                            ₹{Number(p.sell_price).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tip: Click a row to show a big price card on the right for the customer.
              </p>
            </div>

            {/* Right: Big price card for selected product */}
            <div className="lg:col-span-1">
              {selectedProduct ? (
                <Card className="h-full flex flex-col justify-between bg-muted/40">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {selectedProduct.name}
                    </CardTitle>
                    <CardDescription className="space-y-1 text-xs">
                      {selectedProduct.code && <div>Code: {selectedProduct.code}</div>}
                      {selectedProduct.category && <div>Category: {selectedProduct.category}</div>}
                      {selectedProduct.size && <div>Size: {selectedProduct.size}</div>}
                      {selectedProduct.color && <div>Color: {selectedProduct.color}</div>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-xs text-muted-foreground">MRP / Shop Price</div>
                    <div className="text-4xl font-bold tracking-tight">
                      ₹{Number(selectedProduct.sell_price).toLocaleString()}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Available stock</span>
                      <Badge
                        variant={
                          selectedProduct.current_stock > 0 ? "secondary" : "destructive"
                        }
                      >
                        {selectedProduct.current_stock} pcs
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      This is the reference shop price. 
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground border rounded">
                  Select a product on the left to show its price here.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards (now from real DB data) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">
              ₹{todaySalesTotal.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sum of all bills created today.
            </p>
          </CardContent>
        </Card>

        {/* For now we don't have real profit aggregates in this component.
           You can add one later via a dedicated API or using SaleItem.line_profit. */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">
              ₹{totalStockValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on buy price × current stock.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-accent">
              {lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Items with ≤ {LOW_STOCK_THRESHOLD} pcs in stock.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">
              {products.length.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active SKUs in inventory.</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert */}
      {lowStockCount > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have <strong>{lowStockCount} items</strong> with low stock levels (≤{" "}
            {LOW_STOCK_THRESHOLD} pcs). Consider placing new purchase orders.
          </AlertDescription>
        </Alert>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend (Last 7 Days)</CardTitle>
            <CardDescription>Based on real bill totals.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loadingSales ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Loading sales data...
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="rgb(var(--color-primary))"
                      strokeWidth={2}
                      name="Sales (₹)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Value by Category</CardTitle>
            <CardDescription>
              Current stock value (sell price × quantity) grouped by category.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loadingProducts ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Loading product data...
                </p>
              ) : categoryChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No category data available.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="stockValue"
                      fill="rgb(var(--color-primary))"
                      name="Stock Value (₹)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Table (from real products) */}
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Items</CardTitle>
          <CardDescription>Items that need restocking soon.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingProducts ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-muted-foreground py-4"
                    >
                      Loading products...
                    </TableCell>
                  </TableRow>
                ) : lowStockProducts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-muted-foreground py-4"
                    >
                      No low stock items 🎉
                    </TableCell>
                  </TableRow>
                ) : (
                  lowStockProducts.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.name}
                        {item.code && (
                          <span className="block text-xs text-muted-foreground">
                            Code: {item.code}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.size}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">
                          {item.current_stock} pcs
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
