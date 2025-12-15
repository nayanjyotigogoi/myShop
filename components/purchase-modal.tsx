"use client"

import { useEffect, useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api"

type BackendProduct = {
  id: number
  code: string
  name: string
  size: string | null
  buy_price: string
}

interface PurchaseItem {
  productId: number | ""
  quantity: number
  price: number
}

interface PurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (purchase: {
    date: string
    supplier: string
    items: PurchaseItem[]
  }) => void
  isSaving?: boolean
}

export default function PurchaseModal({
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}: PurchaseModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [supplier, setSupplier] = useState("")
  const [items, setItems] = useState<PurchaseItem[]>([{ productId: "", quantity: 1, price: 0 }])
  const [products, setProducts] = useState<BackendProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Load products when modal opens
  useEffect(() => {
    if (!isOpen) return

    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        const res = await fetch(`${API_BASE_URL}/products`, { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load products")
        const data: any[] = await res.json()
        const mapped: BackendProduct[] = data.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          size: p.size || "",
          buy_price: p.buy_price,
        }))
        setProducts(mapped)
      } catch (err) {
        console.error(err)
        alert("Failed to load products for purchase")
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [isOpen])

  const handleAddItem = () => {
    setItems([...items, { productId: "", quantity: 1, price: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * (item.price || 0), 0)

  const handleSave = () => {
    // Basic validation
    const validItems = items.filter(
      (item) => item.productId !== "" && item.quantity > 0 && item.price >= 0
    )

    if (!validItems.length) {
      alert("Please add at least one valid line item with product, quantity, and price.")
      return
    }

    onSave({
      date,
      supplier: supplier || "Unnamed Supplier",
      items: validItems,
    })

    // Reset form
    setDate(new Date().toISOString().split("T")[0])
    setSupplier("")
    setItems([{ productId: "", quantity: 1, price: 0 }])
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Purchase Order</DialogTitle>
          <DialogDescription>Create a new purchase order from supplier</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-base font-medium">Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 h-9"
              />
            </div>

            <div>
              <Label className="text-base font-medium">Supplier (Optional)</Label>
              <Input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Supplier name"
                className="mt-1 h-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-medium">Line Items</Label>
              <Button variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {items.map((item, index) => {
                const selectedProduct = products.find((p) => p.id === item.productId)
                const suggestedPrice = selectedProduct ? Number(selectedProduct.buy_price) : 0

                return (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Product</Label>
                      <Select
                        value={item.productId ? String(item.productId) : ""}
                        onValueChange={(value) =>
                          handleItemChange(index, "productId", Number(value))
                        }
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder={loadingProducts ? "Loading..." : "Select product"} />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.code} - {p.name}
                              {p.size ? ` (${p.size})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-20">
                      <Label className="text-xs text-muted-foreground">Qty</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "quantity",
                            Number.parseInt(e.target.value) || 1
                          )
                        }
                        placeholder="Qty"
                        className="h-8 text-sm"
                        min={1}
                      />
                    </div>

                    <div className="w-24">
                      <Label className="text-xs text-muted-foreground">Price</Label>
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "price",
                            Number.parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder={suggestedPrice ? String(suggestedPrice) : "Price"}
                        className="h-8 text-sm"
                        min={0}
                      />
                    </div>

                    <div className="w-24 text-right text-sm font-medium">
                      <Label className="text-xs text-muted-foreground block">Line</Label>
                      ₹{(item.quantity * (item.price || 0)).toLocaleString()}
                    </div>

                    <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(index)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount:</span>
              <span className="text-primary">₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || loadingProducts}>
            {isSaving ? "Saving..." : "Save Purchase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
