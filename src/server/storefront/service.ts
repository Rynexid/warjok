import { desc, eq, lte, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { storefrontOrders } from "@/server/db/schema";
import { inventory } from "@/server/db/schema/inventory";
import { products } from "@/server/db/schema/products";

export type StorefrontOrderItem = {
  productId: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  variantId?: string | null;
  variantName?: string | null;
  notes?: string | null;
  unit?: string | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  diameterCm?: number | null;
  dimensionUnit?: string | null;
};

export type StorefrontOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  orderType: string;
  tableNumber?: string | null;
  guestName: string;
  guestPhone: string;
  notes?: string | null;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  items: StorefrontOrderItem[];
  paymentMethod?: string | null;
  paymentInstructions?: any | null;
  proofSubmitted: boolean;
  proofUrl?: string | null;
  rejectionReason?: string | null;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function createStorefrontOrder(data: {
  idempotencyKey: string;
  items: StorefrontOrderItem[];
  guestName: string;
  guestPhone: string;
  notes?: string;
  orderType?: string;
  tableNumber?: string;
  paymentMethod: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paymentInstructions: any;
}) {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  const orderNumber = `SF-${y}${m}${d}-${rand}`;
  const id = crypto.randomUUID();

  const [created] = await db
    .insert(storefrontOrders)
    .values({
      id,
      orderNumber,
      status: "pending",
      paymentStatus: "pending",
      orderType: data.orderType ?? "takeaway",
      tableNumber: data.tableNumber ?? null,
      guestName: data.guestName.trim(),
      guestPhone: data.guestPhone.trim(),
      notes: data.notes?.trim() || null,
      subtotal: data.subtotal.toFixed(2),
      discountTotal: data.discountTotal.toFixed(2),
      taxTotal: data.taxTotal.toFixed(2),
      grandTotal: data.grandTotal.toFixed(2),
      items: data.items as any,
      paymentMethod: data.paymentMethod,
      paymentInstructions: data.paymentInstructions,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return mapOrder(created);
}

export async function getStorefrontOrder(id: string) {
  const [row] = await db
    .select()
    .from(storefrontOrders)
    .where(eq(storefrontOrders.id, id))
    .limit(1);
  return row ? mapOrder(row) : null;
}

export async function getStorefrontOrderByNumber(orderNumber: string) {
  const [row] = await db
    .select()
    .from(storefrontOrders)
    .where(eq(storefrontOrders.orderNumber, orderNumber))
    .limit(1);
  return row ? mapOrder(row) : null;
}

/** Pesanan pending yang melebihi batas waktu ini (menit) akan dibatalkan otomatis dan stok dikembalikan. */
const AUTO_CANCEL_PENDING_MINUTES = 60;

export async function listStorefrontOrders() {
  // Batalkan pesanan pending yang melewati batas waktu tanpa bukti pembayaran,
  // lalu kembalikan stoknya agar tidak menumpuk di tampilan kasir.
  const cutoff = new Date(Date.now() - AUTO_CANCEL_PENDING_MINUTES * 60 * 1000);
  const expired = await db
    .select({ id: storefrontOrders.id, status: storefrontOrders.status, items: storefrontOrders.items })
    .from(storefrontOrders)
    .where(
      lte(storefrontOrders.createdAt, cutoff),
    );

  for (const o of expired) {
    const items = (o.items as any[]) ?? [];
    for (const it of items) {
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, it.productId))
        .limit(1);
      const prod = product[0];
      if (!prod) continue;
      const invRow = await db
        .select()
        .from(inventory)
        .where(eq(inventory.productId, it.productId))
        .limit(1);
      if (invRow[0]) {
        await db
          .update(inventory)
          .set({ stockQuantity: sql`${inventory.stockQuantity} + ${it.quantity}` })
          .where(eq(inventory.id, invRow[0].id));
      } else {
        await db
          .update(products)
          .set({ stockQuantity: sql`${products.stockQuantity} + ${it.quantity}` })
          .where(eq(products.id, it.productId));
      }
    }
    await db
      .update(storefrontOrders)
      .set({ status: "cancelled", paymentStatus: "rejected", updatedAt: new Date() })
      .where(eq(storefrontOrders.id, o.id));
  }

  const rows = await db
    .select()
    .from(storefrontOrders)
    .orderBy(desc(storefrontOrders.createdAt));
  return rows.map(mapOrder);
}

export async function submitProof(orderId: string, proofUrl: string) {
  const [row] = await db
    .update(storefrontOrders)
    .set({
      proofSubmitted: true,
      proofUrl,
      paymentStatus: "awaiting_verification",
      rejectionReason: null,
      updatedAt: new Date(),
    })
    .where(eq(storefrontOrders.id, orderId))
    .returning();
  return row ? mapOrder(row) : null;
}

export async function verifyOrder(orderId: string, approved: boolean, reason?: string | null) {
  const rejectionReason = approved ? null : String(reason || "").trim() || "Bukti pembayaran ditolak.";
  const [row] = await db
    .update(storefrontOrders)
    .set({
      paymentStatus: approved ? "verified" : "rejected",
      status: approved ? "confirmed" : "pending",
      paidAt: approved ? new Date() : null,
      rejectionReason,
      updatedAt: new Date(),
    })
    .where(eq(storefrontOrders.id, orderId))
    .returning();
  return row ? mapOrder(row) : null;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const [row] = await db
    .update(storefrontOrders)
    .set({ status, updatedAt: new Date() })
    .where(eq(storefrontOrders.id, orderId))
    .returning();
  return row ? mapOrder(row) : null;
}

function mapOrder(row: any): StorefrontOrder {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    paymentStatus: row.paymentStatus,
    orderType: row.orderType,
    tableNumber: row.tableNumber,
    guestName: row.guestName,
    guestPhone: row.guestPhone,
    notes: row.notes,
    subtotal: Number(row.subtotal),
    discountTotal: Number(row.discountTotal),
    taxTotal: Number(row.taxTotal),
    grandTotal: Number(row.grandTotal),
    items: (row.items as StorefrontOrderItem[]) ?? [],
    paymentMethod: row.paymentMethod,
    paymentInstructions: row.paymentInstructions,
    proofSubmitted: row.proofSubmitted,
    proofUrl: row.proofUrl,
    rejectionReason: row.rejectionReason ?? null,
    paidAt: row.paidAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
