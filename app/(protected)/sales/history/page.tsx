"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { authFetch } from "@/lib/authFetch"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChevronDown,
  FileText,
  Download,
  Printer,
  CreditCard,
  Package,
  User,
  Undo2,
} from "lucide-react"
import SaleReturnModal from "@/components/sale-return-modal"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api"

/* ================= TYPES ================= */

type BackendSale = {
  id: number
  sale_date: string
  total: string
  payment_status?: "paid" | "partial" | "unpaid"
}

/* ================= PAGE ================= */

export default function SalesHistoryPage() {
  const pathname = usePathname()

  const [sales, setSales] = useState<BackendSale[]>([])
  const [loadingSales, setLoadingSales] = useState(false)

  const [expandedSaleId, setExpandedSaleId] = useState<number | null>(null)
  const [saleDetails, setSaleDetails] = useState<Record<number, any>>({})

  /* RETURN MODAL */
  const [activeReturnSale, setActiveReturnSale] = useState<any | null>(null)

  /* FILTERS */
  const [search, setSearch] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  /* PAGINATION */
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  /* ================= LOAD SALES ================= */

  const loadSales = async () => {
    setLoadingSales(true)
    const res = await authFetch(`${API_BASE_URL}/sales`)
    const data = await res.json()
    setSales(data)
    setLoadingSales(false)
  }

  useEffect(() => {
    loadSales()
  }, [])

  /* ================= TOGGLE DETAILS ================= */

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

  /* ================= RETURN SUBMIT ================= */

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

    setActiveReturnSale(null)
    await loadSales()
  }

  /* ================= FILTERING ================= */

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const saleDate = new Date(s.sale_date)

      if (fromDate && saleDate < new Date(fromDate)) return false
      if (toDate && saleDate > new Date(toDate + "T23:59:59")) return false

      if (search) {
        return s.total.includes(search)
      }

      return true
    })
  }, [sales, search, fromDate, toDate])

  const totalPages = Math.ceil(filteredSales.length / pageSize)

  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [search, fromDate, toDate])

  /* ================= HELPERS ================= */

  const formatDateTime = (date: string) =>
    new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    })

  /* ================= UI ================= */

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
              variant={pathname === "/sales/history" ? "default" : "outline"}
            >
              History
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
        </CardHeader>

        <CardContent>
          {loadingSales ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading sales…
            </div>
          ) : paginatedSales.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No sales found
            </div>
          ) : (
            <div className="divide-y rounded-lg border">
              {paginatedSales.map((s) => {
                const isExpanded = expandedSaleId === s.id
                const details = saleDetails[s.id]

                const canReturn =
                  details?.items?.some(
                    (i: any) => i.remaining_qty > 0
                  ) ?? false

                return (
                  <div key={s.id}>
                    {/* SUMMARY */}
                    <button
                      onClick={() => toggleSaleDetails(s.id)}
                      className="w-full flex justify-between items-center px-4 py-3 hover:bg-muted/50"
                    >
                      <div>
                        <div className="font-medium text-sm">
                          {formatDateTime(s.sale_date)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ₹{Number(s.total).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            s.payment_status === "paid"
                              ? "secondary"
                              : s.payment_status === "partial"
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {s.payment_status}
                        </Badge>

                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* DETAILS */}
                    {isExpanded && details && (
                      <div className="bg-muted/40 px-4 py-4 space-y-5 text-sm">
                        {/* CUSTOMER + RETURN ACTION */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium">
                              {details.customer?.name || "Walk-in Customer"}
                            </span>
                            {details.customer?.phone && (
                              <span className="text-muted-foreground">
                                ({details.customer.phone})
                              </span>
                            )}
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canReturn}
                            onClick={() => setActiveReturnSale(details)}
                          >
                            {canReturn ? "Return" : "Fully Returned"}
                          </Button>
                        </div>

                        {/* ITEMS */}
                        <div>
                          <div className="flex items-center gap-2 font-semibold mb-2">
                            <Package className="w-4 h-4" />
                            Items
                          </div>

                          

{details.items.map((item: any) => {
  // ✅ ADDED on 18.12.2025
  const mrp = Number(item.mrp ?? item.unit_price)
  const selling = Number(item.unit_price)
  const itemDiscount =
    (mrp - selling) * Number(item.quantity)

  return (
    <div
      key={item.id}
      className="flex justify-between"
    >
      <div>
        <div>
          {item.product?.name} × {item.quantity}
        </div>

        {/* 🔹 ITEM DISCOUNT INFO */}
        {itemDiscount > 0 && (
          <div className="text-xs text-muted-foreground">
            MRP ₹{mrp.toLocaleString()} → Selling ₹
            {selling.toLocaleString()} (
            <span className="text-destructive">
              −₹{itemDiscount.toLocaleString()}
            </span>
            )
          </div>
        )}
      </div>

      <span>
        ₹{Number(item.line_total).toLocaleString()}
      </span>
    </div>
  )
})}


                        </div>
                                                  {/* 🔹 OVERALL DISCOUNT */}
{Number(details.discount) > 0 && (
  <div className="flex justify-between text-destructive text-sm">
    <span>Overall Discount</span>
    <span>
      −₹{Number(details.discount).toLocaleString()}
    </span>
  </div>
)}


                        {/* RETURNS */}
                        {details.returns?.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 font-semibold mb-2">
                              <Undo2 className="w-4 h-4" />
                              Refund / Return History
                            </div>

                            <div className="space-y-3">
                              {details.returns.map((ret: any) => {
                                const isAdjusted = !ret.refund_method

                                return (
                                  <div
                                    key={ret.id}
                                    className="rounded border bg-background p-3 space-y-2"
                                  >
                                    <div className="flex justify-between font-medium">
                                      <div>
                                        <div>
                                          {new Date(
                                            ret.return_date
                                          ).toLocaleDateString()}
                                        </div>

                                        {ret.invoice?.invoice_number && (
                                          <div className="text-xs text-muted-foreground">
                                            Refund Receipt:{" "}
                                            <span className="font-mono">
                                              {ret.invoice.invoice_number}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      <span className="text-destructive">
                                        - ₹
                                        {Number(
                                          ret.refund_amount
                                        ).toLocaleString()}
                                      </span>
                                    </div>

                                    {ret.items.map((ri: any) => (
                                      <div
                                        key={ri.id}
                                        className="flex justify-between text-xs text-muted-foreground"
                                      >
                                        <span>
                                          {ri.product?.name} × {ri.quantity}
                                        </span>
                                        <span>
                                          ₹
                                          {Number(
                                            ri.line_total
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                    ))}

                                    <div className="flex justify-between items-center pt-2 border-t">
                                      <Badge
                                        variant={
                                          isAdjusted
                                            ? "secondary"
                                            : "destructive"
                                        }
                                      >
                                        {isAdjusted
                                          ? "Adjusted against due"
                                          : `${ret.refund_method?.toUpperCase()} Refund`}
                                      </Badge>

                                      {ret.invoice && (
                                        <div className="flex gap-1">
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() =>
                                              window.open(
                                                `${API_BASE_URL}/invoices/${ret.invoice.id}/print`,
                                                "_blank"
                                              )
                                            }
                                          >
                                            <Printer className="w-4 h-4" />
                                          </Button>

                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() =>
                                              window.open(
                                                `${API_BASE_URL}/invoices/${ret.invoice.id}/download`,
                                                "_blank"
                                              )
                                            }
                                          >
                                            <Download className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* PAYMENTS */}
<div>
  <div className="flex items-center gap-2 font-semibold mb-2">
    <CreditCard className="w-4 h-4" />
    Payments
  </div>

  {details.payments.length === 0 ? (
    <div className="text-xs text-muted-foreground">
      No payments made
    </div>
  ) : (
    <div className="space-y-2">
      {details.payments.map((p: any) => (
        <div
          key={p.id}
          className="flex justify-between items-center"
        >
          <span className="text-xs">
            {new Date(p.payment_date).toLocaleDateString()} •{" "}
            {p.payment_method}
          </span>

          <div className="flex items-center gap-2">
            <span className="text-green-600">
              ₹{Number(p.amount).toLocaleString()}
            </span>

            {/* 🔹 RECEIPT (PAYMENT PROOF) */}
            {p.receipt_no && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  title="Print Receipt"
                  onClick={() =>
                    window.open(
                      `${API_BASE_URL}/receipts/${p.receipt_no}/print`,
                      "_blank"
                    )
                  }
                >
                  <Printer className="w-4 h-4" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  title="Download Receipt"
                  onClick={() =>
                    window.open(
                      `${API_BASE_URL}/receipts/${p.receipt_no}/download`,
                      "_blank"
                    )
                  }
                >
                  <Download className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      ))}

      {/* 🔹 SALE INVOICE (ONCE PER SALE) */}
      {details.invoices?.length > 0 && (
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              window.open(
                `${API_BASE_URL}/invoices/${details.invoices[0].id}/print`,
                "_blank"
              )
            }
          >
            <Printer className="w-4 h-4 mr-1" />
            Invoice
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              window.open(
                `${API_BASE_URL}/invoices/${details.invoices[0].id}/download`,
                "_blank"
              )
            }
          >
            <Download className="w-4 h-4 mr-1" />
            Invoice
          </Button>
        </div>
      )}
    </div>
  )}
</div>


                        {/* TOTALS */}
                        <div className="border-t pt-2 space-y-1">


                          <div className="flex justify-between">
                            <span>Net Total</span>
                            <span>
                              ₹{Number(details.net_total).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex justify-between text-green-600">
                            <span>Paid</span>
                            <span>
                              ₹{Number(details.paid_amount).toLocaleString()}
                            </span>
                          </div>

                          {Number(details.due_amount) > 0 && (
                            <div className="flex justify-between text-destructive">
                              <span>Due</span>
                              <span>
                                ₹{Number(details.due_amount).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Prev
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RETURN MODAL */}
      <SaleReturnModal
        open={!!activeReturnSale}
        sale={activeReturnSale}
        onClose={() => setActiveReturnSale(null)}
        onSubmit={handleReturnSubmit}
      />
    </div>
  )
}
