"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { DownloadIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useTheme } from "@/components/themeprovider";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ReceiptPreview } from "@/components/pos/receipt-preview";
import { formatCurrency } from "@/lib/format";
import { initials } from "@/features/customers/customer-detail-sheet";
import { useRealUser } from "@/hooks/use-real-user";
import { appRoleLabel } from "@/lib/business-labels";
import { cn } from "@/lib/utils";
import { useBusinessStore } from "@/stores/business-store";
import type { BusinessSettings } from "@/types/business";

const settingsSchema = z.object({
  businessName: z.string().trim().min(1, "Nama bisnis wajib diisi"),
  address: z.string().trim().min(1, "Alamat wajib diisi"),
  phone: z.string().trim().min(8, "Nomor telepon tidak valid"),
  email: z
    .string()
    .trim()
    .refine(
      (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "Format email tidak valid",
    ),
  currency: z.enum(["IDR"]),
  timezone: z.enum(["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"]),
  taxRate: z.number().min(0, "Tidak boleh negatif").max(100, "Maksimal 100%"),
  memberDiscountRate: z
    .number()
    .min(0, "Tidak boleh negatif")
    .max(100, "Maksimal 100%"),
  lowStockThreshold: z.number().int().min(0, "Tidak boleh negatif"),
  receiptFooter: z.string().trim().max(120, "Maksimal 120 karakter"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const toFormValues = (settings: BusinessSettings): SettingsFormValues => ({
  businessName: settings.businessName,
  address: settings.address,
  phone: settings.phone,
  email: settings.email,
  currency: "IDR",
  timezone: settings.timezone as SettingsFormValues["timezone"],
  taxRate: Math.round(settings.taxRate * 100),
  memberDiscountRate: Math.round(settings.memberDiscountRate * 100),
  lowStockThreshold: settings.lowStockThreshold,
  receiptFooter: settings.receiptFooter,
});

const THEME_OPTIONS = [
  { value: "light", label: "Terang", icon: SunIcon },
  { value: "dark", label: "Gelap", icon: MoonIcon },
  { value: "system", label: "Sistem", icon: MonitorIcon },
] as const;

export function SettingsPage() {
  const { settings, updateSettings } = useBusinessStore();
  const { theme, setTheme } = useTheme();
  const realUser = useRealUser(true);
  const currentUser = {
    name: realUser?.name ?? "Akun terdaftar",
    email: realUser?.email ?? "-",
    role: appRoleLabel(realUser?.role),
  };

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: toFormValues(settings),
  });

  const handleSubmit = (values: SettingsFormValues) => {
    updateSettings({
      businessName: values.businessName.trim(),
      address: values.address.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      currency: values.currency,
      timezone: values.timezone,
      taxRate: values.taxRate / 100,
      memberDiscountRate: values.memberDiscountRate / 100,
      lowStockThreshold: values.lowStockThreshold,
      receiptFooter: values.receiptFooter.trim(),
    });
    toast.success("Pengaturan disimpan", {
      description: "Perubahan diterapkan ke POS, struk, dan perhitungan.",
    });
  };

  const handleExportData = () => {
    const state = useBusinessStore.getState();
    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      products: state.products,
      categories: state.categories,
      customers: state.customers,
      staff: state.staff,
      transactions: state.transactions,
      movements: state.movements,
      settings: state.settings,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `warjok-data-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);

    toast.success("Data diekspor", {
      description: "File JSON berisi snapshot data bisnis.",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pengaturan"
        description="Kelola profil bisnis, operasional, tampilan, dan data aplikasi."
        actions={
          <Button type="submit" form="settings-form" className="sm:min-w-40">
            Simpan perubahan
          </Button>
        }
      />

      <Form {...form}>
        <form id="settings-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs defaultValue="profil" className="w-full">
            <div className="-mx-1 overflow-x-auto px-1 pb-1">
              <TabsList className="h-auto w-max min-w-full justify-start gap-1 rounded-2xl bg-muted/60 p-1 sm:w-full sm:justify-center">
                <TabsTrigger value="profil" className="rounded-xl px-4 py-2">Profil</TabsTrigger>
                <TabsTrigger value="operasional" className="rounded-xl px-4 py-2">Operasional</TabsTrigger>
                <TabsTrigger value="struk" className="rounded-xl px-4 py-2">Struk</TabsTrigger>
                <TabsTrigger value="preferensi" className="rounded-xl px-4 py-2">Preferensi</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="profil" className="mt-4 space-y-4">
              <Card className="rounded-2xl border-border/70">
                <CardHeader className="border-b">
                  <CardTitle>Profil bisnis</CardTitle>
                  <CardDescription>Informasi ini ditampilkan pada struk, laporan, dan halaman POS. Semua kolom dapat diedit manual.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 pt-5 sm:grid-cols-2">
                  <FormField control={form.control} name="businessName" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Nama bisnis</FormLabel>
                      <FormControl><Input placeholder="Warjok Coffee & Bakery" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" placeholder="hello@warjok.id" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telepon</FormLabel>
                      <FormControl><Input placeholder="+62 812 3456 7890" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Alamat</FormLabel>
                      <FormControl><Textarea rows={4} placeholder="Alamat lengkap bisnis" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="operasional" className="mt-4 space-y-4">
              <Card className="rounded-2xl border-border/70">
                <CardHeader className="border-b">
                  <CardTitle>Operasional & pajak</CardTitle>
                  <CardDescription>Atur perhitungan transaksi, diskon, zona waktu, dan ambang stok secara manual.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 pt-5 sm:grid-cols-2">
                  <FormField control={form.control} name="taxRate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pajak (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={100} step={0.5} inputMode="decimal" value={field.value}
                          onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))} />
                      </FormControl>
                      <FormDescription>Diterapkan pada subtotal setelah diskon.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="memberDiscountRate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diskon pelanggan (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={100} step={0.5} inputMode="decimal" value={field.value}
                          onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))} />
                      </FormControl>
                      <FormDescription>Diskon default untuk pelanggan terdaftar.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lowStockThreshold" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ambang stok menipis</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={1} inputMode="numeric" value={field.value}
                          onChange={(e) => field.onChange(e.target.value === "" ? 0 : Math.floor(Number(e.target.value)))} />
                      </FormControl>
                      <FormDescription>Nilai awal batas minimum untuk produk baru.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mata uang</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="IDR">IDR · Rupiah</SelectItem></SelectContent>
                      </Select>
                      <FormDescription>Multi-mata uang belum didukung.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="timezone" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Zona waktu</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Asia/Jakarta">WIB · Asia/Jakarta</SelectItem>
                          <SelectItem value="Asia/Makassar">WITA · Asia/Makassar</SelectItem>
                          <SelectItem value="Asia/Jayapura">WIT · Asia/Jayapura</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="struk" className="mt-4 space-y-4">
              <Card className="rounded-2xl border-border/70">
                <CardHeader className="border-b">
                  <CardTitle>Struk</CardTitle>
                  <CardDescription>Teks penutup yang dicetak di bagian bawah struk pelanggan (dapat diedit manual).</CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
                  <FormField control={form.control} name="receiptFooter" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pesan penutup</FormLabel>
                      <FormControl><Textarea rows={4} placeholder="Terima kasih telah berkunjung" {...field} /></FormControl>
                      <FormDescription>Maksimal 120 karakter.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/70">
                <CardHeader className="border-b">
                  <CardTitle>Preview struk</CardTitle>
                  <CardDescription>Tampilan contoh struk berdasarkan pengaturan bisnis saat ini.</CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="flex items-end justify-between gap-4 md:flex-col md:gap-4">
                    <div className="flex-1 min-w-[320px]">
                      <ReceiptPreview
                        transactionId="TRX-1001"
                        date={new Date().toISOString()}
                        items={[
                          { id: "1", name: "Kopi Hitam", quantity: 2, unitPrice: 18000 },
                          { id: "2", name: "Roti Bakar", quantity: 1, unitPrice: 15000 },
                        ]}
                        subtotal={51000}
                        total={settings.taxRate > 0 ? Math.round(51000 * (1 + settings.taxRate)) : 51000}
                        discount={0}
                        tax={settings.taxRate > 0 ? Math.round(51000 * settings.taxRate) : 0}
                        currency={settings.currency}
                        storeName={settings.businessName}
                        storeAddress={settings.address}
                        cashier="Kasir 1"
                        paymentMethod="Tunai"
                        footer={settings.receiptFooter || "Terima kasih telah berkunjung"}
                        labels={{
                          receipt: "Struk",
                          date: "Tanggal",
                          cashier: "Kasir",
                          subtotal: "Subtotal",
                          discount: "Diskon",
                          tax: "Pajak",
                          total: "Total",
                          paidWith: "Dibayar dengan",
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-[320px] text-xs text-muted-foreground leading-relaxed">
                      <p>Contoh tampilan struk yang akan dicetak saat transaksi selesai. Nama bisnis, alamat, dan pesan penutup diambil dari pengaturan di atas.</p>
                      <p className="mt-2">Pajak dan diskon dihitung otomatis berdasarkan tarif operasional yang telah diatur.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferensi" className="mt-4 space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="rounded-2xl border-border/70">
                  <CardHeader className="border-b">
                    <CardTitle>Tampilan</CardTitle>
                    <CardDescription>Pilih tema aplikasi pada perangkat ini.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <div className="grid grid-cols-3 gap-2">
                      {THEME_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const active = theme === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setTheme(option.value)}
                            className={cn(
                              "flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              active
                                ? "border-primary/40 bg-primary/5 text-foreground shadow-sm"
                                : "border-border bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                            )}
                          >
                            <Icon aria-hidden="true" className="size-4" />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/70">
                  <CardHeader className="border-b">
                    <CardTitle>Akun</CardTitle>
                    <CardDescription>Informasi sesi dan profil pengguna saat ini.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-5">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-11">
                        <AvatarFallback className="text-sm font-semibold">{initials(currentUser.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{currentUser.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{currentUser.email}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">{currentUser.role}</Badge>
                    </div>
                    <Separator />
                    <div className="rounded-xl bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                      Perubahan pengaturan bisnis disimpan ke server (database). Preferensi tema disimpan lokal di perangkat.
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/70 lg:col-span-2">
                  <CardHeader className="border-b">
                    <CardTitle>Data & sistem</CardTitle>
                    <CardDescription>Ekspor snapshot data bisnis untuk cadangan.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-relaxed text-muted-foreground sm:max-w-md">
                      Warjok POS · data tersinkron dengan Neon Postgres. Pastikan koneksi aktif saat menyimpan perubahan.
                    </p>
                    <Button type="button" variant="outline" className="w-full justify-center sm:w-auto" onClick={handleExportData}>
                      <DownloadIcon aria-hidden="true" className="mr-2 size-4" />
                      Ekspor data (JSON)
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}
