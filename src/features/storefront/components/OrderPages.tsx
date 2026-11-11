"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  Loader2,
  QrCode,
  RefreshCw,
  ScanLine,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PublicNavigation } from "@/components/public/PublicNavigation";
import { getJson } from "@/features/storefront/api";
import { formatCurrency } from "@/lib/format";

function norm(v: unknown) {
  return String(v || "").trim().toUpperCase();
}
function rp(v: number) {
  return formatCurrency(v);
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed right-3 top-3 z-30 hidden lg:block">
        <PublicNavigation variant="desktop" />
      </div>
      <div className="mx-auto min-h-svh w-full max-w-lg px-3 pb-[calc(env(safe-area-inset-bottom)+4.5rem)] sm:px-4 lg:pb-8">
        {children}
      </div>
      <PublicNavigation variant="mobile" />
    </>
  );
}

function CenterState({ icon: Icon, title, desc, spin }: { icon: any; title: string; desc?: string; spin?: boolean }) {
  return (
    <Shell>
      <div className="flex min-h-[70svh] flex-col items-center justify-center px-4 text-center">
        <span className="flex size-11 items-center justify-center rounded-2xl border bg-muted/30">
          <Icon className={`size-5 text-muted-foreground ${spin ? "animate-spin" : ""}`} aria-hidden />
        </span>
        <p className="mt-3 text-base font-semibold">{title}</p>
        {desc ? <p className="mt-1 text-sm text-muted-foreground">{desc}</p> : null}
      </div>
    </Shell>
  );
}

