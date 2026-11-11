"use client"

import { Fragment, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Boxes,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  HelpCircle,
  LayoutDashboard,
  Package,
  PanelLeftOpen,
  Receipt,
  Settings,
  ShoppingBag,
  UserCog,
  Users,
} from "lucide-react"

import { NavUser } from "@/components/navuser"
import { Logo } from "@/components/ui/logo"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useRealUser } from "@/hooks/use-real-user"
import { cn } from "@/lib/utils"
import { LogIn } from "lucide-react"
import { startOrderNotify, stopOrderNotify, subscribeOrderNotify } from "@/features/storefront/order-notify"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

interface NavGroup {
  key: string
  title: string
  collapsible: boolean
  defaultOpen?: boolean
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    key: "overview",
    title: "Overview",
    collapsible: false,
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    key: "sales",
    title: "Sales",
    collapsible: true,
    defaultOpen: true,
    items: [
      { href: "/pos", label: "POS Terminal", icon: ShoppingBag },
      { href: "/transactions", label: "Transactions", icon: Receipt },
      { href: "/order", label: "Order Online", icon: ShoppingBag },
      { href: "/customers", label: "Customers", icon: Users },
    ],
  },
  {
    key: "catalog",
    title: "Catalog",
    collapsible: true,
    defaultOpen: true,
    items: [
      { href: "/products", label: "Products", icon: Package },
      { href: "/categories", label: "Categories", icon: Grid3X3 },
      { href: "/inventory", label: "Inventory", icon: Boxes },
    ],
  },
  {
    key: "business",
    title: "Business",
    collapsible: true,
    defaultOpen: true,
    items: [
      { href: "/reports", label: "Reports", icon: BarChart3 },
      { href: "/staff", label: "Staff Management", icon: UserCog },
    ],
  },
  {
    key: "preferences",
    title: "Preferences",
    collapsible: true,
    defaultOpen: true,
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/help", label: "Help & Support", icon: HelpCircle },
    ],
  },
]

const MIN_SIDEBAR_WIDTH = 200
const MAX_SIDEBAR_WIDTH = 360

