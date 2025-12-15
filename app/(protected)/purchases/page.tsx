"use client"

import { authFetch } from "@/lib/authFetch"
import { useEffect, useState} from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, ChevronDown } from "lucide-react"
import PurchaseModal from "@/components/purchase-modal"
import { Fragment } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api"

type BackendPurchase = {
  id: number
  purchase_date: string
  supplier: string | null
  total_amount: string
  items_count: number
  total_items?: number | string | null
  created_at?: string
  updated_at?: string
}

type PurchaseFormPayload = {
  date: string
  supplier: string
  items: {
    productId: number
    quantity: number
    price: number
  }[]
}

// Detail type (shape returned by GET /api/purchases/{id})
type PurchaseDetail = BackendPurchase & {
  items?: {
    id: number
    product_id: number
    quantity: number
    unit_price: string
    line_total: string
    product?: {
      id: number
      code: string
      name: string
      size?: string | null
    }
  }[]
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<BackendPurchase[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // For actions / details
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [purchaseDetails, setPurchaseDetails] = useState<Record<number, PurchaseDetail>>({})
  const [detailsLoadingId, setDetailsLoadingId] = useState<number | null>(null)

  /* -------- LOAD PURCHASES -------- */
  const loadPurchases = async () => {
    try {
      setLoading(true)
      const res = await authFetch(`${API_BASE_URL}/purchases`)
      const data: BackendPurchase[] = await res.json()
      setPurchases(data)
    } catch (err) {
      console.error(err)
      alert("Failed to load purchases from server")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPurchases()
  }, [])

  const handleAddPurchase = async (payload: PurchaseFormPayload) => {
    if (!payload.items.length) {
      alert("Add at least one line item")
      return
    }

    try {
      setSaving(true)

      const body = {
        purchase_date: payload.date,
        supplier: payload.supplier || null,
        items: payload.items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.price,
        })),
      }

      console.log("Sending purchase payload:", body)

      const res = await fetch(`${API_BASE_URL}/purchases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const text = await res.text()
        console.error("Create purchase error:", res.status, text)

        // Try to parse Laravel validation errors
        try {
          const json = JSON.parse(text)
          if (json?.errors) {
            const firstError = Object.values(json.errors)[0] as string[]
            alert(firstError[0] || "Validation error")
            return
          }
        } catch {
          // response not JSON, ignore
        }

        throw new Error(text || "Failed to create purchase")
      }

      await loadPurchases()
      setIsModalOpen(false)
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Error saving purchase")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleDetails = async (purchaseId: number) => {
    // Collapse if already open
    if (expandedId === purchaseId) {
      setExpandedId(null)
      return
    }

    // If we don't have details yet, fetch them
    if (!purchaseDetails[purchaseId]) {
      try {
        setDetailsLoadingId(purchaseId)
        const res = await authFetch(`${API_BASE_URL}/purchases/${purchaseId}`, {
          cache: "no-store",
        })
        if (!res.ok) {
          const text = await res.text()
          console.error("Failed to load purchase details:", res.status, text)
          throw new Error("Failed to load purchase details")
        }
        const data: PurchaseDetail = await res.json()
        setPurchaseDetails((prev) => ({
          ...prev,
          [purchaseId]: data,
        }))
      } catch (err) {
        console.error(err)
        alert("Failed to load purchase details")
        return
      } finally {
        setDetailsLoadingId(null)
      }
    }

    setExpandedId(purchaseId)
  }

  const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.total_amount || 0), 0)
  const totalItems = purchases.reduce(
    (sum, p) => sum + Number(p.total_items ?? 0),
    0
  )
  const avgOrder = purchases.length ? totalPurchases / purchases.length : 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Purchases</h1>
          <p className="text-muted-foreground mt-2">Manage your purchase orders</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto"
          size="lg"
          disabled={saving}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Purchase
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">
              ₹{totalPurchases.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {purchases.length} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">
              ₹{Math.round(avgOrder || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per order</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">
              {totalItems.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pieces purchased</p>
          </CardContent>
        </Card>
      </div>

      {/* Purchases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>
            {loading ? "Loading..." : "All your purchase orders"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>

            <TableBody>
              {purchases.map((purchase) => {
                const isExpanded = expandedId === purchase.id
                const detail = purchaseDetails[purchase.id]

                return (
                  <Fragment key={purchase.id}>
                    <TableRow>
                      <TableCell>{purchase.purchase_date}</TableCell>
                      <TableCell>{purchase.supplier || "-"}</TableCell>
                      <TableCell className="text-right">
                        {Number(purchase.total_items ?? 0)} pcs
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{Number(purchase.total_amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleDetails(purchase.id)}
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </Button>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={5}>
                          {detailsLoadingId === purchase.id ? (
                            <p className="text-sm text-muted-foreground py-2">
                              Loading details...
                            </p>
                          ) : !detail?.items?.length ? (
                            <p className="text-sm text-muted-foreground py-2">
                              No line items found.
                            </p>
                          ) : (
                            <div className="rounded border bg-muted/40 p-3">
                              <div className="text-sm font-semibold mb-2">
                                Purchase Details
                              </div>
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-1">Product</th>
                                    <th className="text-right py-1">Qty</th>
                                    <th className="text-right py-1">
                                      Unit Price
                                    </th>
                                    <th className="text-right py-1">
                                      Line Total
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {detail.items.map((item) => (
                                    <tr key={item.id} className="border-t">
                                      <td className="py-1">
                                        {item.product?.name}
                                      </td>
                                      <td className="text-right py-1">
                                        {item.quantity}
                                      </td>
                                      <td className="text-right py-1">
                                        ₹
                                        {Number(
                                          item.unit_price
                                        ).toLocaleString()}
                                      </td>
                                      <td className="text-right py-1">
                                        ₹
                                        {Number(
                                          item.line_total
                                        ).toLocaleString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Purchase Modal */}
      <PurchaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddPurchase}
        isSaving={saving}
      />
    </div>
  )
}
