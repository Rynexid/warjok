"use client"

import {
  BookOpenIcon,
  BoxesIcon,
  ChevronDownIcon,
  CommandIcon,
  CreditCardIcon,
  HelpCircleIcon,
  KeyboardIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ReceiptTextIcon,
  ShoppingBagIcon,
  SparklesIcon,
} from 'lucide-react'

import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { useBusinessStore } from '@/stores/business-store'

const GUIDE_SECTIONS = [
  {
    icon: ShoppingBagIcon,
    title: 'Memulai penjualan',
    steps: [
      'Buka POS dari menu Sales, lalu pilih produk. Stok habis otomatis tidak bisa dijual.',
      'Atur tipe pesanan (Dine in / Takeaway). Untuk dine in, isi nomor bangku.',
      'Opsional: pilih pelanggan lewat tombol Ubah di panel pesanan.',
      'Tekan Bayar Sekarang atau F12, pilih metode pembayaran, lalu selesaikan.',
    ],
  },
  {
    icon: BoxesIcon,
    title: 'Produk & inventori',
    steps: [
      'Tambahkan kategori lebih dulu di Catalog → Kategori.',
      'Buat produk di Catalog → Produk. SKU harus unik dan harga jual lebih dari 0.',
      'Gunakan Inventori → Sesuaikan stok untuk mencatat stok masuk, keluar, atau hasil hitung.',
      'Setiap penjualan dan pembatalan otomatis mencatat pergerakan stok.',
    ],
  },
  {
    icon: ReceiptTextIcon,
    title: 'Transaksi & laporan',
    steps: [
      'Semua pembayaran muncul di Sales → Transaksi beserta status dan rincian item.',
      'Buka detail transaksi untuk mencetak ulang struk 80mm.',
      'Pembatalan mengembalikan stok dan menyimpan alasan pembatalan.',
      'Laporan bisa difilter 7/30/90 hari, diekspor ke CSV, atau dicetak sebagai PDF.',
    ],
  },
  {
    icon: CreditCardIcon,
    title: 'Pembayaran',
    steps: [
      'Tunai: masukkan nominal, gunakan tombol uang pas, dan lihat kembalian.',
      'QRIS: QR EMVCo dibuat dari nominal transaksi dan bisa dicetak di kertas 80mm.',
      'EDC: simulasi pembayaran kartu untuk alur POS.',
    ],
  },
] as const

const FAQS = [
  {
    question: 'Apakah data ini tersimpan permanen?',
    answer:
      'Data real disimpan di database Neon dan tersinkron dengan server. Setiap perubahan langsung tercatat.',
  },
  {
    question: 'Kenapa produk tidak muncul di POS?',
    answer:
      'Periksa status produk (harus Aktif), kategori, dan stok. Produk dengan stok 0 tetap tampil tetapi tidak bisa ditambahkan. Produk yang diarsipkan disembunyikan dari katalog POS.',
  },
  {
    question: 'Bagaimana cara membatalkan transaksi?',
    answer:
      'Buka Transaksi, pilih transaksi berstatus Selesai, lalu tekan Batalkan. Stok otomatis dikembalikan dan alasan pembatalan tersimpan pada transaksi.',
  },
  {
    question: 'Apakah login dan hak akses sudah aktif?',
    answer:
      'Ya. Login memakai Neon Auth dan data bisnis hanya bisa diakses oleh sesi yang terautentikasi.',
  },
  {
    question: 'Kenapa struk tidak tercetak?',
    answer:
      'Cetak membuka jendela baru. Jika browser memblokir popup, izinkan popup untuk situs ini lalu coba lagi.',
  },
] as const

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], description: 'Fokus ke pencarian' },
  { keys: ['F12'], description: 'Buka pembayaran di POS' },
  { keys: ['Esc'], description: 'Tutup dialog atau panel' },
] as const

export function HelpPage() {
  const settings = useBusinessStore((state) => state.settings)

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Bantuan"
        description="Panduan singkat untuk menjalankan operasional harian di Warjok."
        badge={
          <Badge variant="outline">
            Data real
          </Badge>
        }
      />

      <section className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <SparklesIcon aria-hidden="true" className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Semua modul saling terhubung</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Penjualan di POS langsung memperbarui stok, transaksi, pelanggan,
              dan laporan. Tidak ada data terpisah.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-5">
          <section className="grid gap-4 md:grid-cols-2">
            {GUIDE_SECTIONS.map((section) => {
              const Icon = section.icon
              return (
                <div
                  key={section.title}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-primary">
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <h2 className="text-sm font-semibold">{section.title}</h2>
                  </div>
                  <ol className="mt-3 flex list-decimal flex-col gap-2 pl-4 text-sm text-muted-foreground marker:text-xs marker:font-semibold">
                    {section.steps.map((step) => (
                      <li key={step} className="pl-1 leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )
            })}
          </section>

          <section className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border p-4">
              <HelpCircleIcon aria-hidden="true" className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Pertanyaan umum</h2>
            </div>
            <div className="divide-y divide-border">
              {FAQS.map((faq) => (
                <details key={faq.question} className="group px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
                    {faq.question}
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <KeyboardIcon aria-hidden="true" className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Pintasan keyboard</h2>
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {SHORTCUTS.map((shortcut) => (
                <li
                  key={shortcut.description}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-muted-foreground">
                    {shortcut.description}
                  </span>
                  <span className="flex items-center gap-1">
                    {shortcut.keys.map((key) => (
                      <kbd
                        key={key}
                        className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold"
                      >
                        {key}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CommandIcon aria-hidden="true" className="size-3" />
              Di macOS, gunakan ⌘ sebagai pengganti Ctrl.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <BookOpenIcon aria-hidden="true" className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Hubungi kami</h2>
            </div>
            <ul className="mt-3 flex flex-col gap-3 text-sm">
              <li className="flex items-start gap-2">
                <MailIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />
                <span className="break-all">{settings.email}</span>
              </li>
              <li className="flex items-start gap-2">
                <PhoneIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />
                <span>{settings.phone}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPinIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />
                <span className="text-muted-foreground">{settings.address}</span>
              </li>
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-muted/30 p-4">
            <h2 className="text-sm font-semibold">Catatan data real</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Transaksi tercatat di database, tetapi pembayaran masih berupa pencatatan manual. Belum ada payment gateway nyata yang terhubung.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
