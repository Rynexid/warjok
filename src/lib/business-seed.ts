import { subDays } from 'date-fns'

import type {
  BusinessSettings,
  Category,
  Customer,
  PaymentMethod,
  Product,
  Staff,
  StockMovement,
  Transaction,
  TransactionItem,
  TransactionStatus,
} from '@/types/business'

/**
 * Deterministic seed data used for initial database seeding via `db:seed`.
 *
 * Everything here is illustrative sample data, not real business records. It is
 * inserted into the database once so the catalog, POS, inventory, transactions
 * and reports have consistent starting data.
 */

const image = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=400&h=400&q=70`

const iso = (date: Date) => date.toISOString()

const DAY = 24 * 60 * 60 * 1000

function createRandom(seed: number) {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = <T,>(random: () => number, values: readonly T[]): T =>
  values[Math.floor(random() * values.length)] as T

const CATEGORY_ROWS: readonly Omit<Category, 'createdAt'>[] = [
  {
    id: 'bakery',
    name: 'Bakery & Pastry',
    description: 'Roti, pastry, dan kue yang dipanggang setiap pagi.',
    status: 'active',
  },
  {
    id: 'coffee',
    name: 'Specialty Coffee',
    description: 'Espresso, latte, dan manual brew dari biji pilihan.',
    status: 'active',
  },
  {
    id: 'deli',
    name: 'Artisan Deli',
    description: 'Sandwich dan panini dengan isian buatan sendiri.',
    status: 'active',
  },
  {
    id: 'cold',
    name: 'Cold Drinks',
    description: 'Minuman dingin, mocktail, dan latte musiman.',
    status: 'active',
  },
  {
    id: 'dessert',
    name: 'Dessert',
    description: 'Hidangan penutup dan kue lembut.',
    status: 'active',
  },
]

const PRODUCT_ROWS: readonly Omit<Product, 'createdAt'>[] = [
  {
    id: 'p-croissant',
    name: 'Butter Croissant',
    sku: 'BAK-001',
    barcode: '8991001100011',
    categoryId: 'bakery',
    price: 35_000,
    cost: 15_000,
    stock: 24,
    minStock: 10,
    unit: 'pcs',
    imageUrl: image('photo-1555507036-ab1f4038808a'),
    status: 'active',
  },
  {
    id: 'p-kouign-amann',
    name: 'Pistachio Kouign',
    sku: 'BAK-007',
    barcode: '8991001100028',
    categoryId: 'bakery',
    price: 45_000,
    cost: 22_000,
    stock: 0,
    minStock: 8,
    unit: 'pcs',
    imageUrl: image('photo-1509440159596-0249088772ff'),
    status: 'active',
  },
  {
    id: 'p-sourdough',
    name: 'Cheesy Sourdough',
    sku: 'BAK-012',
    barcode: '8991001100035',
    categoryId: 'bakery',
    price: 52_000,
    cost: 24_000,
    stock: 14,
    minStock: 6,
    unit: 'pcs',
    imageUrl: image('photo-1585478259715-876acc5be8eb'),
    status: 'active',
  },
  {
    id: 'p-donut',
    name: 'Cereal Cream Donut',
    sku: 'BAK-015',
    barcode: '8991001100042',
    categoryId: 'bakery',
    price: 28_000,
    cost: 11_000,
    stock: 6,
    minStock: 10,
    unit: 'pcs',
    imageUrl: image('photo-1551024601-bec78aea704b'),
    status: 'active',
  },
  {
    id: 'p-spanish-latte',
    name: 'Spanish Oat Latte',
    sku: 'BEV-014',
    barcode: '8991001100059',
    categoryId: 'coffee',
    price: 42_000,
    cost: 14_000,
    stock: 18,
    minStock: 8,
    unit: 'cup',
    imageUrl: image('photo-1461023058943-07fcbe16d735'),
    status: 'active',
  },
  {
    id: 'p-espresso',
    name: 'Double Espresso',
    sku: 'BEV-001',
    barcode: '8991001100066',
    categoryId: 'coffee',
    price: 28_000,
    cost: 9_000,
    stock: 50,
    minStock: 15,
    unit: 'cup',
    imageUrl: image('photo-1510707577719-ae7c14805e3a'),
    status: 'active',
  },
  {
    id: 'p-cappuccino',
    name: 'Cappuccino',
    sku: 'BEV-002',
    barcode: '8991001100073',
    categoryId: 'coffee',
    price: 36_000,
    cost: 12_000,
    stock: 32,
    minStock: 10,
    unit: 'cup',
    imageUrl: image('photo-1572442388796-11668a67e53d'),
    status: 'active',
  },
  {
    id: 'p-americano',
    name: 'Iced Americano',
    sku: 'BEV-004',
    barcode: '8991001100080',
    categoryId: 'coffee',
    price: 30_000,
    cost: 10_000,
    stock: 4,
    minStock: 12,
    unit: 'cup',
    imageUrl: image('photo-1517701550927-30cf4ba1dba5'),
    status: 'active',
  },
  {
    id: 'p-beef-toast',
    name: 'Smoked Beef Toast',
    sku: 'DEL-003',
    barcode: '8991001100097',
    categoryId: 'deli',
    price: 58_000,
    cost: 28_000,
    stock: 12,
    minStock: 5,
    unit: 'pcs',
    imageUrl: image('photo-1528735602780-2552fd46c7af'),
    status: 'active',
  },
  {
    id: 'p-truffle-panini',
    name: 'Truffle Panini',
    sku: 'DEL-011',
    barcode: '8991001100103',
    categoryId: 'deli',
    price: 52_000,
    cost: 26_000,
    stock: 8,
    minStock: 6,
    unit: 'pcs',
    imageUrl: image('photo-1509722747041-616f39b57569'),
    status: 'active',
  },
  {
    id: 'p-cold-brew',
    name: 'Citrus Cold Brew',
    sku: 'BEV-021',
    barcode: '8991001100110',
    categoryId: 'cold',
    price: 38_000,
    cost: 13_000,
    stock: 15,
    minStock: 8,
    unit: 'cup',
    imageUrl: image('photo-1517701550927-30cf4ba1dba5'),
    status: 'active',
  },
  {
    id: 'p-matcha',
    name: 'Matcha Latte',
    sku: 'BEV-033',
    barcode: '8991001100127',
    categoryId: 'cold',
    price: 42_000,
    cost: 16_000,
    stock: 0,
    minStock: 8,
    unit: 'cup',
    imageUrl: image('photo-1515823064-d6e0c04616a7'),
    status: 'active',
  },
  {
    id: 'p-sparkler',
    name: 'Berry Sparkler',
    sku: 'BEV-040',
    barcode: '8991001100134',
    categoryId: 'cold',
    price: 34_000,
    cost: 11_000,
    stock: 22,
    minStock: 8,
    unit: 'glass',
    imageUrl: image('photo-1544145945-f90425340c7e'),
    status: 'active',
  },
  {
    id: 'p-panna-cotta',
    name: 'Vanilla Panna Cotta',
    sku: 'DST-002',
    barcode: '8991001100141',
    categoryId: 'dessert',
    price: 32_000,
    cost: 12_000,
    stock: 9,
    minStock: 5,
    unit: 'pcs',
    imageUrl: image('photo-1488477181946-6428a0291777'),
    status: 'active',
  },
]

const CUSTOMER_ROWS: readonly Omit<Customer, 'joinedAt'>[] = [
  { id: 'c-aulia', name: 'Aulia Rahma', phone: '0812-3456-7890', email: 'aulia.rahma@mail.com' },
  { id: 'c-budi', name: 'Budi Santoso', phone: '0813-2211-3344', email: 'budi.santoso@mail.com' },
  { id: 'c-citra', name: 'Citra Dewi', phone: '0857-8899-1122', email: 'citra.dewi@mail.com' },
  { id: 'c-dedi', name: 'Dedi Kurniawan', phone: '0821-4455-6677' },
  { id: 'c-eka', name: 'Eka Putri', phone: '0818-7766-5544', email: 'eka.putri@mail.com' },
  { id: 'c-fajar', name: 'Fajar Nugroho', phone: '0812-9988-7766', email: 'fajar.n@mail.com' },
  { id: 'c-gita', name: 'Gita Lestari', phone: '0896-3344-2211' },
  { id: 'c-hana', name: 'Hana Wijaya', phone: '0851-2233-4455', email: 'hana.wijaya@mail.com' },
  { id: 'c-intan', name: 'Intan Permata', phone: '0817-6655-4433' },
  { id: 'c-joko', name: 'Joko Susilo', phone: '0822-1144-8899', email: 'joko.susilo@mail.com' },
]

const STAFF_ROWS: readonly Omit<Staff, 'joinedAt' | 'lastActive'>[] = [
  { id: 's-arya', name: 'Arya Wibowo', email: 'arya@warjok.id', role: 'owner', status: 'active' },
  { id: 's-nadia', name: 'Nadia Kusuma', email: 'nadia@warjok.id', role: 'admin', status: 'active' },
  { id: 's-bagas', name: 'Bagas Pratama', email: 'bagas@warjok.id', role: 'manager', status: 'active' },
  { id: 's-sarah', name: 'Sarah Vance', email: 'sarah@warjok.id', role: 'cashier', status: 'active' },
  { id: 's-rizky', name: 'Rizky Ananda', email: 'rizky@warjok.id', role: 'cashier', status: 'active' },
  { id: 's-maya', name: 'Maya Anggraini', email: 'maya@warjok.id', role: 'cashier', status: 'inactive' },
  { id: 's-yoga', name: 'Yoga Saputra', email: 'yoga@warjok.id', role: 'cashier', status: 'active' },
]

const CASHIERS = ['Sarah Vance', 'Rizky Ananda', 'Yoga Saputra', 'Bagas Pratama'] as const

const VOID_REASONS = [
  'Salah input pesanan',
  'Pelanggan membatalkan',
  'Stok tidak tersedia',
] as const

export const BUSINESS_SETTINGS: BusinessSettings = {
  businessName: 'Warjok Coffee & Bakery',
  address: 'Jl. Senopati No. 24, Kebayoran Baru, Jakarta Selatan 12190',
  phone: '+62 812 3456 7890',
  email: 'hello@warjok.id',
  currency: 'IDR',
  timezone: 'Asia/Jakarta',
  taxRate: 0.1,
  memberDiscountRate: 0.1,
  lowStockThreshold: 5,
  receiptFooter: 'Terima kasih telah berkunjung • Warjok',
}

export function createSeedData() {
  const now = new Date()
  const random = createRandom(20_261_102)

  const categories: Category[] = CATEGORY_ROWS.map((category, index) => ({
    ...category,
    createdAt: iso(subDays(now, 180 - index * 3)),
  }))

  const products: Product[] = PRODUCT_ROWS.map((product, index) => ({
    ...product,
    createdAt: iso(subDays(now, 150 - index * 4)),
  }))

  const customers: Customer[] = CUSTOMER_ROWS.map((customer, index) => ({
    ...customer,
    joinedAt: iso(subDays(now, 120 - index * 9)),
  }))

  const staff: Staff[] = STAFF_ROWS.map((member, index) => ({
    ...member,
    joinedAt: iso(subDays(now, 400 - index * 30)),
    lastActive: iso(subDays(now, index)),
  }))

  const productPool = products.filter((product) => product.status === 'active')

  const transactions: Transaction[] = []
  let sequence = 1001

  for (let daysAgo = 21; daysAgo >= 0; daysAgo -= 1) {
    const perDay = daysAgo === 0 ? 3 : 1 + Math.floor(random() * 3)

    for (let index = 0; index < perDay; index += 1) {
      const lineCount = 1 + Math.floor(random() * 3)
      const chosen = new Set<string>()
      const items: TransactionItem[] = []

      for (let line = 0; line < lineCount; line += 1) {
        const product = pick(random, productPool)
        if (chosen.has(product.id)) continue
        chosen.add(product.id)

        const quantity = 1 + Math.floor(random() * 2)
        items.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          quantity,
          unitPrice: product.price,
          lineTotal: product.price * quantity,
        })
      }

      const subtotal = items.reduce((total, item) => total + item.lineTotal, 0)
      const customer = random() < 0.65 ? pick(random, customers) : undefined
      const discount =
        customer && random() < 0.4
          ? Math.round(subtotal * BUSINESS_SETTINGS.memberDiscountRate)
          : 0
      const tax = Math.round((subtotal - discount) * BUSINESS_SETTINGS.taxRate)
      const total = subtotal - discount + tax

      const roll = random()
      const status: TransactionStatus =
        roll < 0.05 ? 'voided' : roll < 0.09 ? 'refunded' : 'completed'

      const paymentRoll = random()
      const paymentMethod: PaymentMethod =
        paymentRoll < 0.45 ? 'cash' : paymentRoll < 0.85 ? 'qris' : 'card'

      const cashReceived =
        paymentMethod === 'cash'
          ? Math.ceil(total / 10_000) * 10_000
          : total

      const dineIn = random() < 0.65
      const hour = 8 + Math.floor(random() * 11)
      const minute = Math.floor(random() * 60)
      const createdAt = new Date(now.getTime() - daysAgo * DAY)
      createdAt.setHours(hour, minute, 0, 0)

      transactions.push({
        id: `trx-${sequence}`,
        number: `TRX-${sequence}`,
        createdAt: iso(createdAt),
        cashier: pick(random, CASHIERS),
        customerId: customer?.id,
        customerName: customer?.name ?? 'Walk-in Customer',
        orderType: dineIn ? 'dine-in' : 'takeaway',
        tableNumber: dineIn ? String(1 + Math.floor(random() * 12)) : undefined,
        items,
        subtotal,
        discount,
        tax,
        total,
        paymentMethod,
        cashReceived,
        change: paymentMethod === 'cash' ? cashReceived - total : 0,
        status,
        voidReason:
          status === 'voided' ? pick(random, VOID_REASONS) : undefined,
      })

      sequence += 1
    }
  }

  transactions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const movementSeeds: {
    productId: string
    type: StockMovement['type']
    quantity: number
    note: string
    daysAgo: number
  }[] = [
    { productId: 'p-croissant', type: 'in', quantity: 20, note: 'Kiriman pagi dari dapur', daysAgo: 1 },
    { productId: 'p-spanish-latte', type: 'in', quantity: 12, note: 'Restock susu oat', daysAgo: 2 },
    { productId: 'p-donut', type: 'out', quantity: -4, note: 'Rusak saat pengiriman', daysAgo: 3 },
    { productId: 'p-americano', type: 'adjustment', quantity: -6, note: 'Stok opname mingguan', daysAgo: 4 },
    { productId: 'p-beef-toast', type: 'in', quantity: 10, note: 'Restock smoked beef', daysAgo: 5 },
    { productId: 'p-matcha', type: 'out', quantity: -8, note: 'Penjualan manual (koreksi)', daysAgo: 6 },
    { productId: 'p-sourdough', type: 'in', quantity: 8, note: 'Produksi tambahan', daysAgo: 8 },
    { productId: 'p-panna-cotta', type: 'adjustment', quantity: 3, note: 'Koreksi stok opname', daysAgo: 10 },
  ]

  const movements: StockMovement[] = movementSeeds.map((seed, index) => {
    const product = products.find((item) => item.id === seed.productId)
    return {
      id: `mv-${1001 + index}`,
      productId: seed.productId,
      productName: product?.name ?? 'Produk',
      type: seed.type,
      quantity: seed.quantity,
      stockAfter: product?.stock ?? 0,
      note: seed.note,
      staff: index % 2 === 0 ? 'Bagas Pratama' : 'Sarah Vance',
      createdAt: iso(subDays(now, seed.daysAgo)),
    }
  })

  return {
    categories,
    products,
    customers,
    staff,
    transactions,
    movements,
    settings: BUSINESS_SETTINGS,
  }
}

export type BusinessSeed = ReturnType<typeof createSeedData>
