"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

type SaleItem = {
  id: number
  quantity: number
  unit_price: number
  product?: {
    name: string
  }
}

type Props = {
  open: boolean
  onClose: () => void
  sale: any | null
  onSubmit: (payload: any) => Promise<void>
}

export default function SaleReturnModal({
  open,
  onClose,
  sale,
  onSubmit,
}: Props) {
  const [items, setItems] = useState<any[]>([])
  const [reason, setReason] = useState("")
  const [refundMethod, setRefundMethod] = useState("cash")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!sale) return

    setItems(
      sale.items.map((i: SaleItem) => ({
        sale_item_id: i.id,
        name: i.product?.name,
        maxQty: i.quantity,
        quantity: 0,
        unit_price: Number(i.unit_price),
      }))
    )
  }, [sale])

  const refundTotal = items.reduce(
    (sum, i) => sum + i.quantity * i.unit_price,
    0
  )

  const handleSubmit = async () => {
    const payload = {
      items: items
        .filter((i) => i.quantity > 0)
        .map((i) => ({
          sale_item_id: i.sale_item_id,
          quantity: i.quantity,
        })),
      refund_method: refundMethod,
      reason,
    }

    if (!payload.items.length) {
      alert("Select at least one item to return")
      return
    }

    try {
      setSaving(true)
      await onSubmit(payload)
      onClose()
    } catch (err: any) {
      alert(err.message || "Failed to process return")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
        open={open}
        onOpenChange={(isOpen) => {
            if (!isOpen) onClose()
        }}
        >

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Return Items</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.sale_item_id}
              className="flex justify-between items-center gap-2"
            >
              <span className="text-sm flex-1">
                {item.name}
              </span>

              <Input
                type="number"
                min={0}
                max={item.maxQty}
                value={item.quantity}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((p) =>
                      p.sale_item_id === item.sale_item_id
                        ? {
                            ...p,
                            quantity: Math.min(
                              item.maxQty,
                              Number(e.target.value)
                            ),
                          }
                        : p
                    )
                  )
                }
                className="w-20"
              />

              <span className="text-sm">
                ₹{(item.quantity * item.unit_price).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t pt-3 space-y-2 text-sm">
          <div className="flex justify-between font-semibold">
            <span>Refund Total</span>
            <span>₹{refundTotal.toLocaleString()}</span>
          </div>

          <div>
            <Label>Refund Method</Label>
            <Input
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value)}
              placeholder="cash / UPI / card"
            />
          </div>

          <div>
            <Label>Reason</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Size issue, defect, etc."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Processing…" : "Confirm Return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
