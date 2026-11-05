import { useCallback, useEffect, useMemo, useState } from 'react'

import type { PosProduct } from '../data/catalog'

export type PosCartLine = {
  product: PosProduct
  quantity: number
}

type StoredEntry = {
  productId: string
  quantity: number
}

const STORAGE_KEY = 'warjok.pos.cart.v1'

/**
 * Rehydrate the in-progress order from sessionStorage. Only ids and quantities
 * are stored; product details are resolved from the live catalog on render so
 * prices and stock can never go stale.
 */
function readStoredEntries(): StoredEntry[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const entries: StoredEntry[] = []
    for (const entry of parsed) {
      if (typeof entry !== 'object' || entry === null) continue

      const { id, quantity } = entry as { id?: unknown; quantity?: unknown }
      if (typeof id !== 'string' || typeof quantity !== 'number') continue
      if (!Number.isFinite(quantity) || quantity <= 0) continue

      entries.push({ productId: id, quantity: Math.floor(quantity) })
    }

    return entries
  } catch {
    return []
  }
}

/**
 * Local cart state for the POS terminal. Products come from the business
 * store, so prices and stock always match the catalog. The order survives
 * reloads / dev-server refreshes (per browser tab).
 */
export function usePosCart(products: PosProduct[]) {
  const [entries, setEntries] = useState<StoredEntry[]>(readStoredEntries)

  // Resolve stored ids against the live catalog and clamp to available stock.
  const lines = useMemo<PosCartLine[]>(
    () =>
      entries.flatMap((entry) => {
        const product = products.find((item) => item.id === entry.productId)
        if (!product) return []

        const max = product.stock ?? Number.POSITIVE_INFINITY
        if (max <= 0) return []

        const quantity = Math.min(entry.quantity, max)
        return quantity > 0 ? [{ product, quantity }] : []
      }),
    [entries, products],
  )

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          lines.map((line) => ({
            id: line.product.id,
            quantity: line.quantity,
          })),
        ),
      )
    } catch {
      // Storage unavailable (private mode, quota) — keep the cart in memory.
    }
  }, [lines])

  const add = useCallback((product: PosProduct) => {
    if (product.stock !== undefined && product.stock <= 0) return

    setEntries((current) => {
      const existing = current.find((entry) => entry.productId === product.id)
      if (!existing) {
        return [...current, { productId: product.id, quantity: 1 }]
      }

      // Never exceed tracked stock.
      if (product.stock !== undefined && existing.quantity >= product.stock) {
        return current
      }

      return current.map((entry) =>
        entry.productId === product.id
          ? { ...entry, quantity: entry.quantity + 1 }
          : entry,
      )
    })
  }, [])

  const increment = useCallback(
    (id: string) => {
      setEntries((current) =>
        current.map((entry) => {
          if (entry.productId !== id) return entry

          const product = products.find((item) => item.id === id)
          if (!product) return entry
          if (
            product.stock !== undefined &&
            entry.quantity >= product.stock
          ) {
            return entry
          }

          return { ...entry, quantity: entry.quantity + 1 }
        }),
      )
    },
    [products],
  )

  const decrement = useCallback((id: string) => {
    setEntries((current) =>
      current
        .map((entry) =>
          entry.productId === id
            ? { ...entry, quantity: entry.quantity - 1 }
            : entry
        )
        .filter((entry) => entry.quantity > 0),
    )
  }, [])

  const remove = useCallback((id: string) => {
    setEntries((current) =>
      current.filter((entry) => entry.productId !== id),
    )
  }, [])

  const clear = useCallback(() => setEntries([]), [])

  const itemCount = useMemo(
    () => lines.reduce((total, line) => total + line.quantity, 0),
    [lines],
  )

  const subtotal = useMemo(
    () =>
      lines.reduce(
        (total, line) => total + line.quantity * line.product.price,
        0,
      ),
    [lines],
  )

  return {
    lines,
    add,
    increment,
    decrement,
    remove,
    clear,
    itemCount,
    subtotal,
  }
}
