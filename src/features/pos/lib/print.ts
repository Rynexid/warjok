import { formatCurrency, formatDateTime } from '@/lib/format'
import type { ReceiptLine } from '@/types/pos'
import type { PosTotals } from './pricing'

/** 80mm thermal-receipt styles shared by the QRIS card and the receipt. */
const PRINT_STYLES = `
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 6mm 5mm;
    background: #fff;
    color: #111;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .brand { margin: 0; text-align: center; font-size: 17px; font-weight: 800; letter-spacing: .14em; }
  .logo { display: block; width: 30mm; height: auto; margin: 0 auto 2mm; }
  .tagline { margin: 2px 0 0; text-align: center; font-size: 9px; color: #666; }
  .dashed { border-top: 1px dashed #9a9a9a; margin: 3mm 0; }
  .card { margin-top: 4mm; padding: 4mm; border: 1px solid #cfcfcf; border-radius: 4mm; text-align: center; }
  .qris-label { margin: 0 0 2mm; font-size: 15px; font-weight: 800; letter-spacing: .18em; }
  .qr { display: block; width: 58mm; height: 58mm; margin: 0 auto; }
  .nmid { margin: 2mm 0 0; font-family: ui-monospace, Menlo, monospace; font-size: 8px; color: #666; }
  .rows { width: 100%; margin-top: 4mm; border-collapse: collapse; font-size: 10px; }
  .rows td { padding: 1mm 0; vertical-align: top; }
  .rows td:last-child { text-align: right; font-weight: 600; white-space: nowrap; }
  .rows tr.total td { border-top: 1px dashed #9a9a9a; padding-top: 2mm; font-size: 12px; font-weight: 700; }
  .hint { margin: 4mm 0 0; text-align: center; font-size: 8.5px; line-height: 1.5; color: #444; }
  .footer { margin: 3mm 0 0; text-align: center; font-size: 8px; color: #777; }

  .receipt { font-family: ui-monospace, Menlo, monospace; font-size: 10px; line-height: 1.45; }
  .receipt .brand { font-size: 15px; letter-spacing: .1em; }
  .row { display: flex; justify-content: space-between; gap: 4mm; }
  .row span:last-child { text-align: right; white-space: nowrap; }
  .muted { color: #666; }
  .item { margin: 0 0 2mm; }
  .total-row { margin-top: 1mm; border-top: 1px dashed #9a9a9a; padding-top: 2mm; font-size: 12px; font-weight: 700; }
  .center { text-align: center; }
`

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return '&#39;'
    }
  })
}

/** Open a print-only window. Returns false when the browser blocks popups. */
function openPrintWindow(title: string, body: string): boolean {
  try {
    const win = window.open('', '_blank', 'width=420,height=760')
    if (!win) {
      alert('Popup diblokir. Izinkan popup untuk mencetak struk.')
      return false
    }

    win.document.open()
    win.document.write(
      `<!doctype html><html lang="id"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />` +
        `<title>${escapeHtml(title)}</title><style>${PRINT_STYLES}</style></head>` +
        `<body>${body}</body></html>`,
    )
    win.document.close()

    const doPrint = () => {
      try {
        win.focus()
        win.print()
      } catch (e) {
        console.error(e)
      }
    }

    setTimeout(doPrint, 300)
    win.onload = doPrint
    return true
  } catch (e) {
    console.error(e)
    alert('Gagal mencetak struk')
    return false
  }
}

/** Assets inside the print document need an absolute URL (about:blank base). */
function absoluteUrl(url?: string): string | null {
  if (!url) return null

  try {
    return new URL(url, window.location.href).href
  } catch {
    return url
  }
}

export type PrintDetail = {
  label: string
  value: string
}

export type PrintQrisInput = {
  orderId: string
  amount: number
  qrDataUrl: string
  merchantName: string
  merchantCity: string
  nmid: string
  logoUrl?: string
}

