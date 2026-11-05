"use client";

import { useMemo, useState } from 'react'
import {
  addDays,
  differenceInCalendarDays,
  format,
  subDays,
} from 'date-fns'
import {
  BanknoteIcon,
  DownloadIcon,
  PackageIcon,
  PrinterIcon,
  ReceiptTextIcon,
  TrendingUpIcon,
  WalletIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { DateRangeFilter } from '@/components/shared/date-range-filter'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { StatTile } from '@/components/shared/stat-tile'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { PAYMENT_METHOD_LABELS } from '@/lib/business-labels'
import {
  getCategoryPerformance,
  getLowStockProducts,
  getPaymentBreakdown,
  getTopProducts,
  isCompleted,
  summarizeTransactions,
} from '@/lib/business-selectors'
import { formatCurrency, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useBusinessStore } from '@/stores/business-store'
import type { Product, Transaction } from '@/types/business'
import type { RevenuePoint } from '@/types/dashboard'
import {
  downloadTransactionsCsv,
  printReport,
} from './lib/report-export'

const PRESETS = [
  { days: 7, label: '7 hari' },
  { days: 30, label: '30 hari' },
  { days: 90, label: '90 hari' },
] as const

const today = new Date()

function buildSeries(
  transactions: readonly Transaction[],
  from: string,
  to: string,
): RevenuePoint[] {
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return []
  }

  const dayCount = differenceInCalendarDays(end, start) + 1
  const bucketSize = Math.max(1, Math.ceil(dayCount / 60))
  const points: RevenuePoint[] = []

  for (let offset = 0; offset < dayCount; offset += bucketSize) {
    const bucketStart = addDays(start, offset)
    const bucketEnd = addDays(start, Math.min(offset + bucketSize - 1, dayCount - 1))
    const bucketFrom = bucketStart.getTime()
    const bucketTo = new Date(bucketEnd).setHours(23, 59, 59, 999)

    const revenue = transactions
      .filter((transaction) => {
        if (!isCompleted(transaction)) return false
        const time = new Date(transaction.createdAt).getTime()
        return time >= bucketFrom && time <= bucketTo
      })
      .reduce((total, transaction) => total + transaction.total, 0)

    points.push({
      name:
        bucketSize === 1
          ? format(bucketStart, 'dd MMM')
          : `${format(bucketStart, 'dd MMM')}–${format(bucketEnd, 'dd MMM')}`,
      revenue,
    })
  }

  return points
}

