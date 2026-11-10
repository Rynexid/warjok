/**
 * Business domain types shared by the catalog, inventory, sales and reporting
 * modules. These mirror the shape the API is expected to return so the UI can
 * work against the live database.
 */

export type EntityStatus = 'active' | 'archived'

export type Category = {
  id: string
  name: string
  description?: string
  status: EntityStatus
  createdAt: string
}

export type Product = {
  id: string
  name: string
  sku: string
  barcode?: string
  categoryId: string
  price: number
  cost: number
  stock: number
  minStock: number
  unit: string
  imageUrl?: string
  status: EntityStatus
  createdAt: string
}

export type Customer = {
  id: string
  name: string
  phone: string
  email?: string
  notes?: string
  joinedAt: string
}

export type StaffRole = 'owner' | 'admin' | 'manager' | 'cashier'

export type Staff = {
  id: string
  name: string
  email: string
  role: StaffRole
  status: 'active' | 'inactive'
  joinedAt: string
  lastActive?: string
}

export type PaymentMethod = 'cash' | 'qris' | 'card'

export type OrderType = 'dine-in' | 'takeaway'

export type TransactionStatus = 'completed' | 'voided' | 'refunded'

export type TransactionItem = {
  productId: string
  name: string
  sku: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type Transaction = {
  id: string
  /** Human-facing receipt number, e.g. `TRX-1042`. */
  number: string
  createdAt: string
  cashier: string
  customerId?: string
  customerName: string
  orderType: OrderType
  tableNumber?: string
  items: TransactionItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: PaymentMethod
  cashReceived?: number
  change?: number
  status: TransactionStatus
  voidReason?: string
}

export type StockMovementType = 'in' | 'out' | 'adjustment' | 'sale' | 'void'

export type StockMovement = {
  id: string
  productId: string
  productName: string
  type: StockMovementType
  /** Signed change applied to stock (negative for out/sale). */
  quantity: number
  stockAfter: number
  note: string
  staff: string
  createdAt: string
}

export type BusinessSettings = {
  businessName: string
  address: string
  phone: string
  email: string
  currency: string
  timezone: string
  taxRate: number
  memberDiscountRate: number
  lowStockThreshold: number
  receiptFooter: string
}

/** Payload produced by the POS checkout dialog when a payment succeeds. */
export type CompletedSale = {
  orderId: string
  paidAt: string
  cashier: string
  customerId?: string
  customerName: string
  orderType: OrderType
  tableNumber?: string
  items: TransactionItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: PaymentMethod
  cashReceived?: number
  change?: number
}
