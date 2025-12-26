"use client"

import { authFetch } from "@/lib/authFetch"
import { useEffect, useState, Fragment, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, ChevronDown, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import PurchaseModal from "@/components/purchase-modal"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api"

/* ================= TYPES ================= */

type BackendPurchase = {
  id: number
  purchase_date: string
  supplier: string | null
  total_amount: string
  items_count: number
  total_items?: number | string | null
}

type PurchaseFormPayload = {
  purchase_date: string
  supplier: string
  items: any[]
}

type PurchaseDetail = BackendPurchase & {
  items?: {
    id: number
    product_id: number
    quantity: number
    unit_price: string
    line_total: string
    product?: {
      name: string
    }
  }[]
}

/* ================= PAGE ================= */

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<BackendPurchase[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [purchaseDetails, setPurchaseDetails] = useState<
    Record<number, PurchaseDetail>
  >({})
  const [detailsLoadingId, setDetailsLoadingId] = useState<number | null>(null)

  // ✅ ADDED: edit mode state
  const [editingPurchase, setEditingPurchase] =
    useState<PurchaseDetail | null>(null)

  const [search, setSearch] = useState("")

  const PAGE_SIZE = 10
  const [page, setPage] = useState(1)

  /* ================= LOAD PURCHASES ================= */

  const loadPurchases = async () => {
    try {
      setLoading(true)
      const res = await authFetch(`${API_BASE_URL}/purchases`)
      const data: BackendPurchase[] = await res.json()
      setPurchases(data)
    } catch {
      alert("Failed to load purchases")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPurchases()
  }, [])

  /* ================= CREATE / UPDATE PURCHASE ================= */

  const handleAddPurchase = async (payload: PurchaseFormPayload) => {
    try {
      setSaving(true)

      // ✅ MODIFIED: POST vs PUT (no removal)
      const url = editingPurchase
        ? `${API_BASE_URL}/purchases/${editingPurchase.id}`
        : `${API_BASE_URL}/purchases`

      const method = editingPurchase ? "PUT" : "POST"

      const res = await authFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err?.message || "Failed to save purchase")
      }

      await loadPurchases()
      setIsModalOpen(false)
      setEditingPurchase(null) // ✅ RESET edit mode
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  /* ================= DETAILS ================= */

  const handleToggleDetails = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }

    if (!purchaseDetails[id]) {
      try {
        setDetailsLoadingId(id)
        const res = await authFetch(`${API_BASE_URL}/purchases/${id}`)
        const data = await res.json()
        setPurchaseDetails((p) => ({ ...p, [id]: data }))
      } finally {
        setDetailsLoadingId(null)
      }
    }

    setExpandedId(id)
  }

  /* ================= SEARCH + PAGINATION ================= */

  const filteredPurchases = useMemo(() => {
    if (!search) return purchases

    const s = search.toLowerCase()

    return purchases.filter((p) =>
      [p.supplier, p.purchase_date, p.total_amount]
        .join(" ")
        .toLowerCase()
        .includes(s)
    )
  }, [search, purchases])

  const totalPages = Math.ceil(filteredPurchases.length / PAGE_SIZE)

  const paginatedPurchases = filteredPurchases.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  /* ================= DATE FORMATTER ================= */

  const formatDate = (isoDate: string) => {
    if (!isoDate) return "-"

    const date = new Date(isoDate)

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  useEffect(() => {
    setPage(1)
  }, [search])

  /* ================= UI ================= */

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Purchases</h1>
          <p className="text-muted-foreground">
            Manage purchase orders
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingPurchase(null) // ✅ ENSURE create mode
            setIsModalOpen(true)
          }}
          size="lg"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Purchase
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by supplier, date, amount..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `${filteredPurchases.length} records`}
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
              {paginatedPurchases.map((p) => (
                <Fragment key={p.id}>
                  <TableRow>
                    <TableCell>{formatDate(p.purchase_date)}</TableCell>
                    <TableCell>{p.supplier || "-"}</TableCell>
                    <TableCell className="text-right">
                      {p.total_items ?? 0}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{Number(p.total_amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleDetails(p.id)}
                      >
                        <ChevronDown
                          className={`w-4 h-4 ${
                            expandedId === p.id ? "rotate-180" : ""
                          }`}
                        />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const res = await authFetch(
                            `${API_BASE_URL}/purchases/${p.id}`
                          )
                          const data = await res.json()
                          setEditingPurchase(data)
                          setIsModalOpen(true)
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>

                  {expandedId === p.id && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <div className="border rounded p-3 text-sm">
                          {purchaseDetails[p.id]?.items?.map((i) => (
                            <div
                              key={i.id}
                              className="flex justify-between"
                            >
                              <span>{i.product?.name}</span>
                              <span>
                                {i.quantity} × ₹{i.unit_price}
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>

            <span className="text-sm">
              Page {page} of {totalPages || 1}
            </span>

            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      <PurchaseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingPurchase(null) // ✅ RESET
        }}
        onSave={handleAddPurchase}
        isSaving={saving}
        purchase={editingPurchase} // ✅ PASS EDIT DATA
      />
    </div>
  )
}
