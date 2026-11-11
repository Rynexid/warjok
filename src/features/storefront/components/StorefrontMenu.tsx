"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronRightIcon,
  FunnelIcon,
  FunnelPlusIcon,
  FunnelXIcon,
  ImageOffIcon,
  Loader2Icon,
  MinusIcon,
  PackageIcon,
  PlusIcon,
  SearchIcon,
  ShoppingBagIcon,
  StoreIcon,
  Trash2Icon,
  UserCircle2Icon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/format";
import { getJson, postJson } from "@/features/storefront/api";
import { PublicNavigation } from "@/components/public/PublicNavigation";
import { useRealUser } from "@/hooks/use-real-user";
import { useIsMobile } from "@/hooks/useMobile";
import { EmptyState } from "@/components/shared/EmptyState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

type Variant = { id: string; name: string; sellingPrice: number | null };
type Product = {
  id: string; name: string; description?: string | null; categoryId?: string | null;
  sellingPrice: number; imageUrl?: string | null; isTaxable: boolean; available: boolean; maxQuantity?: number | null; variants: Variant[];
};
type Category = { id: string; name: string; sortOrder: number };
type CartLine = {
  key: string; productId: string; variantId?: string | null; name: string; variantName?: string | null;
  quantity: number; unitPrice: number; notes?: string;
};
type CatalogResp = {
  ok: true;
  catalog: {
    business: { name: string; description?: string | null; logoUrl?: string | null; city?: string | null };
    payment: { storefrontCheckoutEnabled: boolean; manualTransferEnabled: boolean; qrisEnabled?: boolean; methods: { id: string; label: string }[] };
    categories: Category[]; products: Product[];
  };
  context: { mode: "direct" };
};

const CART_KEY = "warjok_storefront_cart";
const IDEM_KEY = "warjok_storefront_idem";
const MAX_QTY = 99;

function initials(name?: string | null) {
  const n = (name || "").trim();
  if (!n) return "U";
  return n.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}
