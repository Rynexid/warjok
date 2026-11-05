import Image from "next/image"
import Link from "next/link"

import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Logo } from "@/components/ui/logo"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex min-h-svh flex-col p-6 md:p-10">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Kembali ke beranda Warjok"
          >
            <Logo size="sm" />
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </main>

        <footer className="text-center text-xs leading-relaxed text-muted-foreground">
          Warjok POS oleh Rynex.
        </footer>
      </div>

      <div className="relative hidden overflow-hidden border-l border-border bg-muted lg:block">
        <Image
          src="/logincover.png"
          alt="Ilustrasi Warjok POS"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-white/70">
            Warjok POS
          </p>
          <p className="mt-2 max-w-sm text-2xl leading-tight font-semibold tracking-tight">
            Kasir, stok, dan laporan dalam satu alur.
          </p>
          <p className="mt-2 max-w-sm text-sm text-white/70">
            Terminal penjualan, inventori, pelanggan, dan laporan tanpa
            berpindah aplikasi.
          </p>
        </div>
      </div>
    </div>
  )
}
