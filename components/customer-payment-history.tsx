
"use client"

import { notify } from "@/lib/notify"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"
import { authFetch } from "@/lib/authFetch"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api"

type FilterType = "all" | "payment" | "refund"

export default function CustomerPaymentHistory({
  customer,
  onClose,
}: any) {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")

  useEffect(() => {
    loadHistory()
  }, [])

const loadHistory = async () => {
  setLoading(true)
  try {
    const res = await authFetch(
      `${API_BASE_URL}/customers/${customer.id}/payments`
    )

    if (!res.ok) {
      throw new Error("Failed to load payment history")
    }

    const data = await res.json()
    const list = Array.isArray(data) ? data : []

    setPayments(list)

    // ℹ️ Optional info toast (only once per open)
    if (list.length === 0) {
      notify.info("No payment history found for this customer")
    }
  } catch (err: any) {
    notify.error(err.message || "Failed to load payment history")
    setPayments([])
  } finally {
    setLoading(false)
  }
}


  /* ================= FILTER + SEARCH ================= */

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const text =
        `${p.receipt_no} ${p.payment_method} ${p.invoice?.invoice_number ?? ""}`
          .toLowerCase()

      if (search && !text.includes(search.toLowerCase())) {
        return false
      }

      if (filter === "payment" && Number(p.amount) <= 0) return false
      if (filter === "refund" && Number(p.amount) >= 0) return false

      return true
    })
  }, [payments, search, filter])

  /* ================= RECEIPT ACTIONS ================= */

const openReceipt = (receiptNo: string) => {
  try {
    window.open(
      `${API_BASE_URL}/receipts/${receiptNo}/print`,
      "_blank"
    )
  } catch {
    notify.error("Failed to open receipt")
  }
}

const downloadReceipt = (receiptNo: string) => {
  try {
    window.open(
      `${API_BASE_URL}/receipts/${receiptNo}/download`,
      "_blank"
    )
  } catch {
    notify.error("Failed to download receipt")
  }
}


  /* ================= UI ================= */

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg
                   w-full max-w-2xl
                   max-h-[90vh]
                   flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between border-b px-5 py-3 shrink-0">
          <div>
            <h2 className="font-semibold text-lg">
              Payment History
            </h2>
            <div className="text-xs text-muted-foreground">
              {customer.name}
            </div>
          </div>

          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* ================= FILTER BAR ================= */}
        <div className="border-b px-5 py-3 space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search receipt / method / invoice…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              All
            </Button>

            <Button
              size="sm"
              variant={filter === "payment" ? "default" : "outline"}
              onClick={() => setFilter("payment")}
            >
              Payments
            </Button>

            <Button
              size="sm"
              variant={filter === "refund" ? "default" : "outline"}
              onClick={() => setFilter("refund")}
            >
              Refunds
            </Button>
          </div>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : filteredPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payments found
            </p>
          ) : (
            filteredPayments.map((p) => {
              const isRefund = Number(p.amount) < 0

              return (
                <div
                  key={`${p.receipt_no}-${p.id}`}
                  className="rounded-lg border p-3 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <div className="font-mono text-xs">
                        {p.receipt_no}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(p.payment_date).toLocaleString()}
                      </div>
                    </div>

                    <Badge variant={isRefund ? "destructive" : "secondary"}>
                      {isRefund ? "REFUND" : "PAYMENT"}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm capitalize">
                      {p.payment_method}
                      {p.invoice?.invoice_number && (
                        <span className="text-xs text-muted-foreground">
                          {" "}
                          • Invoice {p.invoice.invoice_number}
                        </span>
                      )}
                    </div>

                    <div
                      className={`font-semibold ${
                        isRefund ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      ₹{Math.abs(Number(p.amount)).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openReceipt(p.receipt_no)}
                    >
                      View Receipt
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadReceipt(p.receipt_no)}
                    >
                      Download
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="border-t px-5 py-3 text-xs text-muted-foreground shrink-0">
          Showing {filteredPayments.length} of {payments.length} records
        </div>
      </div>
    </div>
  )
}
