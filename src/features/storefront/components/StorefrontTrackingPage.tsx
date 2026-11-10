"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNavigation } from "@/components/public/PublicNavigation";
import { getJson } from "@/features/storefront/api";
import { formatCurrency } from "@/lib/format";

function norm(v: unknown) {
  return String(v || "").trim().toUpperCase();
}

function TopDesktopNav() {
  return (
    <div className="fixed right-3 top-3 z-30 hidden lg:block">
      <PublicNavigation variant="desktop" />
    </div>
  );
}

export function StorefrontTrackingPage({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const r = await getJson<{ order: any }>(
        `/api/public/orders/${encodeURIComponent(orderId)}`,
      );
      setOrder(r.order ?? null);
    } catch (e: any) {
      if (!silent) toast.error(e?.message || "Gagal memuat status.");
      setOrder(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 12000);
    return () => clearInterval(t);
  }, [orderId]);

  if (loading)
    return (
      <>
        <TopDesktopNav />
        <div className="mx-auto max-w-xl px-4 py-6 pb-[calc(env(safe-area-inset-bottom)+6rem)]">
          <Card className="rounded-3xl p-6 text-sm text-muted-foreground">
            Memuat status pesanan...
          </Card>
        </div>
        <PublicNavigation variant="mobile" />
      </>
    );
  if (!order)
    return (
      <>
        <TopDesktopNav />
        <div className="mx-auto flex min-h-[70svh] max-w-md flex-col items-center justify-center px-6 pb-[calc(env(safe-area-inset-bottom)+6rem)] text-center">
          <AlertTriangle className="size-6 text-muted-foreground" />
          <h1 className="mt-3 text-lg font-semibold">Status tidak tersedia</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gunakan perangkat/browser yang sama saat checkout.
          </p>
        </div>
        <PublicNavigation variant="mobile" />
      </>
    );
  const ps = norm(order.paymentStatus);
  const paid = ps === "PAID" || ps === "COMPLETED" || ps === "VERIFIED";
  const awaiting =
    norm(order.payment?.status) === "AWAITING_VERIFICATION" ||
    ps === "AWAITING_VERIFICATION";
  return (
    <>
      <TopDesktopNav />
      <div className="mx-auto min-h-svh max-w-xl pb-[calc(env(safe-area-inset-bottom)+6rem)] lg:pb-8">
        <div className="sticky top-0 z-10 border-b bg-background/80 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl sm:px-5 lg:pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Warjok order tracking
              </p>
              <h1 className="mt-1 text-xl font-semibold">Status Pesanan</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {order.orderNumber}
              </p>
            </div>
            <Button
              size="icon-sm"
              variant="outline"
              className="rounded-xl"
              onClick={() => load()}
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-4 px-4 pt-4 sm:px-5">
          <Card className="rounded-3xl p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex size-10 items-center justify-center rounded-2xl ${paid ? "bg-green-500/10 text-green-700 dark:text-green-300" : awaiting ? "bg-blue-500/10 text-blue-700 dark:text-blue-300" : "bg-muted text-muted-foreground"}`}
              >
                {paid ? (
                  <CheckCircle2 className="size-5" />
                ) : awaiting ? (
                  <Clock3 className="size-5" />
                ) : (
                  <UtensilsCrossed className="size-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{order.status}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {paid
                    ? "Pembayaran terverifikasi. Pesanan dapat diproses."
                    : awaiting
                      ? "Bukti diterima, menunggu verifikasi staff."
                      : "Pembayaran manual perlu verifikasi staff sebelum diproses."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary">Order: {order.status}</Badge>
                  <Badge variant={paid ? "default" : "secondary"}>
                    Bayar: {order.paymentStatus}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
          <Card className="rounded-3xl p-4 sm:p-5">
            <p className="text-sm font-medium">Ringkasan item</p>
            <div className="mt-3 space-y-2">
              {(order.items || []).map((i: any, idx: number) => (
                <div key={idx} className="flex justify-between gap-3 text-sm">
                  <span>
                    {i.quantity}x {i.name}
                    {i.variantName ? ` · ${i.variantName}` : ""}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(i.lineTotal)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Pajak</span>
                <span>{formatCurrency(order.taxTotal)}</span>
              </div>
              <div className="mt-2 flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(order.grandTotal)}</span>
              </div>
            </div>
          </Card>
          <Button
            variant="outline"
            className="h-11 w-full rounded-2xl"
            onClick={() =>
              router.push(
                `/menu/order/${encodeURIComponent(orderId)}/payment?paymentId=${encodeURIComponent(order.id || "")}`,
              )
            }
          >
            Buka Halaman Pembayaran
          </Button>
        </div>
      </div>
      <PublicNavigation variant="mobile" />
    </>
  );
}
