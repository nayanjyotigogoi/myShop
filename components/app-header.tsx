"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { User, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AppHeader() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <header className="border-b bg-card sticky top-0 z-30">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="hidden md:block">
            <p className="text-sm font-medium text-muted-foreground">{today}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
