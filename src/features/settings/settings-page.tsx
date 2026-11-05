"use client";

import { zodResolver } from '@hookform/resolvers/zod'
import { DownloadIcon, MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'

import { useTheme } from '@/components/themeprovider'
import { PageHeader } from '@/components/shared/page-header'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { initials } from '@/features/customers/customer-detail-sheet'
import { useRealUser } from '@/hooks/use-real-user'
import { appRoleLabel } from '@/lib/business-labels'
import { cn } from '@/lib/utils'
import { useBusinessStore } from '@/stores/business-store'
import type { BusinessSettings } from '@/types/business'

const settingsSchema = z.object({
  businessName: z.string().trim().min(1, 'Nama bisnis wajib diisi'),
  address: z.string().trim().min(1, 'Alamat wajib diisi'),
  phone: z.string().trim().min(8, 'Nomor telepon tidak valid'),
  email: z
    .string()
    .trim()
    .refine(
      (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      'Format email tidak valid',
    ),
  currency: z.enum(['IDR']),
  timezone: z.enum(['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura']),
  taxRate: z.number().min(0, 'Tidak boleh negatif').max(100, 'Maksimal 100%'),
  memberDiscountRate: z
    .number()
    .min(0, 'Tidak boleh negatif')
    .max(100, 'Maksimal 100%'),
  lowStockThreshold: z.number().int().min(0, 'Tidak boleh negatif'),
  receiptFooter: z.string().trim().max(120, 'Maksimal 120 karakter'),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

const toFormValues = (settings: BusinessSettings): SettingsFormValues => ({
  businessName: settings.businessName,
  address: settings.address,
  phone: settings.phone,
  email: settings.email,
  currency: 'IDR',
  timezone: settings.timezone as SettingsFormValues['timezone'],
  taxRate: Math.round(settings.taxRate * 100),
  memberDiscountRate: Math.round(settings.memberDiscountRate * 100),
  lowStockThreshold: settings.lowStockThreshold,
  receiptFooter: settings.receiptFooter,
})

const THEME_OPTIONS = [
  { value: 'light', label: 'Terang', icon: SunIcon },
  { value: 'dark', label: 'Gelap', icon: MoonIcon },
  { value: 'system', label: 'Sistem', icon: MonitorIcon },
] as const

export function SettingsPage() {
  const { settings, updateSettings } = useBusinessStore()
  const { theme, setTheme } = useTheme()
  const realUser = useRealUser(true)
  const currentUser = {
    name: realUser?.name ?? 'Akun terdaftar',
    email: realUser?.email ?? '',
    role: appRoleLabel(realUser?.role),
  }

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: toFormValues(settings),
  })

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
    })
    toast.success('Pengaturan disimpan', {
      description: 'Perubahan langsung dipakai di POS dan struk.',
    })
  }

  const handleExportData = () => {
    const state = useBusinessStore.getState()
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
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `warjok-data-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)

    toast.success('Data diekspor', {
      description: 'File JSON berisi data bisnis dari database.',
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Pengaturan"
        description="Atur profil bisnis, pajak, tampilan, dan data aplikasi."
        actions={
          <Button type="submit" form="settings-form">
            Simpan perubahan
          </Button>
        }
      />

      <Form {...form}>
        <form
          id="settings-form"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"
        >
          <div className="flex flex-col gap-5">
            <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h2 className="text-sm font-semibold">Profil bisnis</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Dipakai di struk, laporan, dan halaman POS.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Nama bisnis</FormLabel>
                      <FormControl>
                        <Input placeholder="Warjok Coffee & Bakery" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="hello@warjok.id" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telepon</FormLabel>
                      <FormControl>
                        <Input placeholder="+62 812 3456 7890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Alamat</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="Alamat lengkap" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h2 className="text-sm font-semibold">Operasional</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Nilai ini dipakai saat menghitung total dan memantau stok.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pajak (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          inputMode="decimal"
                          value={field.value}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === ''
                                ? 0
                                : Number(event.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Diterapkan pada subtotal setelah diskon.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="memberDiscountRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diskon pelanggan (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          inputMode="decimal"
                          value={field.value}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === ''
                                ? 0
                                : Number(event.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Diskon default untuk pelanggan terdaftar.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ambang stok menipis</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          inputMode="numeric"
                          value={field.value}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === ''
                                ? 0
                                : Math.floor(Number(event.target.value)),
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Dipakai sebagai nilai awal stok minimum produk baru.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mata uang</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="IDR">IDR · Rupiah</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Multi-mata uang belum didukung.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Zona waktu</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Asia/Jakarta">
                            WIB · Asia/Jakarta
                          </SelectItem>
                          <SelectItem value="Asia/Makassar">
                            WITA · Asia/Makassar
                          </SelectItem>
                          <SelectItem value="Asia/Jayapura">
                            WIT · Asia/Jayapura
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h2 className="text-sm font-semibold">Struk</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Teks penutup yang dicetak di bagian bawah struk pelanggan.
              </p>

              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="receiptFooter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pesan penutup</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={2}
                          placeholder="Terima kasih telah berkunjung"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-5">
            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">Tampilan</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Pilihan tema disimpan di perangkat ini.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map((option) => {
                  const Icon = option.icon
                  const active = theme === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setTheme(option.value)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors',
                        active
                          ? 'border-primary/50 bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">Akun</h2>
              <div className="mt-3 flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback className="text-xs font-semibold">
                    {initials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {currentUser.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {currentUser.role} · {currentUser.email}
                  </p>
                </div>
                <Badge variant="success" className="ml-auto">
                  Aktif
                </Badge>
              </div>
              <p className="mt-3 rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
                Sesi ini terhubung ke database Warjok. Perubahan tersimpan di server.
              </p>
            </section>

            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">Data & sistem</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Data bisnis tersimpan di database dan tersinkron dengan server.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="justify-start"
                  onClick={handleExportData}
                >
                  <DownloadIcon aria-hidden="true" />
                  Ekspor data (JSON)
                </Button>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Warjok POS · data real · penyimpanan Neon Postgres
              </p>
            </section>
          </div>
        </form>
      </Form>
    </div>
  )
}