export function ReportsPage() {
  const { transactions, products, categories, settings } = useBusinessStore()

  const [preset, setPreset] = useState<number | null>(30)
  const [from, setFrom] = useState(format(subDays(today, 30), 'yyyy-MM-dd'))
  const [to, setTo] = useState(format(today, 'yyyy-MM-dd'))

  const rangeTransactions = useMemo(() => {
    const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity
    const toTime = to ? new Date(`${to}T23:59:59`).getTime() : Infinity
    return transactions.filter((transaction) => {
      const time = new Date(transaction.createdAt).getTime()
      return time >= fromTime && time <= toTime
    })
  }, [transactions, from, to])

  const summary = useMemo(
    () => summarizeTransactions(rangeTransactions),
    [rangeTransactions],
  )
  const series = useMemo(
    () => buildSeries(rangeTransactions, from, to),
    [rangeTransactions, from, to],
  )
  const payments = useMemo(
    () => getPaymentBreakdown(rangeTransactions),
    [rangeTransactions],
  )
  const topProducts = useMemo(
    () => getTopProducts(rangeTransactions, products, categories, 6),
    [rangeTransactions, products, categories],
  )
  const categoryPerformance = useMemo(
    () => getCategoryPerformance(rangeTransactions, products, categories),
    [rangeTransactions, products, categories],
  )
  const lowStock = useMemo(() => getLowStockProducts(products), [products])

  const applyPreset = (days: number) => {
    setPreset(days)
    setFrom(format(subDays(today, days), 'yyyy-MM-dd'))
    setTo(format(today, 'yyyy-MM-dd'))
  }

  const handleExport = () => {
    downloadTransactionsCsv(
      rangeTransactions,
      `warjok-laporan-${from}-${to}.csv`,
    )
    toast.success('Laporan diekspor', {
      description: `${formatNumber(rangeTransactions.length)} transaksi · CSV`,
    })
  }

  const handlePrint = () => {
    const ok = printReport({
      storeName: settings.businessName,
      from,
      to,
      revenue: summary.revenue,
      transactionCount: summary.count,
      itemsSold: summary.itemsSold,
      average: summary.average,
      payments,
      topProducts: topProducts.map((product) => ({
        name: product.name,
        unitsSold: product.unitsSold,
        revenue: product.revenue,
      })),
      categories: categoryPerformance.map((category) => ({
        name: category.name,
        productCount: category.productCount,
        units: category.units,
        revenue: category.revenue,
      })),
      lowStock: lowStock.map((product) => ({
        name: product.name,
        sku: product.sku,
        stock: product.stock,
        minStock: product.minStock,
        unit: product.unit,
      })),
    })

    if (!ok) {
      toast.error('Popup diblokir', {
        description: 'Izinkan popup untuk mencetak laporan.',
      })
    }
  }

  const topProductColumns: DataTableColumn<(typeof topProducts)[number]>[] = [
    {
      key: 'name',
      header: 'Produk',
      cell: (product) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{product.name}</p>
          <p className="truncate font-mono text-[11px] text-muted-foreground">
            {product.sku}
          </p>
        </div>
      ),
    },
    {
      key: 'units',
      header: 'Terjual',
      className: 'text-right tabular-nums',
      headerClassName: 'text-right',
      cell: (product) => formatNumber(product.unitsSold),
    },
    {
      key: 'revenue',
      header: 'Pendapatan',
      className: 'text-right font-medium tabular-nums',
      headerClassName: 'text-right',
      cell: (product) => formatCurrency(product.revenue),
    },
  ]

  const categoryColumns: DataTableColumn<
    (typeof categoryPerformance)[number]
  >[] = [
    {
      key: 'name',
      header: 'Kategori',
      cell: (category) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{category.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {formatNumber(category.productCount)} produk
          </p>
        </div>
      ),
    },
    {
      key: 'units',
      header: 'Terjual',
      className: 'text-right tabular-nums',
      headerClassName: 'text-right',
      cell: (category) => formatNumber(category.units),
    },
    {
      key: 'revenue',
      header: 'Pendapatan',
      className: 'text-right font-medium tabular-nums',
      headerClassName: 'text-right',
      cell: (category) => formatCurrency(category.revenue),
    },
  ]

  const lowStockColumns: DataTableColumn<Product>[] = [
    {
      key: 'name',
      header: 'Produk',
      cell: (product) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{product.name}</p>
          <p className="truncate font-mono text-[11px] text-muted-foreground">
            {product.sku}
          </p>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stok',
      className: 'text-right tabular-nums',
      headerClassName: 'text-right',
      cell: (product) =>
        `${formatNumber(product.stock)} ${product.unit}`,
    },
    {
      key: 'min',
      header: 'Minimum',
      className: 'text-right tabular-nums',
      headerClassName: 'text-right',
      cell: (product) => formatNumber(product.minStock),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Laporan"
        description="Analisis penjualan, performa produk, dan kondisi stok dalam satu tempat."
        actions={
          <>
            <Button variant="outline" onClick={handlePrint}>
              <PrinterIcon aria-hidden="true" />
              Cetak / PDF
            </Button>
            <Button onClick={handleExport}>
              <DownloadIcon aria-hidden="true" />
              Ekspor CSV
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div
          role="group"
          aria-label="Rentang laporan"
          className="inline-flex w-fit rounded-lg border border-border bg-muted p-0.5"
        >
          {PRESETS.map((option) => (
            <button
              key={option.days}
              type="button"
              aria-pressed={preset === option.days}
              onClick={() => applyPreset(option.days)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                preset === option.days
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <DateRangeFilter
          from={from}
          to={to}
          onFromChange={(value) => {
            setFrom(value)
            setPreset(null)
          }}
          onToChange={(value) => {
            setTo(value)
            setPreset(null)
          }}
          className="sm:ml-auto"
        />
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Pendapatan"
          value={formatCurrency(summary.revenue)}
          hint="Transaksi selesai"
          icon={TrendingUpIcon}
          tone="success"
        />
        <StatTile
          label="Transaksi"
          value={formatNumber(summary.count)}
          hint={`${formatNumber(rangeTransactions.length)} total termasuk void`}
          icon={ReceiptTextIcon}
        />
        <StatTile
          label="Item terjual"
          value={formatNumber(summary.itemsSold)}
          hint="Semua produk"
          icon={PackageIcon}
          tone="info"
        />
        <StatTile
          label="Rata-rata transaksi"
          value={formatCurrency(summary.average)}
          hint="Nilai keranjang"
          icon={WalletIcon}
          tone="warning"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <RevenueChart
          data={series}
          title="Tren pendapatan"
          subtitle={`${format(new Date(`${from}T00:00:00`), 'dd MMM yyyy')} – ${format(new Date(`${to}T00:00:00`), 'dd MMM yyyy')}`}
          className="xl:col-span-2"
        />

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Metode pembayaran</h2>
          <p className="text-xs text-muted-foreground">
            Distribusi nominal transaksi selesai
          </p>
          <div className="mt-4 flex flex-col gap-4">
            {payments.map((payment) => (
              <div key={payment.method}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <BanknoteIcon
                      aria-hidden="true"
                      className="size-4 text-muted-foreground"
                    />
                    {PAYMENT_METHOD_LABELS[payment.method]}
                  </span>
                  <span className="tabular-nums">{payment.share}%</span>
                </div>
                <Progress value={payment.share} className="mt-1.5 h-1.5" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatNumber(payment.count)} transaksi ·{' '}
                  {formatCurrency(payment.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="text-sm font-semibold">Produk terlaris</h2>
            <p className="text-xs text-muted-foreground">
              Berdasarkan pendapatan pada periode ini
            </p>
          </div>
          <DataTable
            columns={topProductColumns}
            rows={topProducts}
            getRowKey={(product) => product.id}
            empty={
              <EmptyState
                icon={PackageIcon}
                title="Belum ada penjualan"
                description="Pilih rentang tanggal lain atau proses transaksi di POS."
              />
            }
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="text-sm font-semibold">Performa kategori</h2>
            <p className="text-xs text-muted-foreground">
              Kontribusi tiap kategori terhadap pendapatan
            </p>
          </div>
          <DataTable
            columns={categoryColumns}
            rows={categoryPerformance}
            getRowKey={(category) => category.id}
            empty={
              <EmptyState
                icon={PackageIcon}
                title="Belum ada data kategori"
                description="Tambahkan kategori dan produk untuk melihat performanya."
              />
            }
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold">Stok menipis</h2>
          <p className="text-xs text-muted-foreground">
            Produk yang perlu segera diisi ulang
          </p>
        </div>
        <DataTable
          columns={lowStockColumns}
          rows={lowStock}
          getRowKey={(product) => product.id}
          empty={
            <EmptyState
              icon={PackageIcon}
              title="Semua stok aman"
              description="Tidak ada produk yang menyentuh batas minimum."
            />
          }
        />
      </section>
    </div>
  )
}
