import { format } from 'date-fns'

import {
  PAYMENT_METHOD_LABELS,
  TRANSACTION_STATUS_LABELS,
} from '@/lib/business-labels'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Transaction } from '@/types/business'

const escapeCsv = (value: string | number) => {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Download the filtered transactions as an Excel-friendly CSV file. */
export function downloadTransactionsCsv(
  transactions: readonly Transaction[],
  filename: string,
) {
  const header = [
    'Nomor',
    'Waktu',
    'Kasir',
    'Pelanggan',
    'Tipe',
    'Bangku',
    'Item',
    'Subtotal',
    'Diskon',
    'Pajak',
    'Total',
    'Pembayaran',
    'Status',
  ]

  const rows = transactions.map((transaction) => [
    transaction.number,
    format(new Date(transaction.createdAt), 'yyyy-MM-dd HH:mm'),
    transaction.cashier,
    transaction.customerName,
    transaction.orderType,
    transaction.tableNumber ?? '',
    transaction.items.reduce((total, item) => total + item.quantity, 0),
    transaction.subtotal,
    transaction.discount,
    transaction.tax,
    transaction.total,
    PAYMENT_METHOD_LABELS[transaction.paymentMethod],
    TRANSACTION_STATUS_LABELS[transaction.status],
  ])

  const csv = [header, ...rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\r\n')

  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export type ReportPrintData = {
  storeName: string
  from: string
  to: string
  revenue: number
  transactionCount: number
  itemsSold: number
  average: number
  payments: { method: keyof typeof PAYMENT_METHOD_LABELS; count: number; amount: number; share: number }[]
  topProducts: { name: string; unitsSold: number; revenue: number }[]
  categories: { name: string; productCount: number; units: number; revenue: number }[]
  lowStock: { name: string; sku: string; stock: number; minStock: number; unit: string }[]
}

/** Open a clean print window with the report (browser print → save as PDF). */
export function printReport(data: ReportPrintData) {
  const win = window.open('', '_blank', 'width=980,height=760')
  if (!win) return false

  const paymentRows = data.payments
    .map(
      (payment) => `<tr>
        <td>${PAYMENT_METHOD_LABELS[payment.method]}</td>
        <td class="num">${payment.count}</td>
        <td class="num">${formatCurrency(payment.amount)}</td>
        <td class="num">${payment.share}%</td>
      </tr>`,
    )
    .join('')

  const productRows = data.topProducts
    .map(
      (product, index) => `<tr>
        <td class="num">${index + 1}</td>
        <td>${escapeHtml(product.name)}</td>
        <td class="num">${product.unitsSold}</td>
        <td class="num">${formatCurrency(product.revenue)}</td>
      </tr>`,
    )
    .join('')

  const categoryRows = data.categories
    .map(
      (category) => `<tr>
        <td>${escapeHtml(category.name)}</td>
        <td class="num">${category.productCount}</td>
        <td class="num">${category.units}</td>
        <td class="num">${formatCurrency(category.revenue)}</td>
      </tr>`,
    )
    .join('')

  const lowStockRows = data.lowStock
    .map(
      (product) => `<tr>
        <td>${escapeHtml(product.name)}</td>
        <td class="mono">${escapeHtml(product.sku)}</td>
        <td class="num">${product.stock} ${escapeHtml(product.unit)}</td>
        <td class="num">${product.minStock}</td>
      </tr>`,
    )
    .join('')

  win.document.write(`<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Laporan ${escapeHtml(data.storeName)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; color: #18181b; font-size: 12px; }
  h1 { margin: 0; font-size: 20px; }
  h2 { margin: 22px 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: #52525b; }
  p { margin: 2px 0; }
  .muted { color: #71717a; }
  .header { display: flex; justify-content: space-between; gap: 20px; border-bottom: 2px solid #18181b; padding-bottom: 12px; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 16px; }
  .card { border: 1px solid #d4d4d8; border-radius: 6px; padding: 10px; }
  .card p:first-child { color: #71717a; font-size: 10px; text-transform: uppercase; letter-spacing: .06em; }
  .card strong { display: block; margin-top: 4px; font-size: 15px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border-bottom: 1px solid #e4e4e7; padding: 6px 4px; text-align: left; }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #71717a; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .mono { font-family: ui-monospace, Menlo, monospace; font-size: 10px; }
  .footer { margin-top: 24px; border-top: 1px solid #e4e4e7; padding-top: 8px; color: #a1a1aa; font-size: 10px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${escapeHtml(data.storeName)}</h1>
      <p class="muted">Laporan penjualan &amp; inventori</p>
    </div>
    <div style="text-align:right">
      <p><strong>${formatDate(data.from)} — ${formatDate(data.to)}</strong></p>
      <p class="muted">Dicetak ${formatDate(new Date())}</p>
    </div>
  </div>

  <div class="summary">
    <div class="card"><p>Pendapatan</p><strong>${formatCurrency(data.revenue)}</strong></div>
    <div class="card"><p>Transaksi</p><strong>${data.transactionCount}</strong></div>
    <div class="card"><p>Item terjual</p><strong>${data.itemsSold}</strong></div>
    <div class="card"><p>Rata-rata</p><strong>${formatCurrency(data.average)}</strong></div>
  </div>

  <h2>Metode pembayaran</h2>
  <table><thead><tr><th>Metode</th><th class="num">Transaksi</th><th class="num">Nominal</th><th class="num">Porsi</th></tr></thead>
  <tbody>${paymentRows}</tbody></table>

  <h2>Produk terlaris</h2>
  <table><thead><tr><th class="num">#</th><th>Produk</th><th class="num">Terjual</th><th class="num">Pendapatan</th></tr></thead>
  <tbody>${productRows}</tbody></table>

  <h2>Performa kategori</h2>
  <table><thead><tr><th>Kategori</th><th class="num">Produk</th><th class="num">Terjual</th><th class="num">Pendapatan</th></tr></thead>
  <tbody>${categoryRows}</tbody></table>

  <h2>Stok menipis</h2>
  <table><thead><tr><th>Produk</th><th>SKU</th><th class="num">Stok</th><th class="num">Minimum</th></tr></thead>
  <tbody>${lowStockRows || '<tr><td colspan="4" class="muted">Semua stok aman.</td></tr>'}</tbody></table>

  <div class="footer">Warjok POS · Data contoh tersimpan di browser · Laporan dibuat otomatis</div>
</body>
</html>`)

  win.document.close()
  win.focus()
  window.setTimeout(() => win.print(), 300)
  return true
}
