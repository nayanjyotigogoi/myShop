"use client"

import { notify } from "@/lib/notify"

import { useEffect, useMemo, useState } from "react"
import { authFetch } from "@/lib/authFetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Search,
  Phone,
  CreditCard,
  Edit,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import CustomerForm from "@/components/customer-form"
import CustomerPaymentModal from "@/components/customer-payment-modal"
import CustomerPaymentHistory from "@/components/customer-payment-history"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api"

type Customer = {
  id: number
  name: string
  phone?: string
  email?: string
  address?: string
  due_balance: string
}

const PAGE_SIZE = 10

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  const [currentPage, setCurrentPage] = useState(1)

  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null)

  const [activePaymentCustomer, setActivePaymentCustomer] =
    useState<Customer | null>(null)
  const [activeSale, setActiveSale] = useState<any | null>(null)

  const [historyCustomer, setHistoryCustomer] =
    useState<Customer | null>(null)

  /* ================= LOAD CUSTOMERS ================= */

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const res = await authFetch(`${API_BASE_URL}/customers`)
      const json = await res.json()

      const list: Customer[] = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.data?.data)
        ? json.data.data
        : []

      setCustomers(list)
    } catch (err) {
       notify.error("Failed to load customers")
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  /* ================= FILTER ================= */

  const filtered = useMemo(() => {
    return customers.filter((c) =>
      `${c.name} ${c.phone ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  }, [customers, search])

  /* RESET PAGE ON SEARCH */
  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  /* ================= PAGINATION ================= */

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  )

  const paginatedCustomers = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  /* ================= OPEN PAYMENT ================= */

const openPaymentModal = async (customer: Customer) => {
  try {
    const res = await authFetch(
      `${API_BASE_URL}/sales?customer_id=${customer.id}`
    )

    if (!res.ok) {
      throw new Error("Failed to fetch customer sales")
    }

    const json = await res.json()

    const sales = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.data?.data)
      ? json.data.data
      : []

    const unpaidSale = sales.find(
      (s: any) => Number(s.due_amount) > 0
    )

    if (!unpaidSale) {
      notify.info("No unpaid invoices found for this customer")
      return
    }

    setActivePaymentCustomer(customer)
    setActiveSale(unpaidSale)
  } catch (err: any) {
    notify.error(err.message || "Unable to open payment window")
  }
}


  /* ================= UI ================= */

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-3xl font-bold">Customers</h1>

        <Button
          className="w-full sm:w-auto"
          onClick={() => setEditingCustomer({} as Customer)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* SEARCH */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* LIST */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : paginatedCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No customers found
            </p>
          ) : (
            <div className="grid gap-3">
              {paginatedCustomers.map((c) => {
                const hasDue = Number(c.due_balance) > 0

                return (
                  <div
                    key={c.id}
                    className="
                      rounded-lg border
                      p-4
                      flex flex-col sm:flex-row
                      sm:items-center sm:justify-between
                      gap-4
                    "
                  >
                    <div className="space-y-1">
                      <div className="font-semibold">{c.name}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {c.phone || "—"}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {hasDue ? (
                        <Badge variant="destructive">
                          Due ₹
                          {Number(c.due_balance).toLocaleString()}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">No Due</Badge>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingCustomer(c)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>

                      {hasDue && (
                        <Button
                          size="sm"
                          onClick={() => openPaymentModal(c)}
                        >
                          <CreditCard className="w-4 h-4 mr-1" />
                          Receive
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setHistoryCustomer(c)}
                      >
                        <History className="w-4 h-4 mr-1" />
                        History
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(totalPages, p + 1)
                    )
                  }
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODALS */}
      {editingCustomer && (
        <CustomerForm
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSaved={loadCustomers}
        />
      )}

      {activePaymentCustomer && activeSale && (
        <CustomerPaymentModal
          customer={activePaymentCustomer}
          sale={activeSale}
          onClose={() => {
            setActivePaymentCustomer(null)
            setActiveSale(null)
          }}
          onPaid={loadCustomers}
        />
      )}

      {historyCustomer && (
        <CustomerPaymentHistory
          customer={historyCustomer}
          onClose={() => setHistoryCustomer(null)}
        />
      )}
    </div>
  )
}