function cartKey(p: Product, variantId?: string | null, notes?: string) {
  return `${p.id}:${variantId || ""}:${(notes || "").trim().toLowerCase()}`;
}
function idemKey() {
  try {
    let v = sessionStorage.getItem(IDEM_KEY);
    if (!v) {
      v =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(IDEM_KEY, v);
    }
    return v;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
function unitPrice(p: Product, variantId?: string | null) {
  return Number(p.variants.find((v) => v.id === variantId)?.sellingPrice ?? p.sellingPrice);
}
function qtyForProduct(cart: CartLine[], productId: string) {
  return cart.filter((l) => l.productId === productId).reduce((s, l) => s + l.quantity, 0);
}
function maxForProduct(p: Product) {
  return typeof p.maxQuantity === "number" ? Math.max(0, Math.floor(p.maxQuantity)) : MAX_QTY;
}

function ProductVisual({ p, className }: { p: Product; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (p.imageUrl && !failed) {
    return <img src={p.imageUrl} alt={p.name} loading="lazy" decoding="async" onError={() => setFailed(true)} className={cn("size-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.03]", className)} />;
  }
  return (
    <div className={cn("flex size-full items-center justify-center bg-muted/60 text-muted-foreground", className)}>
      <ImageOffIcon aria-hidden="true" className="size-6 opacity-50" />
    </div>
  );
}

function QuantityStepper({
  value, onDecrease, onIncrease, max = MAX_QTY, size = "sm", disabled, className, disableIncrease,
}: {
  value: number; onDecrease: () => void; onIncrease: () => void; max?: number; size?: "sm" | "default"; disabled?: boolean; className?: string; disableIncrease?: boolean;
}) {
  const btn = size === "sm" ? "size-8 rounded-[10px]" : "size-10 rounded-xl";
  return (
    <div className={cn("inline-flex items-center gap-0.5 rounded-xl border border-border/80 bg-background p-0.5 shadow-[0_1px_0_rgba(0,0,0,0.02)]", className)}>
      <Button type="button" variant="ghost" size="icon" className={cn(btn, "text-foreground/80")} onClick={onDecrease} aria-label={value <= 1 ? "Hapus dari keranjang" : "Kurangi jumlah"}>
        {value <= 1 ? <Trash2Icon aria-hidden="true" className="size-4" /> : <MinusIcon aria-hidden="true" className="size-4" />}
      </Button>
      <span className={cn("min-w-7 text-center font-semibold tabular-nums", size === "sm" ? "text-xs" : "text-sm")} aria-live="polite" aria-atomic="true">{value}</span>
      <Button type="button" variant="ghost" size="icon" className={cn(btn, "text-foreground/80")} onClick={onIncrease} disabled={disabled || !!disableIncrease || value >= max} aria-label="Tambah jumlah">
        <PlusIcon aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}

function ResponsivePanel({
  open, onOpenChange, title, description, children, footer,
}: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode;
}) {
  const mobile = useIsMobile();
  if (mobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92svh] overflow-hidden border-border/80">
          <DrawerHeader className="shrink-0 border-b border-border/70 px-4 pb-3 pt-1 text-left">
            <DrawerTitle className="text-base tracking-tight">{title}</DrawerTitle>
            {description ? <DrawerDescription className="text-[13px] leading-5">{description}</DrawerDescription> : null}
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
          {footer ? <DrawerFooter className="shrink-0 border-t border-border/70 bg-background/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">{footer}</DrawerFooter> : null}
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-border/80 sm:max-w-md">
        <SheetHeader className="border-b border-border/70">
          <SheetTitle className="tracking-tight">{title}</SheetTitle>
          {description ? <SheetDescription className="text-[13px] leading-5">{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
        {footer ? <SheetFooter className="border-t border-border/70 bg-background">{footer}</SheetFooter> : null}
      </SheetContent>
    </Sheet>
  );
}

function StorefrontProductCard({
  product, categoryName, quantity, onOpen, onQuickAdd, onIncrement, onDecrement,
}: {
  product: Product; categoryName: string; quantity: number; onOpen: () => void; onQuickAdd: () => void; onIncrement: () => void; onDecrement: () => void;
}) {
  const hasChoices = (product.variants?.length || 0) > 0;
  const maxQty = maxForProduct(product);
  const atMax = typeof product.maxQuantity === "number" && quantity >= maxQty;
  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-[0_1px_0_rgba(0,0,0,0.02)] motion-safe:transition-[border-color,box-shadow,transform] motion-safe:duration-200 hover:border-border motion-safe:hover:-translate-y-px">
      <button type="button" onClick={onOpen} className="block w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset" aria-label={`Lihat detail ${product.name}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
          <ProductVisual p={product} />
          {!product.available ? (
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-background/70 via-background/10 to-transparent p-2.5">
              <span className="rounded-full border border-border/70 bg-background/90 px-2 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">Habis</span>
            </div>
          ) : quantity > 0 ? (
            <div className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-background/92 px-2 py-1 text-[11px] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-sm">
              <CheckIcon aria-hidden="true" className="size-3 text-foreground/80" /> {quantity}{typeof product.maxQuantity === "number" ? <span className="font-medium text-muted-foreground">/{product.maxQuantity}</span> : null}
            </div>
          ) : null}
        </div>
      </button>
      <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-3.5">
        <p className="truncate text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/90">{categoryName}</p>
        <button type="button" onClick={onOpen} className="mt-1 min-w-0 text-left outline-none focus-visible:underline">
          <h2 className="line-clamp-2 min-h-[2.5rem] text-[13px] font-medium leading-5 text-foreground sm:text-sm">{product.name}</h2>
        </button>
        <p className={cn("mt-1 line-clamp-2 min-h-[2rem] text-[11px] leading-4 sm:text-xs", product.description ? "text-muted-foreground" : "text-transparent select-none")} aria-hidden={!product.description}>{product.description || "—"}</p>
        <div className="mt-3 flex items-end justify-between gap-2 border-t border-border/50 pt-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tabular-nums tracking-tight sm:text-[15px]">{formatCurrency(Number(product.sellingPrice))}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {hasChoices ? `${product.variants.length} pilihan` : typeof product.maxQuantity === "number" ? `Sisa ${formatNumber(product.maxQuantity)}` : product.available ? "Siap dipesan" : ""}
            </p>
          </div>
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            {!product.available ? (
              <Button type="button" size="sm" variant="outline" disabled className="h-9 rounded-xl px-3 text-xs">Habis</Button>
            ) : quantity > 0 && !hasChoices ? (
              <QuantityStepper value={quantity} onDecrease={onDecrement} onIncrease={onIncrement} size="sm" max={maxQty} disableIncrease={atMax} className="max-w-full" />
            ) : quantity > 0 && hasChoices ? (
              <Button type="button" size="sm" variant="secondary" className="h-9 rounded-xl px-3 text-xs" onClick={onOpen} disabled={atMax}>
                Atur <span className="ml-1 rounded-md bg-foreground/8 px-1.5 py-0.5 tabular-nums">{quantity}</span>
              </Button>
            ) : (
              <Button type="button" size="sm" className="h-9 rounded-xl px-3 text-xs shadow-none" onClick={hasChoices ? onOpen : onQuickAdd}>
                <PlusIcon aria-hidden="true" className="size-3.5" /> <span className="max-[359px]:sr-only">Tambah</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function MenuDesktopTopBar({ biz, user }: { biz: { name: string; logoUrl?: string | null } | null; user: any }) {
  return (
    <div className="hidden lg:fixed lg:inset-x-0 lg:top-0 lg:z-40 lg:block lg:border-b lg:border-border/60 lg:bg-background/95 lg:backdrop-blur supports-[backdrop-filter]:lg:bg-background/85">
      <div className="mx-auto flex h-[57px] max-w-6xl items-center justify-between gap-3 px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link href="/menu" className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/20 outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Menu">
            {biz?.logoUrl ? <img src={biz.logoUrl} alt="" className="size-full object-cover" /> : <span className="text-[11px] font-semibold">{(biz?.name || "W").slice(0, 1).toUpperCase()}</span>}
          </Link>
          <span className="min-w-0 truncate text-sm font-medium tracking-tight">{biz?.name || "Menu"}</span>
        </div>
        <div className="flex items-center gap-2">
          <PublicNavigation variant="desktop" />
          {user ? (
            <Link href="/profile" className="rounded-full" aria-label="Profil">
              <Avatar>
                {user.image ? <AvatarImage src={user.image} alt={user.name || "Profil"} /> : null}
                <AvatarFallback>{initials(user.name || user.email)}</AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Button asChild variant="ghost" size="sm" className="rounded-xl">
              <Link href="/login"><UserCircle2Icon className="size-4" /> Masuk</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function StorefrontMenu() {
  const router = useRouter();
  const user = useRealUser(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CatalogResp | null>(null);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);
  const [dVariant, setDVariant] = useState<string | null>(null);
  const [dQty, setDQty] = useState(1);
  const [dNotes, setDNotes] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const prevCount = useRef(0);

  useEffect(() => {
    let on = true;
    getJson<CatalogResp>("/api/public/storefront/catalog")
      .then((r) => { if (on) setData(r); })
      .catch((e: any) => { if (on) setError(e?.message || "Gagal memuat katalog."); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, []);
  useEffect(() => {
    try { setCart(JSON.parse(sessionStorage.getItem(CART_KEY) || "[]")); } catch { setCart([]); }
  }, []);
  useEffect(() => { try { sessionStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {} }, [cart]);
  useEffect(() => {
    const catalogProducts = data?.catalog?.products ?? [];
    if (!catalogProducts.length || !cart.length) return;
    const byId = new Map(catalogProducts.map((p) => [p.id, p]));
    setCart((prev) => {
      let changed = false;
      const totals = new Map<string, number>();
      for (const l of prev) totals.set(l.productId, (totals.get(l.productId) || 0) + l.quantity);
      const next = prev.flatMap((l) => {
        const p = byId.get(l.productId);
        if (!p || !p.available) { changed = true; return []; }
        if (typeof p.maxQuantity !== "number") return [l];
        let allowed = p.maxQuantity;
        for (const [pid, qty] of totals) if (pid !== l.productId) allowed -= qty;
        const capped = Math.max(0, Math.min(l.quantity, allowed));
        if (capped !== l.quantity) { changed = true; totals.set(l.productId, (totals.get(l.productId) || 0) - (l.quantity - capped)); }
        return capped > 0 ? [{ ...l, quantity: capped }] : [];
      });
      return changed ? next : prev;
    });
  }, [data, cart.length]);

  useEffect(() => {
    if (user && !name) setName(user.name || "");
  }, [user, name]);

  const categories = data?.catalog?.categories ?? [];
  const products = data?.catalog?.products ?? [];
  const categoryName = (id?: string | null) => categories.find((c) => c.id === id)?.name || "Menu";
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) =>
      (categoryId === "all" || p.categoryId === categoryId) &&
      (!showAvailableOnly || p.available) &&
      (!q || p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q)),
    );
  }, [products, search, categoryId, showAvailableOnly]);

  function openDetail(p: Product) {
    if (!p.available) { toast.error("Produk sedang tidak tersedia"); return; }
    setDetail(p); setDVariant(p.variants?.[0]?.id || null); setDQty(1); setDNotes("");
  }
  function addToCart(p: Product, variantId?: string | null, qty = 1, itemNotes?: string) {
    if (!p.available) return;
    const maxQty = maxForProduct(p);
    const inCart = qtyForProduct(cart, p.id);
    if (inCart >= maxQty) { toast.error("Stok tidak cukup", { description: "Jumlah di keranjang sudah mencapai batas." }); return; }
    const v = p.variants.find((x) => x.id === variantId);
    const unit = Number(v?.sellingPrice ?? p.sellingPrice);
    const clean = (itemNotes || "").trim() || undefined;
    const k = cartKey(p, variantId, clean);
    let added = 0, capped = false;
    setCart((prev) => {
      const current = prev.filter((l) => l.productId === p.id).reduce((s, l) => s + l.quantity, 0);
      if (current >= maxQty) { capped = true; return prev; }
      added = Math.min(qty, maxQty - current);
      const i = prev.findIndex((x) => x.key === k);
      if (i >= 0) { const n = [...prev]; n[i] = { ...n[i], quantity: n[i].quantity + added }; return n; }
      return [...prev, { key: k, productId: p.id, variantId: variantId || null, name: p.name, variantName: v?.name || null, quantity: added, unitPrice: unit, notes: clean }];
    });
    if (capped || added <= 0) toast.error("Stok tidak cukup");
    else if (added < qty) toast.success("Ditambahkan sesuai batas stok", { description: `${p.name} (${added})`, duration: 1800 });
    else toast.success("Ditambahkan ke keranjang", { description: p.name, duration: 1600 });
  }
  function setQty(k: string, q: number, maxQty = MAX_QTY) {
    const next = Math.min(maxQty, q);
    setCart((prev) => prev.flatMap((l) => l.key !== k ? [l] : next <= 0 ? [] : [{ ...l, quantity: next }]));
  }
  function quickDelta(p: Product, delta: number) {
    const maxQty = maxForProduct(p);
    const target = cart.find((l) => l.productId === p.id && !l.notes);
    if (!target && delta > 0) { addToCart(p, null, 1); return; }
    if (!target) return;
    const inCart = qtyForProduct(cart, p.id);
    if (delta > 0 && inCart >= maxQty) { toast.error("Stok tidak cukup"); return; }
    setQty(target.key, target.quantity + delta, maxQty);
  }

  const subtotal = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const count = cart.reduce((s, l) => s + l.quantity, 0);
  useEffect(() => {
    if (count > prevCount.current) { setCartPulse(true); const t = setTimeout(() => setCartPulse(false), 420); prevCount.current = count; return () => clearTimeout(t); }
    prevCount.current = count;
  }, [count]);

  const canCheckout = !!data?.catalog?.payment?.storefrontCheckoutEnabled;
  const biz = data?.catalog?.business ?? null;
  const resetFilters = () => { setSearch(""); setCategoryId("all"); setShowAvailableOnly(false); };

  async function submitCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!canCheckout) { toast.error("Pemesanan belum diaktifkan."); return; }
    if (!name.trim() || !phone.trim()) { toast.error("Nama dan nomor HP/WhatsApp wajib diisi."); return; }
    if (!cart.length) { toast.error("Keranjang kosong."); return; }
    setSubmitting(true);
    try {
      const res = await postJson<any>("/api/public/storefront/checkout", {
        idempotencyKey: idemKey(),
        items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity, notes: l.notes || undefined })),
        paymentMethod: "qris",
        orderType: "takeaway",
        notes: notes || undefined,
        guestName: name.trim(),
        guestPhone: phone.trim(),
      });
      sessionStorage.removeItem(CART_KEY); sessionStorage.removeItem(IDEM_KEY);
      toast.success("Pesanan dibuat", { description: "Lanjut ke pembayaran." });
      router.replace(`/menu/order/${encodeURIComponent(res.orderId)}/payment?paymentId=${encodeURIComponent(res.paymentId || res.orderId || "")}`);
    } catch (err: any) { toast.error("Checkout gagal", { description: err?.message || "Silakan coba lagi." }); }
    finally { setSubmitting(false); }
  }

  if (loading) {
    return (
      <>
        <MenuDesktopTopBar biz={null} user={user} />
        <div className="min-h-svh bg-background px-3 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-[max(0.75rem,env(safe-area-inset-top))] min-[400px]:px-4 sm:px-6">
          <div className="mx-auto max-w-6xl space-y-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <div className="flex gap-2 overflow-hidden">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />)}</div>
            <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="overflow-hidden rounded-2xl border border-border/60"><Skeleton className="aspect-[4/3] rounded-none" /><div className="space-y-2 p-3"><Skeleton className="h-3 w-16" /><Skeleton className="h-4 w-full" /><Skeleton className="h-8 w-24" /></div></div>)}</div>
          </div>
        </div>
      </>
    );
  }
  if (error || !data || !biz) {
    return (
      <>
        <MenuDesktopTopBar biz={null} user={user} />
        <div className="flex min-h-svh items-center justify-center bg-background px-6 pb-[calc(env(safe-area-inset-bottom)+6rem)]">
          <EmptyState icon={StoreIcon} title="Katalog tidak dapat dimuat" description={error || "Silakan muat ulang halaman."} action={<Button variant="outline" className="rounded-xl" onClick={() => window.location.reload()}>Muat ulang</Button>} className="max-w-md border-border/60 bg-card/50" />
        </div>
      </>
    );
  }

  const detailPrice = detail ? unitPrice(detail, dVariant) : 0;
  return (
    <>
      <MenuDesktopTopBar biz={biz} user={user} />
      <div className="min-h-svh bg-background pb-[calc(env(safe-area-inset-bottom)+11.5rem)] lg:pb-10">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 lg:top-[57px]">
          <div className="mx-auto max-w-6xl px-3 pt-[max(0.5rem,env(safe-area-inset-top))] min-[400px]:px-4 sm:px-6 lg:pt-2.5">
            <div className="flex items-center gap-2.5 pb-2.5 lg:hidden">
              <Link href="/menu" className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted/20 outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Menu ${biz.name}`}>
                {biz.logoUrl ? <img src={biz.logoUrl} alt={biz.name} className="size-full object-cover" /> : <span className="text-sm font-medium">{biz.name.slice(0, 1).toUpperCase()}</span>}
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[15px] font-semibold tracking-tight">{biz.name}</h1>
                <p className="truncate text-[12px] text-muted-foreground">Menu</p>
              </div>
              {user ? (
                <Link href="/profile" className="rounded-full" aria-label="Profil">
                  <Avatar>
                    {user.image ? <AvatarImage src={user.image} alt={user.name || "Profil"} /> : null}
                    <AvatarFallback>{initials(user.name || user.email)}</AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Button asChild variant="ghost" size="icon-sm" className="rounded-xl" aria-label="Masuk">
                  <Link href="/login"><UserCircle2Icon className="size-4" /></Link>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 pb-2.5">
              <div className="relative min-w-0 flex-1">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari menu..." className="h-10 rounded-xl border-border/60 bg-muted/15 pl-9 pr-9 shadow-none focus-visible:bg-background" aria-label="Cari produk" />
                {search ? <button type="button" onClick={() => setSearch("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Hapus pencarian"><XIcon className="size-4" aria-hidden /></button> : null}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" size="icon" aria-label={categoryId !== "all" ? `Filter kategori: ${categoryName(categoryId)}` : "Filter kategori"} title={categoryId !== "all" ? `Kategori: ${categoryName(categoryId)}` : "Kategori"} className={cn("relative size-10 shrink-0 rounded-xl border-border/60 bg-muted/10 shadow-none", categoryId !== "all" && "border-foreground/15 bg-foreground/[0.03] text-foreground dark:bg-white/[0.04]")}>
                    {categoryId !== "all" ? <FunnelPlusIcon className="size-4" aria-hidden /> : <FunnelIcon className="size-4" aria-hidden />}
                    {categoryId !== "all" ? <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-foreground dark:bg-white" aria-hidden /> : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" sideOffset={8} className="w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border-border/70 p-2 shadow-none">
                  <div className="flex items-center justify-between px-2 pb-1 pt-1">
                    <p className="text-[12px] font-medium text-muted-foreground">Kategori</p>
                    {categoryId !== "all" ? (
                      <button type="button" onClick={() => setCategoryId("all")} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <FunnelXIcon className="size-3.5" aria-hidden />Reset
                      </button>
                    ) : null}
                  </div>
                  <div className="max-h-64 space-y-0.5 overflow-y-auto overscroll-contain p-0.5">
                    <button type="button" onClick={() => setCategoryId("all")} className={cn("flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", categoryId === "all" ? "bg-foreground text-background dark:bg-white dark:text-black" : "hover:bg-muted/60")}>
                      <span>Semua</span>{categoryId === "all" ? <CheckIcon className="size-4" aria-hidden /> : null}
                    </button>
                    {categories.map((c) => {
                      const active = categoryId === c.id;
                      return (
                        <button key={c.id} type="button" onClick={() => setCategoryId(c.id)} className={cn("flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active ? "bg-foreground text-background dark:bg-white dark:text-black" : "hover:bg-muted/60")}>
                          <span className="min-w-0 truncate">{c.name}</span>{active ? <CheckIcon className="size-4 shrink-0" aria-hidden /> : null}
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
              <Button type="button" variant="outline" size="icon" aria-label={showAvailableOnly ? "Filter tersedia aktif" : "Tampilkan tersedia saja"} aria-pressed={showAvailableOnly} title={showAvailableOnly ? "Tersedia saja" : "Semua status"} onClick={() => setShowAvailableOnly((v) => !v)} className={cn("relative size-10 shrink-0 rounded-xl border-border/60 bg-muted/10 shadow-none", showAvailableOnly && "border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-300")}>
                <FunnelPlusIcon className="size-4" aria-hidden />
                {showAvailableOnly ? <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" aria-hidden /> : null}
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-3 pt-8 min-[400px]:px-4 sm:px-6 sm:pt-10">
          <div className="flex items-center justify-between gap-3 text-[12px] text-muted-foreground">
            <p><span className="font-medium text-foreground/80">{formatNumber(filtered.length)}</span> produk{categoryId !== "all" ? <span> · {categoryName(categoryId)}</span> : null}{showAvailableOnly ? <span> · tersedia</span> : null}</p>
            <p className="truncate text-right">Harga & stok diverifikasi saat checkout</p>
          </div>

          {filtered.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border/70 bg-card/40 px-4 py-12 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-background"><PackageIcon className="size-5 text-muted-foreground" aria-hidden /></div>
              <p className="mt-4 text-sm font-medium">Tidak ada produk yang cocok</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Coba kata kunci lain atau ubah filter kategori.</p>
              {(search || categoryId !== "all" || showAvailableOnly) ? <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={resetFilters}>Reset filter</Button> : null}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => (
                <StorefrontProductCard key={p.id} product={p} categoryName={categoryName(p.categoryId)} quantity={qtyForProduct(cart, p.id)} onOpen={() => openDetail(p)} onQuickAdd={() => addToCart(p, null, 1)} onIncrement={() => quickDelta(p, 1)} onDecrement={() => quickDelta(p, -1)} />
              ))}
            </div>
          )}
        </main>

        {count > 0 ? (
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+5.25rem)] min-[400px]:px-4 sm:px-6 lg:z-30 lg:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="pointer-events-auto mx-auto flex max-w-6xl items-center gap-2 rounded-[22px] border border-border/70 bg-background/92 p-2 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.28)]">
              <button type="button" onClick={() => setCartOpen(true)} className={cn("flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-2 py-1.5 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-ring hover:bg-muted/50", cartPulse && "motion-safe:scale-[0.995]")} aria-label={`Buka keranjang, ${count} item`}>
                <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background dark:bg-white dark:text-black">
                  <ShoppingBagIcon className="size-[18px]" aria-hidden />
                  <span className={cn("absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-background px-1 text-[10px] font-bold tabular-nums text-foreground ring-2 ring-foreground dark:bg-black dark:text-white dark:ring-white", cartPulse && "motion-safe:animate-pulse")} aria-hidden>{count}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{count} item di keranjang</span>
                  <span className="block truncate text-[12px] tabular-nums text-muted-foreground">{formatCurrency(subtotal)} estimasi</span>
                </span>
              </button>
              <Button className="h-11 shrink-0 rounded-2xl px-4 shadow-none" onClick={() => setCheckoutOpen(true)} disabled={!canCheckout}>
                Checkout <ArrowRightIcon className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        ) : null}

        <ResponsivePanel open={!!detail} onOpenChange={(o) => !o && setDetail(null)} title={detail?.name || "Produk"} description={detail ? `${categoryName(detail.categoryId)} · Sesuaikan pilihan sebelum menambah.` : undefined}
          footer={detail ? (() => { const inCart = qtyForProduct(cart, detail.id); const maxQty = maxForProduct(detail); const remaining = Math.max(0, maxQty - inCart); const atMax = remaining <= 0; const qty = Math.min(dQty, Math.max(1, remaining || 1)); return (
            <div className="flex w-full flex-col gap-3">
              {typeof detail.maxQuantity === "number" ? <p className="text-[12px] text-muted-foreground">Tersisa {formatNumber(detail.maxQuantity)} · {formatNumber(inCart)} di keranjang</p> : null}
              <div className="flex items-center justify-between gap-3">
                <QuantityStepper value={qty} onDecrease={() => setDQty((q) => Math.max(1, q - 1))} onIncrease={() => setDQty((q) => Math.min(remaining, q + 1))} max={Math.max(1, remaining)} size="default" disableIncrease={atMax || qty >= remaining} />
                <Button className="h-11 flex-1 rounded-2xl shadow-none sm:flex-none sm:min-w-52" disabled={!detail.available || atMax} onClick={() => { addToCart(detail, dVariant, qty, dNotes); setDetail(null); }}>
                  Tambah · {formatCurrency(detailPrice * qty)}
                </Button>
              </div>
            </div>
          ); })() : undefined}
        >
          {detail ? (
            <div className="space-y-4 pt-1">
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/20"><div className="aspect-[4/3]"><ProductVisual p={detail} /></div></div>
              <div>
                <p className="text-xl font-semibold tracking-tight tabular-nums">{formatCurrency(detailPrice)}</p>
                {detail.description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail.description}</p> : null}
              </div>
              {detail.variants?.length ? (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Pilih varian</legend>
                  <div className="grid gap-2 min-[380px]:grid-cols-2">
                    {detail.variants.map((v) => {
                      const active = dVariant === v.id;
                      return (
                        <button key={v.id} type="button" onClick={() => setDVariant(v.id)} aria-pressed={active} className={cn("flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active ? "border-foreground/15 bg-foreground/[0.03] dark:bg-white/[0.04]" : "border-border/70 bg-card hover:border-border")}>
                          <span className="min-w-0"><span className="block truncate text-sm font-medium">{v.name}</span>{v.sellingPrice != null ? <span className="block text-[12px] tabular-nums text-muted-foreground">{formatCurrency(Number(v.sellingPrice))}</span> : null}</span>
                          <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border", active ? "border-foreground bg-foreground text-background dark:border-white dark:bg-white dark:text-black" : "border-border/80")}>{active ? <CheckIcon className="size-3" aria-hidden /> : null}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null}
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="detail-notes">Catatan untuk item ini <span className="font-normal text-muted-foreground">(opsional)</span></label>
                <Textarea id="detail-notes" value={dNotes} onChange={(e) => setDNotes(e.target.value)} className="min-h-24 rounded-2xl border-border/70 bg-muted/15 shadow-none" maxLength={200} placeholder="Misalnya: tanpa sambal, es sedikit" />
                <p className="text-[12px] text-muted-foreground">Catatan berbeda akan dipisah sebagai item keranjang.</p>
              </div>
            </div>
          ) : null}
        </ResponsivePanel>

        <ResponsivePanel open={cartOpen} onOpenChange={setCartOpen} title="Keranjang" description={count ? `${formatNumber(count)} item · total estimasi ${formatCurrency(subtotal)}` : "Belum ada item dipilih."}
          footer={cart.length ? (
            <div className="w-full space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div><p className="text-[12px] text-muted-foreground">Subtotal estimasi</p><p className="text-lg font-semibold tracking-tight tabular-nums">{formatCurrency(subtotal)}</p></div>
                <p className="max-w-[12rem] text-right text-[11px] leading-4 text-muted-foreground">Pajak & total final dihitung server.</p>
              </div>
              {!canCheckout ? <p className="text-xs text-muted-foreground">Pemesanan belum diaktifkan.</p> : null}
              <Button className="h-11 w-full rounded-2xl shadow-none" disabled={!canCheckout} onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>
                Lanjut ke checkout <ChevronRightIcon className="size-4" aria-hidden />
              </Button>
            </div>
          ) : undefined}
        >
          {!cart.length ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-card/30 px-5 py-10 text-center">
              <ShoppingBagIcon className="mx-auto size-5 text-muted-foreground" aria-hidden />
              <p className="mt-3 text-sm font-medium">Keranjang masih kosong</p>
              <p className="mt-1 text-sm text-muted-foreground">Tambahkan menu dari katalog untuk mulai memesan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-end"><button type="button" className="rounded-lg px-2 py-1 text-[12px] text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setCart([])}>Kosongkan</button></div>
              {cart.map((l) => {
                const product = data?.catalog.products.find((p) => p.id === l.productId);
                const maxQty = product ? maxForProduct(product) : MAX_QTY;
                const inCart = cart.filter((x) => x.productId === l.productId).reduce((s, x) => s + x.quantity, 0);
                const atMax = !!product && typeof product.maxQuantity === "number" && inCart >= maxQty;
                return (
                  <div key={l.key} className="rounded-2xl border border-border/70 bg-card p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-5">{l.name}{l.variantName ? <span className="text-muted-foreground"> · {l.variantName}</span> : null}</p>
                        <p className="mt-0.5 text-[12px] tabular-nums text-muted-foreground">{formatCurrency(l.unitPrice)} / item{l.notes ? <span className="break-words"> · {l.notes}</span> : null}</p>
                        {atMax ? <p className="mt-1 text-[11px] text-muted-foreground">Batas stok tercapai</p> : null}
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums">{formatCurrency(l.unitPrice * l.quantity)}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <QuantityStepper value={l.quantity} onDecrease={() => setQty(l.key, l.quantity - 1)} onIncrease={() => { if (atMax) { toast.error("Stok tidak cukup"); return; } setQty(l.key, l.quantity + 1, maxQty - (inCart - l.quantity)); }} size="sm" max={maxQty} disableIncrease={atMax} />
                      <button type="button" className="rounded-xl px-2.5 py-2 text-[12px] text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setCart((prev) => prev.filter((x) => x.key !== l.key))}>Hapus</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ResponsivePanel>

        <ResponsivePanel open={checkoutOpen} onOpenChange={setCheckoutOpen} title="Checkout" description="Lengkapi data pemesan. Bayar via QRIS, bukti diverifikasi kasir.">
          <form onSubmit={submitCheckout} className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
              <p className="text-sm font-medium">Ringkasan</p>
              <div className="mt-3 space-y-2 text-sm">
                {cart.map((l) => (
                  <div key={l.key} className="flex items-start justify-between gap-3">
                    <span className="min-w-0 text-muted-foreground"><span className="font-medium text-foreground">{l.quantity}×</span> {l.name}{l.variantName ? ` · ${l.variantName}` : ""}</span>
                    <span className="shrink-0 font-medium tabular-nums">{formatCurrency(l.unitPrice * l.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-sm">
                <span className="font-medium">Subtotal estimasi</span>
                <span className="font-semibold tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Pajak dan total akhir dihitung server.</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5"><label className="text-sm font-medium" htmlFor="co-name">Nama penerima</label><Input id="co-name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-2xl border-border/70 bg-muted/10 shadow-none" required autoComplete="name" maxLength={80} placeholder="Nama Anda" /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium" htmlFor="co-phone">No. HP / WhatsApp</label><Input id="co-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 rounded-2xl border-border/70 bg-muted/10 shadow-none" required inputMode="tel" autoComplete="tel" maxLength={30} placeholder="08xxxxxxxxxx" /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium" htmlFor="co-notes">Catatan pesanan <span className="font-normal text-muted-foreground">(opsional)</span></label><Textarea id="co-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-24 rounded-2xl border-border/70 bg-muted/10 shadow-none" maxLength={500} placeholder="Contoh: tanpa sambal, ambil pukul 12.00" /></div>
            </div>
            <Button type="submit" className="h-11 w-full rounded-2xl shadow-none" disabled={submitting || !canCheckout || !cart.length}>
              {submitting ? <><Loader2Icon aria-hidden="true" className="size-4 animate-spin" />Memproses...</> : "Buat pesanan & bayar QRIS"}
            </Button>
          </form>
        </ResponsivePanel>
      </div>
    </>
  );
}
