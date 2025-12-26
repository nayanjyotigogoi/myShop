"use client"

import { authFetch } from "@/lib/authFetch"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit2, Trash2, Search } from "lucide-react"
import ProductModal from "@/components/product-modal"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"

/* ================= TYPES ================= */

type BackendProduct = {
  id: number
  code: string
  name: string
  category: string
  gender: string | null
  size: string | null
  color: string | null
  buy_price: string
  sell_price: string
  current_stock: number
}

type UIProduct = {
  id: number
  code: string
  name: string
  category: string
  gender: string
  size: string
  color: string
  buyPrice: number
  sellPrice: number
  stock: number
}

/* ================= HELPERS ================= */

const toGenderLabel = (gender: string | null): string => {
  if (!gender) return "Unisex"
  switch (gender.toLowerCase()) {
    case "male":
      return "Male"
    case "female":
      return "Female"
    case "boys":
      return "Boys"
    case "girls":
      return "Girls"
    default:
      return "Unisex"
  }
}

const toBackendGender = (gender?: string | null): string => {
  if (!gender) return "unisex"
  switch (gender.toLowerCase()) {
    case "male":
    case "men":
      return "male"
    case "female":
    case "women":
      return "female"
    case "boys":
      return "boys"
    case "girls":
      return "girls"
    default:
      return "unisex"
  }
}

/* ================= PAGE ================= */

export default function ProductsPage() {
  const [products, setProducts] = useState<UIProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [targetFilter, setTargetFilter] = useState("All")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<UIProduct | null>(null)

  /* -------- LOAD PRODUCTS -------- */
  const loadProducts = async () => {
    try {
      setLoading(true)
      const res = await authFetch(`${API_BASE_URL}/products`)
      const data: BackendProduct[] = await res.json()

      setProducts(
        data.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          category: p.category,
          gender: toGenderLabel(p.gender),
          size: p.size || "",
          color: p.color || "",
          buyPrice: Number(p.buy_price),
          sellPrice: Number(p.sell_price),
          stock: p.current_stock,
        }))
      )
    } catch (err) {
      console.error(err)
      alert("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  /* -------- FILTER -------- */
  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      p.name.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term)

    if (targetFilter === "All") return matchesSearch

    const g = p.gender.toLowerCase()
    if (targetFilter === "kids") return matchesSearch && (g === "boys" || g === "girls")
    return matchesSearch && g === targetFilter
  })

  /* -------- SAVE (CREATE / UPDATE) -------- */
  const handleSaveProduct = async (product: any) => {
    try {
      const body = {
        code: product.code,
        name: product.name,
        category: product.category,
        gender: toBackendGender(product.gender),
        size: product.size || null,
        color: product.color || null,
        buy_price: Number(product.buyPrice),
        sell_price: Number(product.sellPrice),
        ...(editingProduct ? {} : { opening_stock: Number(product.stock || 0) }),
      }

      if (editingProduct) {
        await authFetch(`${API_BASE_URL}/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      } else {
        await authFetch(`${API_BASE_URL}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      }

      await loadProducts()
      setIsModalOpen(false)
      setEditingProduct(null)
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to save product")
    }
  }

  /* -------- DELETE -------- */
  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Delete this product?")) return
    try {
      await authFetch(`${API_BASE_URL}/products/${id}`, {
        method: "DELETE",
      })
      await loadProducts()
    } catch {
      alert("Cannot delete product (linked to sales/purchases).")
    }
  }

  /* ================= UI ================= */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage inventory</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={targetFilter} onValueChange={setTargetFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="kids">Kids</SelectItem>
              <SelectItem value="unisex">Unisex</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `${filteredProducts.length} items`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Target</TableHead>
                <TableHead className="text-right">Buy</TableHead>
                <TableHead className="text-right">Sell</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.code}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.gender}</Badge>
                  </TableCell>
                  <TableCell className="text-right">₹{p.buyPrice}</TableCell>
                  <TableCell className="text-right">₹{p.sellPrice}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={p.stock < 5 ? "destructive" : "secondary"}>
                      {p.stock}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setEditingProduct(p)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProduct(p.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* <ProductModal
        isOpen={isModalOpen || !!editingProduct}
        initialData={editingProduct}
        onClose={() => {
          setIsModalOpen(false)
          setEditingProduct(null)
        }}
        onSave={handleSaveProduct}
      /> */}
      <ProductModal
  isOpen={isModalOpen || !!editingProduct}
  initialData={editingProduct}

  // ADDED ON 24.12.2025
  existingCodes={products.map((p) => p.code)}

  onClose={() => {
    setIsModalOpen(false)
    setEditingProduct(null)
  }}
  onSave={handleSaveProduct}
/>

    </div>
  )
}
