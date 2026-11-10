import {
  boolean,
  check,
  index,
  jsonb,
  numeric,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { lookupsSchema } from "./schema";

const s = lookupsSchema;

/**
 * Pesanan tamu (storefront publik). Tabel ini terpisah dari `transactions`
 * yang memerlukan sesi login. Guest order disimpan dengan data kontak yang
 * diisi saat checkout, lalu diverifikasi staff melalui bukti transfer.
 */
export const storefrontOrders = s.table(
  "StorefrontOrders",
  {
    id: text("Id").primaryKey(),
    orderNumber: text("OrderNumber").notNull(),
    status: text("Status").notNull().default("pending"),
    paymentStatus: text("PaymentStatus").notNull().default("pending"),
    orderType: text("OrderType").notNull().default("takeaway"),
    tableNumber: text("TableNumber"),
    guestName: text("GuestName").notNull(),
    guestPhone: text("GuestPhone").notNull(),
    notes: text("Notes"),
    subtotal: numeric("Subtotal", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    discountTotal: numeric("DiscountTotal", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    taxTotal: numeric("TaxTotal", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    grandTotal: numeric("GrandTotal", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    items: jsonb("Items").notNull().default(sql`'[]'::jsonb`),
    paymentMethod: text("PaymentMethod"),
    paymentInstructions: jsonb("PaymentInstructions"),
    proofSubmitted: boolean("ProofSubmitted").notNull().default(false),
    proofUrl: text("ProofUrl"),
    paidAt: timestamp("PaidAt", { withTimezone: true }),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("StorefrontOrders_OrderNumber_key").on(t.orderNumber),
    index("StorefrontOrders_GuestPhone_idx").on(t.guestPhone),
    index("StorefrontOrders_Status_idx").on(t.status),
    index("StorefrontOrders_PaymentStatus_idx").on(t.paymentStatus),
    index("StorefrontOrders_CreatedAt_idx").on(t.createdAt),
    check(
      "StorefrontOrders_Status_check",
      sql`${t.status} in ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')`,
    ),
    check(
      "StorefrontOrders_PaymentStatus_check",
      sql`${t.paymentStatus} in ('pending', 'awaiting_verification', 'verified', 'paid', 'rejected', 'expired', 'cancelled')`,
    ),
    check(
      "StorefrontOrders_OrderType_check",
      sql`${t.orderType} in ('dine-in', 'takeaway', 'delivery')`,
    ),
    check("StorefrontOrders_Subtotal_check", sql`${t.subtotal} >= 0`),
    check("StorefrontOrders_DiscountTotal_check", sql`${t.discountTotal} >= 0`),
    check("StorefrontOrders_TaxTotal_check", sql`${t.taxTotal} >= 0`),
    check("StorefrontOrders_GrandTotal_check", sql`${t.grandTotal} >= 0`),
  ],
);