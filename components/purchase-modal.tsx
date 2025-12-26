"use client"

import { useEffect, useState, useMemo } from "react"
import { authFetch } from "@/lib/authFetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api"

/* ================= TYPES ================= */

type BackendProduct = {
  id: number
  code: string
  name: string
  size: string | null
  buy_price: string
  sell_price?: string
}

type NewProductForm = {
  code: string
  name: string
  category: string
  gender: string
  size: string
  color: string
  sell_price: number
}

type PurchaseItem = {
  mode: "existing" | "new"
  productId?: number
  product?: NewProductForm
  quantity: number
  price: number
}

interface PurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (purchase: {
    purchase_date: string
    supplier: string
    items: any[]
  }) => void
  isSaving?: boolean

  /* ✅ ADDED FOR EDIT SUPPORT (NON-BREAKING) */
  purchase?: any | null
}

/* ================= COMPONENT ================= */

export default function PurchaseModal({
  isOpen,
  onClose,
  onSave,
  isSaving = false,
  purchase, // ✅ ADDITION
}: PurchaseModalProps) {

  const isEditMode = !!purchase

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [supplier, setSupplier] = useState("")
  const [items, setItems] = useState<PurchaseItem[]>([
    { mode: "existing", quantity: 1, price: 0 },
  ])
  const [products, setProducts] = useState<BackendProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [errors, setErrors] = useState<Record<number, string[]>>({})

  /* ================= LOAD PRODUCTS ================= */

  useEffect(() => {
    if (!isOpen) return

    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        const res = await authFetch(`${API_BASE_URL}/products`, {
          cache: "no-store",
        })
        const data = await res.json()
        setProducts(data)
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [isOpen])

  /* ================= EDIT PREFILL (ADDED) ================= */
  useEffect(() => {
    if (!purchase || !isOpen) return

    setDate(purchase.purchase_date?.split("T")[0] ?? "")
    setSupplier(purchase.supplier || "")

    setItems(
      purchase.items.map((i: any) => ({
        mode: "existing",
        productId: i.product_id,
        quantity: i.quantity,
        price: Number(i.unit_price),
      }))
    )

    setErrors({})
  }, [purchase, isOpen])

  /* ================= HELPERS ================= */

  const existingProductCodes = useMemo(
    () => products.map((p) => p.code.toLowerCase()),
    [products]
  )

  const updateItem = (index: number, patch: Partial<PurchaseItem>) => {
    const copy = [...items]
    copy[index] = { ...copy[index], ...patch }
    setItems(copy)
  }

  const handleAddItem = () => {
    setItems([...items, { mode: "existing", quantity: 1, price: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const totalAmount = items.reduce(
    (sum, i) => sum + i.quantity * (i.price || 0),
    0
  )

  /* ================= SAVE ================= */

  const handleSave = () => {
    const newErrors: Record<number, string[]> = {}

    items.forEach((item, index) => {
      const errs: string[] = []

      if (item.mode === "existing" && !item.productId) {
        errs.push("Please select an existing product.")
      }

      if (!Number.isFinite(item.price)) {
        errs.push("Purchase price (buy) is required.")
      }

      if (item.quantity <= 0) {
        errs.push("Quantity must be at least 1.")
      }

      if (errs.length) newErrors[index] = errs
    })

    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }

    setErrors({})

    const payloadItems = items.map((i) => ({
      product_id: i.productId,
      quantity: Number(i.quantity),
      unit_price: Number(i.price),
    }))

    onSave({
      purchase_date: date,
      supplier: supplier || "Unnamed Supplier",
      items: payloadItems,
    })
  }

  /* ================= UI ================= */

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {purchase ? "Edit Purchase Order" : "Add Purchase Order"}
          </DialogTitle>
          <DialogDescription>
            Select existing products or create new ones inline
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Supplier</Label>
              <Input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </div>
          </div>

          {/* Line Items */}
          {items.map((item, index) => (
            <div key={index} className="rounded border p-3 space-y-3">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={item.mode === "existing" ? "default" : "outline"}
                  onClick={() =>
                    updateItem(index, {
                      mode: "existing",
                      product: undefined,
                    })
                  }
                >
                  Existing
                </Button>
                <Button
  size="sm"
  variant={item.mode === "new" ? "default" : "outline"}
  disabled={isEditMode}
  title={
    isEditMode
      ? "New products cannot be added while editing a purchase"
      : undefined
  }
  onClick={() => {
    if (isEditMode) return

    updateItem(index, {
      mode: "new",
      product: {
        code: "",
        name: "",
        category: "",
        gender: "unisex",
        size: "",
        color: "",
        sell_price: 0,
      },
    })
  }}
>
  New Product
</Button>

              </div>

              {/* Existing Product */}
{item.mode === "existing" && (
  <div>
    <Label>Product</Label>

    {/* 🔒 EDIT MODE: DISPLAY ONLY */}
    {isEditMode ? (
      <div className="px-3 py-2 border rounded bg-muted text-sm">
        {
          products.find((p) => p.id === item.productId)?.code
        }
        {" - "}
        {
          products.find((p) => p.id === item.productId)?.name
        }
      </div>
    ) : (
      /* 🆕 CREATE MODE: SELECTABLE */
      <Select
        value={item.productId ? String(item.productId) : ""}
        onValueChange={(v) => {
          const product = products.find(
            (p) => p.id === Number(v)
          )
          updateItem(index, {
            productId: Number(v),
            price: Number(product?.buy_price || 0),
          })
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select product" />
        </SelectTrigger>
        <SelectContent>
          {products.map((p) => (
            <SelectItem key={p.id} value={String(p.id)}>
              {p.code} - {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
  </div>
)}


              {/* New Product */}
              {item.mode === "new" && item.product && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Product Code</Label>
                    <Input
                      value={item.product.code}
                      onChange={(e) =>
                        updateItem(index, {
                          product: {
                            ...item.product!,
                            code: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Product Name</Label>
                    <Input
                      value={item.product.name}
                      onChange={(e) =>
                        updateItem(index, {
                          product: {
                            ...item.product!,
                            name: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Category</Label>
                    <Input
                      value={item.product.category}
                      onChange={(e) =>
                        updateItem(index, {
                          product: {
                            ...item.product!,
                            category: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Sell Price</Label>
                    <Input
                      type="number"
                      value={item.product.sell_price}
                      onChange={(e) =>
                        updateItem(index, {
                          product: {
                            ...item.product!,
                            sell_price: Number(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, {
                        quantity: Number(e.target.value) || 1,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Purchase Price (Buy)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={item.price}
                    onChange={(e) =>
                      updateItem(index, {
                        price: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveItem(index)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>

              {errors[index]?.map((err, i) => (
                <p key={i} className="text-xs text-destructive">
                  {err}
                </p>
              ))}
            </div>
          ))}

          <Button variant="outline" onClick={handleAddItem}>
            <Plus className="w-4 h-4 mr-1" /> Add Item
          </Button>

          <div className="flex justify-between font-bold border-t pt-3">
            <span>Total</span>
            <span>₹{totalAmount.toLocaleString()}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || loadingProducts}>
            {isSaving
              ? "Saving..."
              : purchase
              ? "Update Purchase"
              : "Save Purchase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
