"use client"

import { notify } from "@/lib/notify"

import { useState } from "react"
import { authFetch } from "@/lib/authFetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api"

export default function CustomerForm({
  customer,
  onClose,
  onSaved,
}: any) {
  const [name, setName] = useState(customer.name || "")
  const [phone, setPhone] = useState(customer.phone || "")
  const [email, setEmail] = useState(customer.email || "")
  const [address, setAddress] = useState(customer.address || "")
  const [saving, setSaving] = useState(false)

const handleSave = async () => {
  if (!name.trim()) {
    notify.warning("Customer name is required")
    return
  }

  try {
    setSaving(true)

    const payload = { name, phone, email, address }

    const url = customer.id
      ? `${API_BASE_URL}/customers/${customer.id}`
      : `${API_BASE_URL}/customers`

    const res = await authFetch(url, {
      method: customer.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(text)
    }

    notify.success(
      customer.id
        ? "Customer updated successfully"
        : "Customer added successfully"
    )

    onSaved()
    onClose()
  } catch (e: any) {
    notify.error(e.message || "Failed to save customer")
  } finally {
    setSaving(false)
  }
}

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded p-5 w-full max-w-md space-y-3">
        <h2 className="text-lg font-semibold">
          {customer.id ? "Edit Customer" : "Add Customer"}
        </h2>

        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}
