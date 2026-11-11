"use client"

import { useEffect, useState } from "react"

import { PageHeader } from "@/components/shared/page-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type LoginActivity = {
  id: string
  userId: string
  status: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export default function LoginActivityPage() {
  const [activities, setActivities] = useState<LoginActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const response = await fetch("/api/auth/login-activity", {
          cache: "no-store",
          credentials: "include",
        })
        if (!response.ok) return
        const data = (await response.json()) as {
          activities?: LoginActivity[]
        }
        if (active) setActivities(data.activities ?? [])
      } catch {
        // Abaikan gagal memuat; tampilkan daftar kosong.
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const statusBadge = (status: string) => {
    const ok = status === "success"
    return (
      <Badge variant={ok ? "default" : "destructive"}>
        {ok ? "Berhasil" : "Gagal"}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aktivitas Login"
        description="Riwayat masuk akun Anda. Hanya Anda yang dapat melihat halaman ini."
      />

      <div className="rounded-2xl border border-border/70 bg-card p-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px] text-sm text-muted-foreground">
            Memuat aktivitas login...
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p>Belum ada aktivitas login tercatat.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-mono text-xs">
                    {new Date(activity.createdAt).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>{statusBadge(activity.status)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {activity.ipAddress ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