export function AppSidebar({
  collapsed,
  onToggle,
  width = 260,
  onWidthChange,
  resizing = false,
  onResizeStart,
  onResizeEnd,
  className,
}: {
  collapsed: boolean
  onToggle: (next: boolean) => void
  width?: number
  onWidthChange?: (next: number) => void
  resizing?: boolean
  onResizeStart?: () => void
  onResizeEnd?: () => void
  className?: string
}) {
  const pathname = usePathname()
  const realUser = useRealUser(true)
  const userRole = realUser?.role
  const isRegularUser = userRole === "user"
  const currentUser = {
    name: realUser?.name ?? "Akun terdaftar",
    email: realUser?.email ?? "",
    avatar: realUser?.image ?? undefined,
  }
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    sales: true,
    catalog: true,
    business: true,
    preferences: true,
  })
  const [awaitingCount, setAwaitingCount] = useState(0)

  useEffect(() => {
    startOrderNotify(30000)
    const unsub = subscribeOrderNotify((c) => setAwaitingCount(c))
    return () => {
      unsub()
      stopOrderNotify()
    }
  }, [])

  // Filter nav items based on role
  const filteredNav = isRegularUser ? [] : NAV

  // Tutup sidebar otomatis di mobile setiap kali berpindah halaman.
  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(max-width: 767px)").matches) {
      onToggle(true)
    }
  }, [pathname, onToggle])

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }))

  const handleResizePointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (collapsed || !onWidthChange) return

    event.preventDefault()
    const startX = event.clientX
    const startWidth = width
    onResizeStart?.()

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const next = Math.min(
        MAX_SIDEBAR_WIDTH,
        Math.max(MIN_SIDEBAR_WIDTH, startWidth + moveEvent.clientX - startX)
      )
      onWidthChange(next)
    }

    const stopResizing = () => {
      onResizeEnd?.()
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", stopResizing)
      window.removeEventListener("pointercancel", stopResizing)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", stopResizing)
    window.addEventListener("pointercancel", stopResizing)
  }

  const handleResizeKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onWidthChange) return
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return

    event.preventDefault()
    const delta = event.key === "ArrowRight" ? 16 : -16
    onWidthChange(
      Math.min(
        MAX_SIDEBAR_WIDTH,
        Math.max(MIN_SIDEBAR_WIDTH, width + delta)
      )
    )
  }

  const brandContent = collapsed ? (
    <div className="relative flex h-10 w-full items-center justify-center">
      <Logo
        size="sm"
        label={false}
        className="transition-opacity duration-150 group-hover/sidebar:opacity-0"
      />
      <button
        type="button"
        onClick={() => onToggle(false)}
        aria-label="Buka sidebar"
        title="Buka sidebar"
        className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity duration-150 hover:bg-accent hover:text-foreground focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/sidebar:pointer-events-auto group-hover/sidebar:opacity-100"
      >
        <PanelLeftOpen className="size-5" />
      </button>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => onToggle(true)}
      className="flex w-full shrink-0 items-center justify-between rounded-xl p-3 transition-colors duration-200 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Tutup sidebar"
      title="Tutup sidebar"
    >
      <Logo size="md" />
    </button>
  )

  const navContent = collapsed ? (
    <div className="flex flex-col items-center gap-1">
      {filteredNav.map((group, groupIndex) => (
        <Fragment key={group.key}>
          {groupIndex > 0 && (
            <div
              className="my-1 h-px w-6 shrink-0 bg-sidebar-border"
              aria-hidden="true"
            />
          )}
          {group.items.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="size-5 shrink-0" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </Fragment>
      ))}
    </div>
  ) : filteredNav.length > 0 ? (
    filteredNav.map((group) => {
      const groupOpen = group.collapsible ? !!openGroups[group.key] : true
      const header = (
        <div className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          {group.title}
          {group.collapsible ? (
            groupOpen ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )
          ) : null}
        </div>
      )

      return (
        <div key={group.key} className="space-y-1">
          {group.collapsible ? (
            <button
              type="button"
              onClick={() => toggleGroup(group.key)}
              className="w-full rounded-lg transition-colors hover:bg-accent/40"
              aria-expanded={groupOpen}
            >
              {header}
            </button>
          ) : (
            <div>{header}</div>
          )}
          {groupOpen ? (
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition-colors duration-200",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.href === "/order" && awaitingCount > 0 && (
                      <Badge variant="destructive" className="shrink-0 animate-pulse">
                        {awaitingCount}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </div>
          ) : null}
        </div>
      )
    })
  ) : null

  return (
    <TooltipProvider delayDuration={150}>
      {!collapsed && (
        <button
          type="button"
          className="fixed inset-0 z-10 bg-black/40 backdrop-blur-[1px] md:hidden"
          onClick={() => onToggle(true)}
          aria-label="Tutup sidebar"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-svh flex-col justify-between overflow-hidden",
          "border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm print:hidden",
          resizing
            ? "transition-none"
            : "transition-[width,transform] duration-200 ease-in-out",
          "md:w-[var(--sidebar-width)]",
          collapsed
            ? "group/sidebar -translate-x-full md:translate-x-0"
            : "w-[280px] max-w-[85vw] translate-x-0",
          className ?? ""
        )}
        aria-label="Main navigation"
      >
        <div className="shrink-0 p-3">{brandContent}</div>

        <nav
          className={cn(
            "no-scrollbar flex-1 overflow-y-auto p-3 text-sm",
            collapsed ? "flex flex-col items-center gap-1" : "space-y-4"
          )}
        >
          {isRegularUser ? (
            collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/profile"
                    aria-label="Profil"
                    aria-current={isActive("/profile") ? "page" : undefined}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive("/profile")
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Users className="size-5 shrink-0" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  Profil
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="space-y-1 px-1 text-sm text-muted-foreground">
                <Link href="/profile" className="block rounded-lg px-2 py-2 hover:bg-accent hover:text-foreground">
                  Profil
                </Link>
                <Link
                  href="/login-activity"
                  className="block rounded-lg px-2 py-2 hover:bg-accent hover:text-foreground"
                >
                  <LogIn className="mr-2 size-3.5 shrink-0" />
                  Aktivitas Login
                </Link>
              </div>
            )
          ) : (
            navContent
          )}
        </nav>

        <footer className="shrink-0 border-t border-sidebar-border p-3">
          {collapsed ? (
            <div className="flex justify-center">
              <NavUser collapsed user={currentUser} />
            </div>
          ) : (
            <NavUser collapsed={false} user={currentUser} />
          )}
        </footer>

        {!collapsed && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Atur lebar sidebar"
            aria-valuenow={width}
            aria-valuemin={MIN_SIDEBAR_WIDTH}
            aria-valuemax={MAX_SIDEBAR_WIDTH}
            tabIndex={0}
            onPointerDown={handleResizePointerDown}
            onKeyDown={handleResizeKeyDown}
            className="absolute inset-y-0 right-0 z-20 hidden w-1.5 cursor-col-resize touch-none select-none bg-transparent transition-colors hover:bg-primary/30 focus-visible:bg-primary/40 focus-visible:outline-none md:block"
          />
        )}
      </aside>
    </TooltipProvider>
  )
}
