import { DEFAULT_CURRENCY } from '@/lib/constants'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ReceiptLine } from '@/types/pos'

/** Optional copy overrides so the receipt can follow the app language. */
export type ReceiptLabels = {
  receipt?: string
  date?: string
  cashier?: string
  subtotal?: string
  discount?: string
  tax?: string
  total?: string
  paidWith?: string
}

/** Extra header rows such as order type or table number. */
export type ReceiptDetail = {
  label: string
  value: string
}

type ReceiptPreviewProps = {
  transactionId: string
  date: Date | string | number
  items: ReceiptLine[]
  subtotal: number
  total: number
  discount?: number
  tax?: number
  currency?: string
  storeName?: string
  storeAddress?: string
  /** Brand mark shown above the store name. */
  logoSrc?: string
  cashier?: string
  /** Order metadata rendered with the receipt header (type, table, ...). */
  details?: ReceiptDetail[]
  paymentMethod?: string
  footer?: string
  labels?: ReceiptLabels
  className?: string
}

const DEFAULT_LABELS: Required<ReceiptLabels> = {
  receipt: 'Receipt',
  date: 'Date',
  cashier: 'Cashier',
  subtotal: 'Subtotal',
  discount: 'Discount',
  tax: 'Tax',
  total: 'Total',
  paidWith: 'Paid with',
}

/**
 * Print-oriented receipt preview. Purely presentational; no printing or
 * transaction logic is attached.
 */
export function ReceiptPreview({
  transactionId,
  date,
  items,
  subtotal,
  total,
  discount,
  tax,
  currency = DEFAULT_CURRENCY,
  storeName = 'Warjok POS',
  storeAddress,
  logoSrc,
  cashier,
  details,
  paymentMethod,
  footer = 'Thank you for your purchase',
  labels,
  className,
}: ReceiptPreviewProps) {
  const copy = { ...DEFAULT_LABELS, ...labels }

  return (
    <article
      aria-label={`Receipt ${transactionId}`}
      className={cn(
        'mx-auto w-full max-w-sm rounded-lg border bg-card p-5 font-mono text-xs text-card-foreground',
        className,
      )}
    >
      <header className="flex flex-col items-center gap-0.5 text-center">
        {logoSrc ? (
          <span className="mb-1.5 inline-flex items-center justify-center rounded-md bg-white px-3 py-1.5">
            <img
              src={logoSrc}
              alt={storeName}
              className="h-7 w-auto max-w-28 object-contain"
            />
          </span>
        ) : null}
        <h3 className="font-heading text-sm font-semibold tracking-tight">
          {storeName}
        </h3>
        {storeAddress ? (
          <p className="text-[11px] leading-4 text-muted-foreground">
            {storeAddress}
          </p>
        ) : null}
      </header>

      <div aria-hidden="true" className="my-3 border-t border-dashed" />

      <dl className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">{copy.receipt}</dt>
          <dd className="tabular-nums">{transactionId}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">{copy.date}</dt>
          <dd className="tabular-nums">{formatDateTime(date)}</dd>
        </div>
        {cashier ? (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">{copy.cashier}</dt>
            <dd>{cashier}</dd>
          </div>
        ) : null}
        {details?.map((detail) => (
          <div
            key={detail.label}
            className="flex items-center justify-between gap-2"
          >
            <dt className="text-muted-foreground">{detail.label}</dt>
            <dd>{detail.value}</dd>
          </div>
        ))}
      </dl>

      <div aria-hidden="true" className="my-3 border-t border-dashed" />

      <ul className="flex flex-col gap-2">
        {items.map((item, index) => {
          const lineTotal = item.quantity * item.unitPrice

          return (
            <li
              key={item.id ?? `${item.name}-${index}`}
              className="flex flex-col gap-0.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 break-words">{item.name}</span>
                <span className="shrink-0 tabular-nums">
                  {formatCurrency(lineTotal, currency)}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {item.quantity} × {formatCurrency(item.unitPrice, currency)}
              </span>
            </li>
          )
        })}
      </ul>

      <div aria-hidden="true" className="my-3 border-t border-dashed" />

      <dl className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">{copy.subtotal}</dt>
          <dd className="tabular-nums">{formatCurrency(subtotal, currency)}</dd>
        </div>
        {typeof discount === 'number' && discount > 0 ? (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">{copy.discount}</dt>
            <dd className="tabular-nums">
              -{formatCurrency(discount, currency)}
            </dd>
          </div>
        ) : null}
        {typeof tax === 'number' && tax > 0 ? (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">{copy.tax}</dt>
            <dd className="tabular-nums">{formatCurrency(tax, currency)}</dd>
          </div>
        ) : null}
        <div className="mt-1 flex items-center justify-between gap-2 border-t pt-2 text-sm font-semibold">
          <dt>{copy.total}</dt>
          <dd className="tabular-nums">{formatCurrency(total, currency)}</dd>
        </div>
      </dl>

      {paymentMethod ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          {copy.paidWith} {paymentMethod}
        </p>
      ) : null}

      <div aria-hidden="true" className="my-3 border-t border-dashed" />

      <p className="text-center text-[11px] leading-4 text-muted-foreground">
        {footer}
      </p>
    </article>
  )
}
