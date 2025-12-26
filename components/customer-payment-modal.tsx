"use client"
import { notify } from "@/lib/notify"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authFetch } from "@/lib/authFetch"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api"

export default function CustomerPaymentModal({
  customer,
  sale, // 🔹 ONLY FOR DISPLAY
  onClose,
  onPaid,
}: any) {
  const [amount, setAmount] = useState<number>(0)
  const [method, setMethod] = useState("cash")
  const [saving, setSaving] = useState(false)

  const customerDue = Number(customer?.due_balance || 0)

  const handlePay = async () => {
    if (customerDue <= 0) {
      notify.info("Customer has no due")
      return
    }

    if (amount <= 0) {
      notify.warning("Enter a valid payment amount")
      return
    }

    if (amount > customerDue) {
      notify.error("Payment exceeds total due")
      return
    }

    setSaving(true)

    try {
      const res = await authFetch(`${API_BASE_URL}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customer.id, // ✅ ONLY CUSTOMER
          amount,
          payment_method: method,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Payment failed")
      }
      
      notify.success("Payment received successfully")
      onPaid()
      onClose()
    } catch (err: any) {
       notify.error(err.message || "Payment failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded p-5 w-full max-w-sm space-y-4">
        <h2 className="font-semibold text-lg">
          Receive Payment – {customer.name}
        </h2>

        {/* DISPLAY CONTEXT ONLY */}
        {sale?.bill_number && (
          <div className="text-sm text-muted-foreground">
            Latest Invoice: {sale.bill_number}
          </div>
        )}

        {/* ✅ CORRECT DUE */}
        <div className="text-sm text-muted-foreground">
          Total Due: ₹{customerDue.toLocaleString()}
        </div>

        <Input
          type="number"
          min={1}
          max={customerDue}
          placeholder="Amount received"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
        />

        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
        >
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
          <option value="bank">Bank Transfer</option>
        </select>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={handlePay}>
            {saving ? "Saving…" : "Receive"}
          </Button>
        </div>
      </div>
    </div>
  )
}
