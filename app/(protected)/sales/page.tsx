"use client"

import { notify } from "@/lib/notify"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { authFetch } from "@/lib/authFetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow, } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, Trash2, User } from "lucide-react"

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

export default function SalesPOSPage() {
  const pathname = usePathname()

  const [products, setProducts] = useState<POSProduct[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState("")
  const [discount, setDiscount] = useState(0)

  const [paidNow, setPaidNow] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState("cash")

  const [customerId, setCustomerId] = useState<number | null>(null)
  const [customers, setCustomers] = useState<any[]>([])

  const [isSaving, setIsSaving] = useState(false)

  /* -------- LOAD PRODUCTS -------- */
  const loadProducts = async () => {
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
  }

  /* -------- LOAD CUSTOMERS -------- */
  const loadCustomers = async () => {
    const res = await authFetch(`${API_BASE_URL}/customers`)
    const json = await res.json()
    setCustomers(Array.isArray(json.data) ? json.data : json)
  }

  useEffect(() => {
    loadProducts()
    loadCustomers()
  }, [])

  /* ================= CART ================= */

  const addToCart = (product: POSProduct) => {
    const existing = cart.find((i) => i.id === product.id)
    if (existing) {
      if (existing.quantity >= product.stock) return
      setCart(
        cart.map((i) =>
          i.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      )
    } else {
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
    setCart(
      cart.map((i) =>
        i.id === id ? { ...i, quantity: qty } : i
      )
    )
  }

  const updateSellingPrice = (id: number, price: number) => {
    setCart(
      cart.map((i) =>
        i.id === id
          ? { ...i, sellingPrice: Math.max(0, price) }
          : i
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

  if (paidNow > finalAmount) {
    notify.error("Paid amount cannot exceed bill total")
    return
  }

  if (paidNow < finalAmount && !customerId) {
    notify.warning("Please select a customer for credit sale")
    return
  }

  setIsSaving(true)

  const payload = {
    sale_date: new Date().toISOString(),
    customer_id: customerId,
    paid_now: paidNow,
    payment_method: paidNow > 0 ? paymentMethod : null,
    discount,
    items: cart.map((i) => ({
      product_id: i.id,
      quantity: i.quantity,
      unit_price: i.sellingPrice,
    })),
  }

  try {
    const res = await authFetch(`${API_BASE_URL}/sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const json = await res.json()
      throw new Error(json?.message || "Failed to save sale")
    }

    // ✅ SUCCESS MESSAGE (THIS WAS MISSING)
    notify.success("Sale saved successfully")

    setCart([])
    setDiscount(0)
    setPaidNow(0)
    setCustomerId(null)

    await loadProducts()
  } catch (err: any) {
    // ❌ ERROR MESSAGE
    notify.error(err.message || "Failed to save sale")
  } finally {
    setIsSaving(false)
  }
}


  /* ================= UI ================= */

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedCustomer =
    customers.find((c) => c.id === customerId) || null
// ================= DUE CALCULATIONS (ADDED) =================
const previousDue = Number(selectedCustomer?.due_balance || 0)

// Due only for THIS bill
const billDue = Math.max(0, finalAmount - paidNow)

// Total customer due AFTER this sale
const totalDueAfterSale =
  customerId ? previousDue + billDue : billDue
  
  return (
    <div className="space-y-6">
      {/* HEADER + NAV */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sales</h1>

        <div className="flex gap-2">
          <Link href="/sales">
            <Button
              size="sm"
              variant={pathname === "/sales" ? "default" : "outline"}
            >
              POS
            </Button>
          </Link>

          <Link href="/sales/history">
            <Button
              size="sm"
              variant={
                pathname === "/sales/history" ? "default" : "outline"
              }
            >
              History
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* PRODUCTS */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>

            <CardContent className="p-3">
              <Input
                placeholder="Search product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-3"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="group border rounded-lg p-3 text-left hover:border-primary hover:bg-muted transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        {p.size && (
                          <div className="text-xs text-muted-foreground">
                            Size: {p.size}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="font-semibold">₹{p.mrp}</div>
                        <Badge
                          variant={
                            p.stock > 5 ? "secondary" : "destructive"
                          }
                        >
                          {p.stock} left
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* BILL */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Bill</CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              {/* CUSTOMER */}
              <div className="border-b p-4 space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <User className="w-4 h-4" />
                  Customer
                </div>

                <select
                  value={customerId ?? ""}
                  onChange={(e) =>
                    setCustomerId(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="">Walk-in Customer</option>

                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.phone ? ` (${c.phone})` : ""}
                    </option>
                  ))}
                </select>

                {selectedCustomer && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      Previous Due: ₹{previousDue.toLocaleString()}
                    </div>

                    {billDue > 0 && (
                      <div className="font-medium text-destructive">
                        Total Due After Sale: ₹{totalDueAfterSale.toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* ITEMS */}
              {cart.length === 0 ? (
                <div className="text-center py-16 text-sm text-muted-foreground">
                  Add products to start billing
                </div>
              ) : (
                <Table>
                  <TableBody>
                    {cart.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell>{i.name}</TableCell>

                        <TableCell className="w-[110px]">
                          <Input
                            type="number"
                            value={i.sellingPrice}
                            onChange={(e) =>
                              updateSellingPrice(
                                i.id,
                                Number(e.target.value)
                              )
                            }
                            className="h-8"
                          />
                        </TableCell>

                        <TableCell className="w-[140px]">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() =>
                                updateQuantity(i.id, i.quantity - 1)
                              }
                            >
                              <Minus className="w-4 h-4" />
                            </Button>

                            <span className="w-6 text-center">
                              {i.quantity}
                            </span>

                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() =>
                                updateQuantity(i.id, i.quantity + 1)
                              }
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>

                        <TableCell className="text-right font-semibold">
                          ₹
                          {(i.sellingPrice * i.quantity).toLocaleString()}
                        </TableCell>

                        <TableCell className="w-[40px] text-right">
                          <Trash2
                            className="w-4 h-4 text-destructive cursor-pointer"
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

              {/* TOTALS */}
              <div className="border-t p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm">Discount</span>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) =>
                      setDiscount(Number(e.target.value || 0))
                    }
                    className="h-8 w-32"
                  />
                </div>

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{finalAmount.toLocaleString()}</span>
                </div>

                    <div className="flex justify-between text-sm">
                      <span>Due for this bill</span>
                      <span className="font-medium">
                        ₹{billDue.toLocaleString()}
                      </span>
                    </div>

                {/* PAYMENT */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Paid Now</span>
                    <Input
                      type="number"
                      min={0}
                      max={finalAmount}
                      value={paidNow}
                      onChange={(e) =>
                        setPaidNow(
                          Math.min(
                            finalAmount,
                            Number(e.target.value || 0)
                          )
                        )
                      }
                      className="h-8 w-40"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPaidNow(finalAmount)}
                    >
                      Pay Full
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPaidNow(0)}
                    >
                      Pay Later
                    </Button>
                  </div>

                  {paidNow > 0 && (
                    <select
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value)
                      }
                      className="w-full border rounded px-2 py-1 text-sm"
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="bank">Bank</option>
                    </select>
                  )}
                </div>

                <Button
                  className="w-full mt-2"
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
    </div>
  )
}
