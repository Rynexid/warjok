"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangleIcon,
  BadgeCheckIcon,
  BanIcon,
  CheckCircle2Icon,
  Clock3Icon,
  DownloadIcon,
  EyeIcon,
  RefreshCwIcon,
  ShoppingBagIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { getJson } from "@/features/storefront/api";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type OrderItem = {
  productName?: string;
  name?: string;
  variantName?: string | null;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
  lineTotal?: number;
  notes?: string | null;
};

type OnlineOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  orderType: string;
  guestName: string;
  guestPhone: string;
  notes?: string | null;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  items: OrderItem[];
  proofSubmitted?: boolean;
  proofUrl?: string | null;
  paymentMethod?: string | null;
  rejectionReason?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Dikonfirmasi" },
  { value: "preparing", label: "Disiapkan" },
  { value: "ready", label: "Siap" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
] as const;

function norm(v: unknown) {
  return String(v || "").trim().toLowerCase();
}

function downloadDataUrl(url: string, filename: string) {
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch {
    /* ignore */
  }
}

function payLabel(v: string) {
  const s = norm(v);
  if (s === "awaiting_verification") return "Menunggu verifikasi";
  if (s === "verified" || s === "paid") return "Terverifikasi";
  if (s === "rejected") return "Ditolak";
  return s || "-";
}

function isAwaiting(o: OnlineOrder) {
  return norm(o.paymentStatus) === "awaiting_verification";
}

