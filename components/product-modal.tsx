"use client"

import { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (product: any) => void
  initialData?: any
}

export default function ProductModal({ isOpen, onClose, onSave, initialData }: ProductModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "",        // product type (T-Shirt, Jeans, etc.)
    gender: "Unisex",    // target group: Male / Female / Boys / Girls / Unisex (label)
    size: "",
    color: "",
    buyPrice: "",
    sellPrice: "",
    stock: "",
  })

  const isEdit = !!initialData

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || "",
        name: initialData.name || "",
        category: initialData.category || "",
        gender: initialData.gender || "Unisex", // coming from UIProduct ("Male", "Female", etc.)
        size: initialData.size || "",
        color: initialData.color || "",
        buyPrice: String(initialData.buyPrice ?? ""),
        sellPrice: String(initialData.sellPrice ?? ""),
        stock: String(initialData.stock ?? ""),
      })
    } else {
      setFormData({
        code: "",
        name: "",
        category: "",
        gender: "Unisex",
        size: "",
        color: "",
        buyPrice: "",
        sellPrice: "",
        stock: "",
      })
    }
  }, [initialData, isOpen])

  const handleSave = () => {
    onSave({
      ...formData,
      buyPrice: Number(formData.buyPrice || 0),
      sellPrice: Number(formData.sellPrice || 0),
      stock: Number(formData.stock || 0),
    })

    setFormData({
      code: "",
      name: "",
      category: "",
      gender: "Unisex",
      size: "",
      color: "",
      buyPrice: "",
      sellPrice: "",
      stock: "",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>Fill in the product details below</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Item Code</Label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., TS001"
              className="mt-1 h-9"
            />
          </div>

          <div>
            <Label className="text-base font-medium">Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Basic T-Shirt"
              className="mt-1 h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-base font-medium">Category</Label>
              {/* Product type, free text for now */}
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., T-Shirt, Jeans"
                className="mt-1 h-9"
              />
            </div>

            <div>
              <Label className="text-base font-medium">Target Group</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Boys">Boys</SelectItem>
                  <SelectItem value="Girls">Girls</SelectItem>
                  <SelectItem value="Unisex">Unisex</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-base font-medium">Size</Label>
              <Input
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="e.g., 4-6 years, M, L, XL"
                className="mt-1 h-9"
              />
            </div>

            <div>
              <Label className="text-base font-medium">Color</Label>
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="e.g., White"
                className="mt-1 h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-base font-medium">Buy Price (per piece)</Label>
              <Input
                type="number"
                value={formData.buyPrice}
                onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                placeholder="₹0"
                className="mt-1 h-9"
              />
            </div>

            <div>
              <Label className="text-base font-medium">Sell Price (per piece)</Label>
              <Input
                type="number"
                value={formData.sellPrice}
                onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                placeholder="₹0"
                className="mt-1 h-9"
              />
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">
              Opening Stock{" "}
              {isEdit && (
                <span className="text-xs text-muted-foreground">
                  (only used when creating)
                </span>
              )}
            </Label>
            <Input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              placeholder="0"
              className="mt-1 h-9"
              disabled={isEdit} // don't change stock here on edit
            />
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{initialData ? "Update" : "Add"} Product</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
