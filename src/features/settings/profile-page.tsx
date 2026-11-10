"use client"

import Link from "next/link"
import { User, Mail, ShieldCheck, CircleCheck, LogOut, LayoutDashboard } from "lucide-react"
import { useRouter } from "next/navigation"

import { useRealUser } from "@/hooks/use-real-user"
import { appRoleLabel } from "@/lib/business-labels"
import { initials } from "@/features/customers/customer-detail-sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { authClient } from "@/lib/auth-client"

export function ProfilePage() {
  const router = useRouter()
  const realUser = useRealUser(true)

  const role = realUser?.role
  const isRegularUser = role === "user"
  const displayRole = appRoleLabel(role)
  const canAccessDashboard = !isRegularUser && !!role

  const handleSignOut = async () => {
    try {
      await authClient.signOut()
    } finally {
      router.replace("/login")
      router.refresh()
    }
  }

  const infoItems = [
    { icon: User, label: "Nama Lengkap", value: realUser?.name ?? "-" },
    { icon: Mail, label: "Email", value: realUser?.email ?? "-" },
    { icon: ShieldCheck, label: "Role Akun", value: displayRole },
    { icon: CircleCheck, label: "Status", value: "Aktif" },
  ]

  return (
    <div className="mx-auto w-full max-w-3xl pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8">
      <div className="space-y-4 sm:space-y-5">
        <Card className="overflow-hidden rounded-none border-x-0 border-t-0 border-border/70 py-0 gap-0 shadow-sm sm:rounded-2xl sm:border">
          <CardContent className="p-0">
            <div
              className="relative h-40 w-full overflow-hidden bg-muted sm:h-48"
              style={{ backgroundImage: "url('/Cover.png')", backgroundSize: "cover", backgroundPosition: "center" }}
            >
              {canAccessDashboard ? (
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="absolute right-3 top-3 h-8 rounded-full bg-background/90 px-3 shadow-sm backdrop-blur-sm hover:bg-background sm:right-4 sm:top-4"
                >
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-1.5 size-3.5" />
                    Dashboard
                  </Link>
                </Button>
              ) : null}
            </div>

            <div className="relative z-10 px-4 pb-4 sm:px-6 sm:pb-6">
              <div className="flex flex-col items-center text-center sm:flex-row sm:items-end sm:gap-5 sm:text-left">
                <div className="relative z-10 -mt-4 flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background text-xl font-semibold text-primary ring-4 ring-background sm:-mt-5 sm:size-24 sm:text-2xl">
                  <span className="flex size-full items-center justify-center bg-primary/15">{initials(realUser?.name ?? "Akun")}</span>
                </div>
                <div className="mt-2 min-w-0 flex-1 sm:mt-2 sm:pb-1">
                  <p className="truncate text-lg font-semibold sm:text-xl">{realUser?.name ?? "Akun terdaftar"}</p>
                  <p className="mt-0.5 break-all text-sm text-muted-foreground sm:break-normal sm:truncate">{realUser?.email ?? "-"}</p>
                  <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <Badge variant={isRegularUser ? "secondary" : "default"} className="rounded-full px-2.5">
                      {displayRole}
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground sm:text-left">Cover profil menggunakan gambar default dan belum dapat diubah hingga fitur Edit Profil tersedia.</p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button variant="outline" className="h-11 w-full justify-center rounded-xl" disabled>
                  <User className="mr-2 size-4" />
                  Edit Profil (Segera hadir)
                </Button>
                <Button
                  variant="ghost"
                  className="h-11 w-full justify-center rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 size-4" />
                  Keluar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 px-4 sm:space-y-5 sm:px-0">
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-3">
              <CardTitle className="text-base sm:text-lg">Informasi Akun</CardTitle>
              <CardDescription>Detail identitas akun Anda.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 sm:p-6 sm:pt-2">
              <div className="grid gap-3 sm:grid-cols-2">
                {infoItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="flex items-start gap-3 rounded-xl border bg-muted/10 p-3.5">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                        <p className="mt-0.5 break-words text-sm font-medium leading-snug">{item.value}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-3">
              <CardTitle className="text-base sm:text-lg">Keamanan</CardTitle>
              <CardDescription>Pengaturan akses dan sesi akun.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-2 sm:p-6 sm:pt-2">
              <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium">Kata Sandi</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">Kelola kata sandi melalui Neon Auth.</p>
                </div>
                <Button variant="outline" size="sm" className="h-10 w-full rounded-xl sm:h-9 sm:w-auto sm:shrink-0" disabled>
                  Atur Ulang
                </Button>
              </div>
              <Separator />
              <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium">Sesi</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">Keluar dari akun di perangkat ini.</p>
                </div>
                <Button variant="destructive" size="sm" className="h-10 w-full rounded-xl sm:h-9 sm:w-auto sm:shrink-0" onClick={handleSignOut}>
                  Keluar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