/** Print the dynamic QRIS card for the current order. */
export function printQris({
  orderId,
  amount,
  qrDataUrl,
  merchantName,
  merchantCity,
  nmid,
  logoUrl,
}: PrintQrisInput): boolean {
  const logo = absoluteUrl(logoUrl)
  const logoMarkup = logo
    ? `<img class="logo" src="${escapeHtml(logo)}" alt="${escapeHtml(merchantName)}" />`
    : ''

  const body = `
    <main>
      ${logoMarkup}
      <h1 class="brand">${escapeHtml(merchantName)}</h1>
      <p class="tagline">Warkop &amp; Bakery &bull; ${escapeHtml(merchantCity)}</p>
      <section class="card">
        <p class="qris-label">QRIS</p>
        <img class="qr" src="${qrDataUrl}" alt="Kode QRIS ${escapeHtml(orderId)}" />
        <p class="nmid">NMID: ${escapeHtml(nmid)}</p>
      </section>
      <table class="rows">
        <tr><td>No. pesanan</td><td>${escapeHtml(orderId)}</td></tr>
        <tr><td>Waktu</td><td>${formatDateTime(new Date())}</td></tr>
        <tr class="total"><td>Total</td><td>${formatCurrency(amount)}</td></tr>
      </table>
      <p class="hint">Scan kode ini dengan aplikasi pembayaran apa pun (GoPay, OVO, DANA, ShopeePay, atau mobile banking). Nominal sudah terisi otomatis.</p>
      <p class="footer">Warjok POS &mdash; kasir, stok, dan laporan.</p>
    </main>
  `

  return openPrintWindow(`QRIS ${orderId}`, body)
}

export type PrintReceiptInput = {
  orderId: string
  date: Date
  lines: ReceiptLine[]
  totals: PosTotals
  paymentMethod: string
  cashReceived?: number
  change?: number
  cashier?: string
  storeName?: string
  logoUrl?: string
  /** Extra header rows such as order type and table number. */
  details?: PrintDetail[]
}

/** Print the paid order as an 80mm thermal receipt. */
export function printReceipt({
  orderId,
  date,
  lines,
  totals,
  paymentMethod,
  cashReceived,
  change,
  cashier,
  storeName = 'WARJOK',
  logoUrl,
  details,
}: PrintReceiptInput): boolean {
  const items = lines
    .map((line) => {
      const lineTotal = line.quantity * line.unitPrice

      return `<div class="item">
        <div class="row"><span>${escapeHtml(line.name)}</span><span>${formatCurrency(lineTotal)}</span></div>
        <div class="muted">${line.quantity} &times; ${formatCurrency(line.unitPrice)}</div>
      </div>`
    })
    .join('')

  const discountRow =
    totals.discount > 0
      ? `<div class="row"><span>Diskon</span><span>-${formatCurrency(totals.discount)}</span></div>`
      : ''

  const cashRows =
    typeof cashReceived === 'number'
      ? `<div class="row"><span>Tunai</span><span>${formatCurrency(cashReceived)}</span></div>
         <div class="row"><span>Kembali</span><span>${formatCurrency(change ?? 0)}</span></div>`
      : ''

  const logo = absoluteUrl(logoUrl)
  const logoMarkup = logo
    ? `<img class="logo" src="${escapeHtml(logo)}" alt="${escapeHtml(storeName)}" />`
    : ''

  const detailRows = (details ?? [])
    .map(
      (detail) =>
        `<div class="row"><span>${escapeHtml(detail.label)}</span><span>${escapeHtml(detail.value)}</span></div>`,
    )
    .join('')

  const body = `<main class="receipt">
    ${logoMarkup}
    <h1 class="brand">${escapeHtml(storeName)}</h1>
    <p class="tagline">Warkop &amp; Bakery</p>
    <div class="dashed"></div>
    <div class="row"><span>No.</span><span>${escapeHtml(orderId)}</span></div>
    <div class="row"><span>Waktu</span><span>${formatDateTime(date)}</span></div>
    ${cashier ? `<div class="row"><span>Kasir</span><span>${escapeHtml(cashier)}</span></div>` : ''}
    ${detailRows}
    <div class="dashed"></div>
    ${items}
    <div class="dashed"></div>
    <div class="row"><span>Subtotal</span><span>${formatCurrency(totals.subtotal)}</span></div>
    ${discountRow}
    <div class="row"><span>Pajak 10%</span><span>${formatCurrency(totals.tax)}</span></div>
    <div class="row total-row"><span>TOTAL</span><span>${formatCurrency(totals.total)}</span></div>
    <div class="row"><span>${escapeHtml(paymentMethod)}</span><span>${formatCurrency(totals.total)}</span></div>
    ${cashRows}
    <div class="dashed"></div>
    <p class="center">Terima kasih atas kunjungan Anda</p>
    <p class="center muted">Warjok POS</p>
  </main>`

  return openPrintWindow(`Struk ${orderId}`, body)
}