export function StorefrontPaymentPage({ orderId }: { orderId: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [ref, setRef] = useState("");
  const paymentId = sp.get("paymentId") || order?.payment?.id || "";

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const r = await getJson<{ order: any }>(`/api/public/orders/${encodeURIComponent(orderId)}`);
      setOrder(r.order ?? null);
    } catch (e: any) {
      if (!silent) toast.error(e?.message || "Gagal memuat pembayaran.");
      setOrder(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [orderId]);

  async function upload() {
    const pid = paymentId || order?.payment?.id || orderId;
    if (!file) { toast.error("Pilih file bukti pembayaran."); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("orderId", orderId);
      fd.set("paymentId", pid);
      if (ref.trim()) fd.set("referenceNumber", ref.trim());
      fd.set("file", file);
      const res = await fetch("/api/public/payments/proof", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.error || "Upload gagal.");
      toast.success("Bukti terkirim.");
      setFile(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Upload gagal.");
    } finally {
      setUploading(false);
    }
  }

  async function copy(text?: string | null) {
    if (!text) return;
    try { await navigator.clipboard.writeText(text); toast.success("Disalin"); } catch {}
  }

  if (loading) return <CenterState icon={Loader2} title="Memuat pembayaran..." spin />;
  if (!order) return <CenterState icon={AlertTriangle} title="Pembayaran tidak tersedia" desc="Buka ulang dari perangkat saat checkout." />;

  const ps = norm(order.paymentStatus);
  const payState = norm(order.payment?.status);
  const paid = ["PAID", "COMPLETED", "VERIFIED"].includes(ps) || ["COMPLETED", "VERIFIED"].includes(payState);
  const rejected = ["REJECTED", "FAILED"].includes(payState) || ps === "REJECTED";
  const inactive = ["EXPIRED", "CANCELLED"].includes(ps) || ["EXPIRED", "CANCELLED"].includes(payState);
  const awaiting = !!order.payment?.proofSubmitted || payState === "AWAITING_VERIFICATION" || ps === "AWAITING_VERIFICATION";
  const canUpload = !paid && !inactive;
  const ins = order.payment?.instructions || {};
  const qrisImage = ins.qrisImageUrl || "/WarjokQris.jpeg";
  const rejectionReason = order.payment?.rejectionReason || order.rejectionReason || null;

  return (
    <Shell>
      <div className="sticky top-0 z-10 -mx-3 border-b bg-background/95 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur sm:-mx-4 sm:px-4">
        <div className="flex items-center gap-2">
          <button type="button" className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted" onClick={() => router.push(`/menu/order/${encodeURIComponent(orderId)}`)} aria-label="Kembali">
            <ArrowLeft className="size-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Pembayaran QRIS</p>
            <p className="truncate text-xs text-muted-foreground">{order.orderNumber}</p>
          </div>
          <Button size="icon-sm" variant="ghost" className="rounded-xl" onClick={() => load()} aria-label="Muat ulang"><RefreshCw className="size-4" /></Button>
        </div>
      </div>

      <div className="space-y-3 pt-3">
        <Card className="overflow-hidden rounded-2xl border-border/70 p-0">
          <div className="bg-gradient-to-br from-primary/10 via-background to-emerald-500/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><QrCode className="size-3.5" /> Total pembayaran</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{rp(order.totals?.total || 0)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{ins.merchantName || "Warjok"} · Scan & bayar sesuai nominal</p>
              </div>
              <Badge variant={paid ? "default" : rejected || inactive ? "destructive" : "secondary"} className="rounded-full">
                {paid ? "Terverifikasi" : awaiting ? "Menunggu verifikasi" : rejected ? "Ditolak" : "Belum bayar"}
              </Badge>
            </div>
            <div className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-xs ${paid ? "bg-green-500/10 text-green-700 dark:text-green-300" : rejected ? "bg-destructive/10 text-destructive" : awaiting ? "bg-blue-500/10 text-blue-700 dark:text-blue-300" : "bg-muted/50 text-muted-foreground"}`}>
              {paid ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : awaiting ? <Clock3 className="mt-0.5 size-4 shrink-0" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" />}
              <div className="min-w-0">
                <span>{paid ? "Pembayaran terverifikasi." : rejected ? "Bukti pembayaran ditolak oleh kasir." : awaiting ? "Bukti diterima, menunggu verifikasi kasir." : "Wajib scan QRIS dan kirim bukti pembayaran."}</span>
                {rejected && rejectionReason ? <p className="mt-1 font-medium">Alasan: {rejectionReason}</p> : null}
              </div>
            </div>
          </div>

          {!paid ? (
            <div className="border-t p-4">
              <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
                <ScanLine className="size-4" />
                <span>Scan QRIS untuk membayar</span>
              </div>
              <div className="mt-3 flex justify-center">
                <div className="rounded-2xl border bg-white p-2 shadow-sm">
                  <img
                    src={qrisImage}
                    alt="QRIS Warjok"
                    className="h-auto w-full max-w-[280px] rounded-xl object-contain sm:max-w-[320px]"
                  />
                </div>
              </div>
              <div className="mt-4 rounded-xl border bg-muted/20 p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Langkah pembayaran</p>
                <ol className="mt-3 space-y-2.5 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">1</span>
                    <span className="pt-0.5 leading-snug text-muted-foreground">Buka aplikasi <span className="font-medium text-foreground">e-wallet</span> atau <span className="font-medium text-foreground">mobile banking</span>.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">2</span>
                    <span className="pt-0.5 leading-snug text-muted-foreground">Scan QRIS dan bayar sebesar <span className="font-semibold tabular-nums text-foreground">{rp(order.totals?.total || 0)}</span>.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">3</span>
                    <span className="pt-0.5 leading-snug text-muted-foreground">Simpan dan unggah <span className="font-medium text-foreground">bukti pembayaran</span> di bawah.</span>
                  </li>
                </ol>
              </div>
            </div>
          ) : null}
        </Card>

        {canUpload ? (
          <Card className="space-y-3 rounded-2xl p-4">
            <div>
              <p className="text-sm font-medium">Kirim bukti pembayaran <span className="text-destructive">*</span></p>
              <p className="mt-0.5 text-xs text-muted-foreground">{rejected ? "Unggah ulang bukti pembayaran yang sesuai agar dapat diverifikasi kasir." : "Wajib unggah bukti bayar QRIS agar pesanan dapat diverifikasi."}</p>
            </div>
            <Input value={ref} onChange={(e) => setRef(e.target.value)} className="h-10 rounded-xl" placeholder="No. referensi (opsional)" />
            <label htmlFor="proof-file" className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-3 text-sm transition-colors hover:bg-muted/30">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted"><Upload className="size-4 text-muted-foreground" /></span>
              <span className="min-w-0 flex-1 truncate">{file ? file.name : "Pilih foto/PDF bukti (wajib, maks 5MB)"}</span>
            </label>
            <Input id="proof-file" type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <Button className="h-10 w-full rounded-xl" disabled={uploading || !file} onClick={upload}>
              {uploading ? <><Loader2 className="size-4 animate-spin" />Mengunggah...</> : "Kirim bukti pembayaran"}
            </Button>
          </Card>
        ) : null}

        <Button variant="outline" className="h-10 w-full rounded-xl" onClick={() => router.push(`/menu/order/${encodeURIComponent(orderId)}`)}>
          Lihat status pesanan
        </Button>
      </div>
    </Shell>
  );
}

export function StorefrontTrackingPage({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const r = await getJson<{ order: any }>(`/api/public/orders/${encodeURIComponent(orderId)}`);
      setOrder(r.order ?? null);
    } catch (e: any) {
      if (!silent) toast.error(e?.message || "Gagal memuat status.");
      setOrder(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const t = setInterval(() => load(true), 12000);
    return () => clearInterval(t);
  }, [orderId]);

  if (loading) return <CenterState icon={Loader2} title="Memuat status..." spin />;
  if (!order) return <CenterState icon={AlertTriangle} title="Status tidak tersedia" desc="Buka ulang dari perangkat saat checkout." />;

  const ps = norm(order.paymentStatus);
  const paid = ["PAID", "COMPLETED", "VERIFIED"].includes(ps);
  const awaiting = norm(order.payment?.status) === "AWAITING_VERIFICATION" || ps === "AWAITING_VERIFICATION";
  const rejected = ["REJECTED", "FAILED"].includes(norm(order.payment?.status)) || ps === "REJECTED";
  const rejectionReason = order.payment?.rejectionReason || order.rejectionReason || null;

  return (
    <Shell>
      <div className="sticky top-0 z-10 -mx-3 border-b bg-background/95 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur sm:-mx-4 sm:px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Status pesanan</p>
            <p className="truncate text-sm font-semibold">{order.orderNumber}</p>
          </div>
          <Button size="icon-sm" variant="ghost" className="rounded-xl" onClick={() => load()} aria-label="Muat ulang"><RefreshCw className="size-4" /></Button>
        </div>
      </div>

      <div className="space-y-3 pt-3">
        <Card className="rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${paid ? "bg-green-500/10 text-green-700 dark:text-green-300" : awaiting ? "bg-blue-500/10 text-blue-700 dark:text-blue-300" : rejected ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
              {paid ? <CheckCircle2 className="size-5" /> : awaiting ? <Clock3 className="size-5" /> : <AlertTriangle className="size-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold capitalize">{String(order.orderStatus || "-")}</p>
              <p className="text-sm text-muted-foreground">
                {paid ? "Pembayaran terverifikasi." : awaiting ? "Bukti diterima, menunggu verifikasi kasir." : rejected ? "Pembayaran ditolak oleh kasir." : "Wajib kirim bukti pembayaran QRIS agar pesanan diproses."}
              </p>
              {rejected && rejectionReason ? (
                <p className="mt-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">Alasan: {rejectionReason}</p>
              ) : null}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full">Order: {String(order.orderStatus || "-")}</Badge>
            <Badge variant={paid ? "default" : rejected ? "destructive" : "secondary"} className="rounded-full">Bayar: {String(order.paymentStatus || "-")}</Badge>
          </div>
        </Card>

        <Card className="rounded-2xl p-4">
          <p className="text-sm font-medium">Ringkasan</p>
          <div className="mt-2 space-y-2">
            {(order.items || []).map((i: any, idx: number) => {
              const dims = [];
              if (i.diameterCm != null) dims.push(`⌀${Number(i.diameterCm).toFixed(0)} ${i.dimensionUnit || "cm"}`);
              if (i.lengthCm != null) dims.push(`P${Number(i.lengthCm).toFixed(0)}`);
              if (i.widthCm != null) dims.push(`L${Number(i.widthCm).toFixed(0)}`);
              if (i.heightCm != null) dims.push(`T${Number(i.heightCm).toFixed(0)}`);
              const dimText = dims.length ? ` (${dims.join(" × ")})` : "";
              return (
                <div key={idx} className="flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0 flex-1"><span className="font-medium tabular-nums">{i.quantity}×</span> {i.productName}{i.variantName ? ` · ${i.variantName}` : ""}{dimText}</span>
                  <span className="shrink-0 tabular-nums">{rp(i.subtotal)}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{rp(order.totals?.subtotal || 0)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pajak</span><span className="tabular-nums">{rp(order.totals?.tax || 0)}</span></div>
            <div className="flex justify-between pt-1 font-semibold"><span>Total</span><span className="tabular-nums">{rp(order.totals?.total || 0)}</span></div>
          </div>
        </Card>

        <Button className="h-10 w-full rounded-xl" onClick={() => router.push(`/menu/order/${encodeURIComponent(orderId)}/payment?paymentId=${encodeURIComponent(order.payment?.id || orderId)}`)}>
          <CreditCard className="size-4" /> {rejected ? "Kirim ulang bukti pembayaran" : "Buka pembayaran"}
        </Button>
      </div>
    </Shell>
  );
}
