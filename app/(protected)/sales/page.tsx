"use client"

import { ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"
import { authFetch } from "@/lib/authFetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
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
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Minus, Trash2 } from "lucide-react"
import SaleReturnModal from "@/components/sale-return-modal"


const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api"

/* ================= TYPES ================= */

type BackendProduct = {
  id: number
  name: string
  size: string | null
  sell_price: string
  current_stock: number
}

type BackendSale = {
  id: number
  sale_date: string
  subtotal: string
  discount: string
  total: string
  items_count: number
}

type POSProduct = {
  id: number
  name: string
  size: string
  stock: number
  mrp: number
}

type CartItem = POSProduct & {
  quantity: number
  sellingPrice: number
}

/* ================= PAGE ================= */

export default function SalesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [products, setProducts] = useState<POSProduct[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [sales, setSales] = useState<BackendSale[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingSales, setLoadingSales] = useState(false)

  const [expandedSaleId, setExpandedSaleId] = useState<number | null>(null)
  const [saleDetails, setSaleDetails] = useState<Record<number, any>>({})

  //Return
  const [activeReturnSale, setActiveReturnSale] = useState<any | null>(null)
  

  const toggleSaleDetails = async (saleId: number) => {
    if (expandedSaleId === saleId) {
      setExpandedSaleId(null)
      return
    }

    if (!saleDetails[saleId]) {
      const res = await authFetch(`${API_BASE_URL}/sales/${saleId}`)
      const data = await res.json()

      setSaleDetails((prev) => ({
        ...prev,
        [saleId]: data,
      }))
    }

    setExpandedSaleId(saleId)
  }



  /* -------- LOAD PRODUCTS -------- */
  const loadProducts = async () => {
    try {
      setLoadingProducts(true)
      const res = await authFetch(`${API_BASE_URL}/products`)
      const data: BackendProduct[] = await res.json()

      setProducts(
        data.map((p) => ({
          id: p.id,
          name: p.name,
          size: p.size || "",
          stock: p.current_stock,
          mrp: Number(p.sell_price),
        }))
      )
    } catch (err) {
      console.error(err)
      alert("Failed to load products")
    } finally {
      setLoadingProducts(false)
    }
  }

  /* -------- LOAD SALES -------- */
  const loadSales = async () => {
    try {
      setLoadingSales(true)
      const res = await authFetch(`${API_BASE_URL}/sales`)
      const data: BackendSale[] = await res.json()
      setSales(data)
    } catch (err) {
      console.error(err)
      alert("Failed to load sales")
    } finally {
      setLoadingSales(false)
    }
  }

  useEffect(() => {
    loadProducts()
    loadSales()
  }, [])

  /* ================= CART LOGIC ================= */
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addToCart = (product: POSProduct) => {
    const existing = cart.find((i) => i.id === product.id)

    if (existing) {
      if (existing.quantity >= product.stock) {
        alert("Not enough stock")
        return
      }
      setCart(
        cart.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      )
    } else {
      if (product.stock <= 0) {
        alert("Out of stock")
        return
      }
      setCart([
        ...cart,
        { ...product, quantity: 1, sellingPrice: product.mrp },
      ])
    }
  }

  const updateQuantity = (id: number, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter((i) => i.id !== id))
      return
    }

    const product = products.find((p) => p.id === id)
    if (!product || qty > product.stock) return

    setCart(cart.map((i) => (i.id === id ? { ...i, quantity: qty } : i)))
  }

  const updateSellingPrice = (id: number, price: number) => {
    setCart(
      cart.map((i) =>
        i.id === id ? { ...i, sellingPrice: Math.max(0, price) } : i
      )
    )
  }

  const subtotal = cart.reduce(
    (sum, i) => sum + i.sellingPrice * i.quantity,
    0
  )
  const finalAmount = Math.max(0, subtotal - discount)

  /* ================= SAVE SALE ================= */

  const handleSaveSale = async () => {
    if (!cart.length) return

    try {
      setIsSaving(true)

      const payload = {
        sale_date: new Date().toISOString(),
        discount,
        items: cart.map((i) => ({
          product_id: i.id,
          quantity: i.quantity,
          unit_price: i.sellingPrice,
        })),
      }

      const res = await authFetch(`${API_BASE_URL}/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Failed to save sale")
      }

      setCart([])
      setDiscount(0)
      await Promise.all([loadSales(), loadProducts()])
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Error saving sale")
    } finally {
      setIsSaving(false)
    }
  }
  /* ================= Return Submit ================= */

  const handleReturnSubmit = async (payload: any) => {
    const res = await authFetch(
      `${API_BASE_URL}/sales/${activeReturnSale.id}/returns`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    )

    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || "Return failed")
    }

    // reload sales to reflect returns
    await loadSales()
  }

  /* ================= UI ================= */

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Point of Sale</h1>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* PRODUCTS */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[350px] overflow-y-auto">
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />

              {loadingProducts ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : filteredProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No products found</p>
              ) : (
                filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="p-3 border rounded mb-2 cursor-pointer hover:bg-muted"
                  >
                    <div className="flex justify-between">
                      <span>{p.name}</span>
                      <span>₹{p.mrp}</span>
                    </div>
                    <Badge variant={p.stock > 5 ? "secondary" : "destructive"}>
                      {p.stock} left
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* BILL */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Bill</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items</p>
              ) : (
                <Table>
                  <TableBody>
                    {cart.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell>{i.name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={i.sellingPrice}
                            onChange={(e) =>
                              updateSellingPrice(i.id, Number(e.target.value))
                            }
                            className="w-27"
                          />
                        </TableCell>
                        <TableCell>
                          <Button onClick={() => updateQuantity(i.id, i.quantity - 1)}>
                            <Minus />
                          </Button>
                          {i.quantity}
                          <Button onClick={() => updateQuantity(i.id, i.quantity + 1)}>
                            <Plus />
                          </Button>
                        </TableCell>
                        <TableCell>
                          ₹{(i.sellingPrice * i.quantity).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Trash2
                            className="cursor-pointer text-destructive"
                            onClick={() =>
                              setCart(cart.filter((c) => c.id !== i.id))
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="mt-4">
                <Input
                  type="number"
                  placeholder="Discount"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value || 0))}
                />
                <div className="mt-2 font-bold">
                  Total: ₹{finalAmount.toLocaleString()}
                </div>
                <Button
                  className="mt-4 w-full"
                  disabled={!cart.length || isSaving}
                  onClick={handleSaveSale}
                >
                  {isSaving ? "Saving…" : "Save Sale"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SALES HISTORY */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>

        <CardContent>
          {loadingSales ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : sales.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales yet</p>
          ) : (
            sales.map((s) => {
              const isExpanded = expandedSaleId === s.id
              const details = saleDetails[s.id]

              const canReturn =
                details?.items?.some((item: any) => item.remaining_qty > 0) ?? false
              return (
                <div key={s.id} className="border-b">
                  {/* Summary row */}
                  <button
                    onClick={() => toggleSaleDetails(s.id)}
                    className="w-full flex justify-between items-center py-3 text-left hover:bg-muted px-2"
                  >
                    <span className="text-sm">{formatTime(s.sale_date)}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        ₹{Number(s.total).toLocaleString()}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {/* Expanded bill */}
                  {isExpanded && (
                    <div className="bg-muted/40 px-3 py-3">
                      {!details ? (
                        <p className="text-xs text-muted-foreground">
                          Loading bill…
                        </p>
                      ) : (
                        <>
                          {/* Header */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold">Bill Items</span>

                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!canReturn}
                              onClick={() => setActiveReturnSale(details)}
                            >
                              {canReturn ? "Return" : "Fully Returned"}
                            </Button>
                          </div>

                          <div className="space-y-1">
                            {details.items?.map((item: any) => (
                              <div
                                key={item.id}
                                className="flex justify-between text-sm"
                              >
                                <span>
                                  {item.product?.name} × {item.quantity}
                                </span>
                                <span>
                                  ₹{(Number(item.unit_price) * item.quantity).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>

                          
                          {/* RETURN HISTORY */}
                            {details.returns && details.returns.length > 0 && (
                              <div className="mt-4 border-t pt-3 space-y-2">
                                <div className="text-xs font-semibold text-muted-foreground">
                                  Return History
                                </div>

                                {details.returns.map((ret: any) => (
                                  <div
                                    key={ret.id}
                                    className="rounded border bg-background p-2 text-sm"
                                  >
                                    <div className="flex justify-between font-medium">
                                      <span>
                                        {new Date(ret.return_date).toLocaleDateString()}
                                      </span>
                                      <span className="text-destructive">
                                        - ₹{Number(ret.refund_amount).toLocaleString()}
                                      </span>
                                    </div>

                                    <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                                      {ret.items.map((ri: any) => (
                                        <div
                                          key={ri.id}
                                          className="flex justify-between"
                                        >
                                          <span>
                                            {ri.product?.name} × {ri.quantity}
                                          </span>
                                          <span>
                                            ₹{Number(ri.line_total).toLocaleString()}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}


                          <div className="border-t mt-2 pt-2 text-sm space-y-1">
                            <div className="flex justify-between">
                              <span>Gross Total</span>
                              <span>₹{Number(details.total).toLocaleString()}</span>
                            </div>

                            {Number(details.refund_total) > 0 && (
                              <div className="flex justify-between text-destructive">
                                <span>Refunded</span>
                                <span>
                                  - ₹{Number(details.refund_total).toLocaleString()}
                                </span>
                              </div>
                            )}

                            <div className="flex justify-between font-semibold">
                              <span>Net Total</span>
                              <span>
                                ₹{Number(details.net_total).toLocaleString()}
                              </span>                              
                            </div>
                            
                          </div>

                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
      
      <SaleReturnModal
        open={!!activeReturnSale}
        sale={activeReturnSale}
        onClose={() => setActiveReturnSale(null)}
        onSubmit={handleReturnSubmit}
      />
    </div>
  )
}
