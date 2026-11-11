"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useRealUser } from "@/hooks/use-real-user"

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const realUser = useRealUser(true)
  const role = realUser?.role

  useEffect(() => {
    if (!role) return
    if (role === "user" && pathname !== "/profile" && pathname !== "/login-activity") {
      router.replace("/profile")
    }
  }, [role, pathname, router])

  return <DashboardLayout>{children}</DashboardLayout>
}