export function OnlineOrdersPage() {
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<OnlineOrder | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await getJson<{ orders: OnlineOrder[] }>("/api/storefront-orders");
      setOrders(res.orders ?? []);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Gagal memuat pesanan online.");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => void load(true), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selected) {
      setRejectingId(null);
      setRejectReason("");
      return;
    }
    const next = orders.find((o) => o.id === selected.id);
    if (next) setSelected(next);
  }, [orders, selected?.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchQ =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.guestName.toLowerCase().includes(q) ||
        o.guestPhone.toLowerCase().includes(q);
      const matchPay = paymentFilter === "all" || norm(o.paymentStatus) === paymentFilter;
      const matchStatus = statusFilter === "all" || norm(o.status) === statusFilter;
      return matchQ && matchPay && matchStatus;
    });
  }, [orders, search, paymentFilter, statusFilter]);

  const awaitingCount = orders.filter(isAwaiting).length;

  async function mutate(id: string, body: any, okMsg: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/storefront-orders/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.error || "Gagal memperbarui.");
      const updated = (data as any).order as OnlineOrder;
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
      setSelected((prev) => (prev?.id === id ? { ...prev, ...updated } : prev));
      toast.success(okMsg);
      return true;
    } catch (e: any) {
      toast.error(e?.message || "Gagal memperbarui pesanan.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function confirmReject(id: string) {
    const reason = rejectReason.trim();
    if (reason.length < 3) {
      toast.error("Alasan penolakan wajib diisi (minimal 3 karakter).");
      return;
    }
    const ok = await mutate(id, { action: "reject", reason }, "Pembayaran ditolak");
    if (ok) {
      setRejectingId(null);
      setRejectReason("");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Pesanan Online"
        description="Kelola pesanan storefront, verifikasi pembayaran, dan perbarui status."
        actions={
          <Button variant="outline" className="rounded-xl" onClick={() => load()} disabled={loading}>
            <RefreshCwIcon className={cn("size-4", loading && "animate-spin")} />
            Muat ulang
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="rounded-2xl border-border/70 p-4">
          <p className="text-xs text-muted-foreground">Total pesanan</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{formatNumber(orders.length)}</p>
        </Card>
        <Card className="rounded-2xl border-border/70 p-4">
          <p className="text-xs text-muted-foreground">Menunggu verifikasi</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{formatNumber(awaitingCount)}</p>
        </Card>
        <Card className="rounded-2xl border-border/70 p-4">
          <p className="text-xs text-muted-foreground">Terverifikasi/paid</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {formatNumber(orders.filter((o) => ["verified", "paid"].includes(norm(o.paymentStatus))).length)}
          </p>
        </Card>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-3 sm:flex-row sm:items-center sm:p-4">
        <div className="min-w-0 flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Cari order, nama, atau telepon..." />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="h-9 w-full rounded-xl sm:w-[180px]"><SelectValue placeholder="Pembayaran" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua pembayaran</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="awaiting_verification">Menunggu verifikasi</SelectItem>
              <SelectItem value="verified">Terverifikasi</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-full rounded-xl sm:w-[170px]"><SelectValue placeholder="Status order" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              {ORDER_STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <Card className="rounded-2xl border-border/70 p-6 text-sm text-muted-foreground">Memuat pesanan online...</Card>
      ) : error ? (
        <Card className="rounded-2xl border-border/70 p-6 text-sm text-destructive">{error}</Card>
      ) : !filtered.length ? (
        <EmptyState
          icon={ShoppingBagIcon}
          title="Belum ada pesanan online"
          description={orders.length ? "Tidak ada pesanan yang cocok dengan filter." : "Pesanan dari menu storefront akan muncul di sini."}
          className="rounded-2xl border-border/70 bg-card/40"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const awaiting = isAwaiting(order);
            return (
              <Card key={order.id} className="rounded-2xl border-border/70 p-4 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold tabular-nums">{order.orderNumber}</p>
                      <Badge variant={awaiting ? "secondary" : norm(order.paymentStatus) === "verified" ? "default" : "outline"} className="rounded-full">
                        {payLabel(order.paymentStatus)}
                      </Badge>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.guestName} · {order.guestPhone}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(order.createdAt)} · {formatNumber(order.items?.length || 0)} item · {order.orderType}
                    </p>
                  </div>
                  <div className="flex items-end justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
                    <p className="text-base font-semibold tabular-nums">{formatCurrency(order.grandTotal)}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setSelected(order)}>
                        <EyeIcon className="size-4" /> Detail
                      </Button>
                      {awaiting ? (
                        <>
                          <Button
                            size="sm"
                            className="rounded-xl"
                            disabled={busy === order.id}
                            onClick={() => mutate(order.id, { action: "verify" }, "Pembayaran diverifikasi")}
                          >
                            <BadgeCheckIcon className="size-4" /> Verifikasi
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="rounded-xl"
                            disabled={busy === order.id}
                            onClick={() => {
                              setSelected(order);
                              setRejectingId(order.id);
                              setRejectReason("");
                            }}
                          >
                            <BanIcon className="size-4" /> Tolak
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Drawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DrawerContent className="max-h-[92svh] overflow-hidden">
          <DrawerHeader className="border-b text-left">
            <DrawerTitle>{selected?.orderNumber || "Detail Pesanan"}</DrawerTitle>
            <DrawerDescription>
              {selected ? `${selected.guestName} · ${selected.guestPhone} · ${formatDateTime(selected.createdAt)}` : ""}
            </DrawerDescription>
          </DrawerHeader>
          {selected ? (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isAwaiting(selected) ? "secondary" : "outline"} className="rounded-full">
                  Bayar: {payLabel(selected.paymentStatus)}
                </Badge>
                <StatusBadge status={selected.status} />
                {selected.proofSubmitted ? (
                  <Badge variant="outline" className="rounded-full">Bukti dikirim</Badge>
                ) : null}
              </div>

              <Card className="rounded-2xl border-border/70 p-4">
                <p className="text-sm font-medium">Item pesanan</p>
                <div className="mt-3 space-y-2">
                  {(selected.items || []).map((i, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-3 text-sm">
                      <span className="min-w-0 flex-1">
                        <span className="font-medium tabular-nums">{i.quantity}×</span>{" "}
                        {i.productName || i.name}
                        {i.variantName ? <span className="text-muted-foreground"> · {i.variantName}</span> : null}
                        {i.notes ? <span className="block text-xs text-muted-foreground">{i.notes}</span> : null}
                      </span>
                      <span className="shrink-0 tabular-nums">{formatCurrency(Number(i.subtotal ?? i.lineTotal ?? 0))}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatCurrency(selected.subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Pajak</span><span className="tabular-nums">{formatCurrency(selected.taxTotal)}</span></div>
                  <div className="flex justify-between text-base font-semibold"><span>Total</span><span className="tabular-nums">{formatCurrency(selected.grandTotal)}</span></div>
                </div>
              </Card>

              <Card className="rounded-2xl border-border/70 p-4 space-y-3">
                <p className="text-sm font-medium">Pembayaran & verifikasi</p>
                <p className="text-sm text-muted-foreground">
                  Metode: {String(selected.paymentMethod || "qris").toUpperCase()} · Status: {payLabel(selected.paymentStatus)}
                </p>
                {selected.proofUrl ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={selected.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-border/70 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                    >
                      <EyeIcon className="size-4" /> Lihat bukti pembayaran
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() =>
                        downloadDataUrl(
                          selected.proofUrl!,
                          `bukti-pembelian-${selected.orderNumber}.jpg`,
                        )}
                      >
                      <DownloadIcon className="size-4" /> Unduh bukti
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Belum ada bukti pembayaran.</p>
                )}
                {norm(selected.paymentStatus) === "rejected" && selected.rejectionReason ? (
                  <div className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
                    <p><span className="font-medium">Alasan penolakan:</span> {selected.rejectionReason}</p>
                  </div>
                ) : null}
                <div className="space-y-2">
                  {isAwaiting(selected) ? (
                    rejectingId === selected.id ? (
                      <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                        <p className="text-sm font-medium text-destructive">Tolak pembayaran</p>
                        <Textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Tulis alasan penolakan untuk pelanggan (wajib, min. 3 karakter)..."
                          className="min-h-24 rounded-xl bg-background"
                          maxLength={300}
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" className="rounded-xl" disabled={busy === selected.id} onClick={() => { setRejectingId(null); setRejectReason(""); }}>
                            Batal
                          </Button>
                          <Button size="sm" variant="destructive" className="rounded-xl" disabled={busy === selected.id || rejectReason.trim().length < 3} onClick={() => confirmReject(selected.id)}>
                            <XCircleIcon className="size-4" /> Konfirmasi tolak
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" className="rounded-xl" disabled={busy === selected.id} onClick={() => mutate(selected.id, { action: "verify" }, "Pembayaran diverifikasi")}>
                          <CheckCircle2Icon className="size-4" /> Verifikasi pembayaran
                        </Button>
                        <Button size="sm" variant="destructive" className="rounded-xl" disabled={busy === selected.id} onClick={() => { setRejectingId(selected.id); setRejectReason(""); }}>
                          <BanIcon className="size-4" /> Tolak
                        </Button>
                      </div>
                    )
                  ) : (
                    <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock3Icon className="size-4" /> Verifikasi tersedia saat status menunggu verifikasi.
                    </p>
                  )}
                </div>
              </Card>

              <Card className="rounded-2xl border-border/70 p-4 space-y-3">
                <p className="text-sm font-medium">Status pesanan</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Select
                    value={selected.status}
                    onValueChange={(v) => mutate(selected.id, { action: "set-status", status: v }, "Status pesanan diperbarui")}
                  >
                    <SelectTrigger className="h-10 w-full rounded-xl sm:w-56" disabled={busy === selected.id}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">Ubah status proses (pending → selesai/batal).</span>
                </div>
              </Card>

              {selected.notes ? (
                <Card className="rounded-2xl border-border/70 p-4">
                  <p className="text-sm font-medium">Catatan</p>
                  <p className="mt-1 text-sm text-muted-foreground">{selected.notes}</p>
                </Card>
              ) : null}
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
