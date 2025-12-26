"use client"
import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AppSidebar from "@/components/app-sidebar"
import AppHeader from "@/components/app-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

useEffect(() => {
  const token = localStorage.getItem("token")

  if (!token) {
    router.replace("/") // login
  } else {
    setIsLoading(false)
  }
}, [router])

  if (isLoading) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 overflow-auto">
          <div className="p-6 md:p-8">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
