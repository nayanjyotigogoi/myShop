"use client"

import { toast } from "@/components/ui/use-toast"

export const notify = {
  success: (message: string) =>
    toast({
      title: "Success",
      description: message,
    }),

  error: (message: string) =>
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    }),

  warning: (message: string) =>
    toast({
      title: "Warning",
      description: message,
    }),

  info: (message: string) =>
    toast({
      title: "Info",
      description: message,
    }),
}
