"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SettingsPage() {
  const [shopName, setShopName] = useState("MyShop Clothing Store")
  const [currency, setCurrency] = useState("INR")
  const [lowStockThreshold, setLowStockThreshold] = useState("5")
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Configure your shop preferences</p>
      </div>

      {isSaved && (
        <Alert className="bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">Settings saved successfully!</AlertDescription>
        </Alert>
      )}

      {/* Shop Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Shop Information</CardTitle>
          <CardDescription>Basic details about your shop</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="shop-name" className="text-base font-medium">
              Shop Name
            </Label>
            <Input
              id="shop-name"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="h-10 text-base"
            />
            <p className="text-sm text-muted-foreground">The name of your clothing retail shop</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency" className="text-base font-medium">
              Currency
            </Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                <SelectItem value="USD">US Dollar ($)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
                <SelectItem value="GBP">British Pound (£)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Currency used for pricing</p>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Settings</CardTitle>
          <CardDescription>Configure inventory management options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="low-stock" className="text-base font-medium">
              Low Stock Threshold
            </Label>
            <Input
              id="low-stock"
              type="number"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              className="h-10 text-base"
            />
            <p className="text-sm text-muted-foreground">Alert when stock falls below this number</p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-4">
        <Button onClick={handleSave} className="h-11 px-8" size="lg">
          Save Settings
        </Button>
        <Button variant="outline" className="h-11 px-8 bg-transparent">
          Reset
        </Button>
      </div>
    </div>
  )
}
