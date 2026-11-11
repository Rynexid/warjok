"use client"

import { useEffect, useState, type CSSProperties } from "react"
import { usePathname } from "next/navigation"

import { AppSidebar } from "@/components/appsidebar"
import { AppHeader } from "@/components/layout/app-header"
import { Providers } from "@/components/providers"
import { useBusinessStore } from "@/stores/business-store"
import { useRealUser } from "@/hooks/use-real-user"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCw } from "lucide-react"

const SIDEBAR_MIN_WIDTH = 200
const SIDEBAR_MAX_WIDTH = 360
const SIDEBAR_DEFAULT_WIDTH = 260
const SIDEBAR_COLLAPSED_WIDTH = 68
const SIDEBAR_WIDTH_STORAGE_KEY = "warjok.sidebar-width.v1"

function clampWidth(value: number) {
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, value))
}

function BusinessDataLoader() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
        <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
        <span className="size-2 animate-bounce rounded-full bg-primary" />
      </div>
      <p>Memuat data bisnis...</p>
    </div>
  )
}

function BusinessErrorPanel() {
  const error = useBusinessStore((state) => state.error)
  const retry = useBusinessStore((state) => state.retryBusiness)

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <Alert variant="destructive">
        <AlertTitle>Gagal memuat data bisnis</AlertTitle>
        <AlertDescription>{error ?? "Terjadi kesalahan saat memuat data."}</AlertDescription>
      </Alert>
      <Button onClick={() => retry()} disabled={!retry}>
        <RefreshCw className="mr-2 size-4" />
        Coba lagi
      </Button>
    </div>
  )
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH)
  const [resizing, setResizing] = useState(false)
  const hydrate = useBusinessStore((state) => state.hydrate)
  const ready = useBusinessStore((state) => state.ready)
  const error = useBusinessStore((state) => state.error)
  const realUser = useRealUser(true)
  const pathname = usePathname()
  const isRegularUser = realUser?.role === "user"
  const isProfileRoute = pathname === "/profile" || pathname.startsWith("/(profile)") || pathname.startsWith("/profile") || pathname.startsWith("/user-profile")

  useEffect(() => {
    if (isRegularUser && isProfileRoute) return
    void hydrate()
  }, [hydrate, isRegularUser, isProfileRoute])

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY))
    if (Number.isFinite(saved) && saved > 0) {
      // oxlint-disable-next-line react/set-state-in-effect -- restore saved width after mount
      setSidebarWidth(clampWidth(saved))
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(
      SIDEBAR_WIDTH_STORAGE_KEY,
      String(sidebarWidth)
    )
  }, [sidebarWidth])

  const shouldSkipBusinessLoad = isRegularUser && isProfileRoute

  return (
    <div
      className="min-h-svh bg-background"
      style={
        {
          "--sidebar-width": `${
            collapsed ? SIDEBAR_COLLAPSED_WIDTH : sidebarWidth
          }px`,
        } as CSSProperties
      }
    >
      <AppSidebar
        collapsed={collapsed}
        onToggle={setCollapsed}
        width={sidebarWidth}
        onWidthChange={setSidebarWidth}
        resizing={resizing}
        onResizeStart={() => setResizing(true)}
        onResizeEnd={() => setResizing(false)}
      />
      <div
        className={cn(
          "flex min-h-svh flex-col md:pl-[var(--sidebar-width)]",
          resizing ? "transition-none" : "transition-[padding] duration-200"
        )}
      >
        <AppHeader collapsed={collapsed} onToggle={setCollapsed} />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden">
          <Providers>
            {shouldSkipBusinessLoad ? children : error ? (
              <BusinessErrorPanel />
            ) : ready ? (
              children
            ) : (
              <BusinessDataLoader />
            )}
          </Providers>
        </main>
      </div>
    </div>
  )
}
