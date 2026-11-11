import { and, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/server/db";
import {
  DEFAULT_BUSINESS_ID,
  DEFAULT_STORE_ID,
  inventory,
  products,
  taxRates,
} from "@/server/db/schema";
import { createStorefrontOrder } from "@/server/storefront/service";

const CheckoutSchema = z.object({
  idempotencyKey: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  guestName: z.string().min(1),
  guestPhone: z.string().min(1),
  notes: z.string().optional(),
  orderType: z.enum(["dine-in", "takeaway"]).default("takeaway"),
  tableNumber: z.string().optional(),
  paymentMethod: z.string().default("qris"),
});

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data checkout tidak valid.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const payload = parsed.data;
    const canonicalItems = [...payload.items].sort((a, b) =>
      a.productId.localeCompare(b.productId),
    );

    const productIds = [...new Set(canonicalItems.map((i) => i.productId))].sort();
    const productRows = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const inventoryRows = await db
      .select()
      .from(inventory)
      .where(
        and(
          eq(inventory.storeId, DEFAULT_STORE_ID),
          inArray(inventory.productId, productIds),
        ),
      );

    const productById = new Map(productRows.map((r) => [r.id, r]));
    const inventoryByProduct = new Map(inventoryRows.map((r) => [r.productId, r]));

    const [defaultTaxRate] = await db
      .select()
      .from(taxRates)
      .where(
        and(
          eq(taxRates.businessId, DEFAULT_BUSINESS_ID),
          eq(taxRates.isDefault, true),
        ),
      )
      .limit(1);
    const taxRate = Number(defaultTaxRate?.rate ?? 0);

const orderItems: {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  unit?: string | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  diameterCm?: number | null;
  dimensionUnit?: string | null;
}[] = [];
    let subtotal = 0;

    for (const item of canonicalItems) {
      const product = productById.get(item.productId);
      if (!product) {
        throw new Error(`Produk ${item.productId} tidak ditemukan.`);
      }
      if (product.status !== "active") {
        throw new Error(`Produk ${product.name} sedang tidak tersedia.`);
      }
      const inventoryRow = inventoryByProduct.get(item.productId);
      const available = inventoryRow?.stockQuantity ?? product.stockQuantity;
      if (available < item.quantity) {
        throw new Error(`Stok ${product.name} tidak cukup.`);
      }
      const unitPrice = Number(product.sellingPrice);
      const lineTotal = roundMoney(unitPrice * item.quantity);
      subtotal += lineTotal;
      orderItems.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        unit: product.unit,
        lengthCm: product.lengthCm != null ? Number(product.lengthCm) : null,
        widthCm: product.widthCm != null ? Number(product.widthCm) : null,
        heightCm: product.heightCm != null ? Number(product.heightCm) : null,
        diameterCm: product.diameterCm != null ? Number(product.diameterCm) : null,
        dimensionUnit: product.dimensionUnit ?? "cm",
      });
    }

    subtotal = roundMoney(subtotal);
    const discount = 0;
    const taxableSubtotal = roundMoney(subtotal - discount);
    const tax = roundMoney(taxableSubtotal * taxRate);
    const total = roundMoney(taxableSubtotal + tax);

    const paymentInstructions = {
      type: "qris",
      label: "QRIS Warjok",
      merchantName: "Warjok Coffee & Bakery",
      qrisImageUrl: "/WarjokQris.jpeg",
      note: "Scan QRIS di atas, bayar sesuai total pesanan, lalu unggah bukti pembayaran.",
    };

    const order = await createStorefrontOrder({
      idempotencyKey: payload.idempotencyKey,
      items: orderItems,
      guestName: payload.guestName,
      guestPhone: payload.guestPhone,
      notes: payload.notes,
      orderType: payload.orderType,
      tableNumber: payload.tableNumber,
      paymentMethod: payload.paymentMethod,
      subtotal,
      discountTotal: discount,
      taxTotal: tax,
      grandTotal: total,
      paymentInstructions,
    });

    // Kurangi stok inventory untuk setiap item pesanan.
    for (const item of canonicalItems) {
      const inventoryRow = inventoryByProduct.get(item.productId);
      if (inventoryRow) {
        await db
          .update(inventory)
          .set({ stockQuantity: sql`${inventoryRow.stockQuantity} - ${item.quantity}` })
          .where(
            and(
              eq(inventory.id, inventoryRow.id),
              sql`${inventory.stockQuantity} >= ${item.quantity}`,
            ),
          );
      } else {
        await db
          .update(products)
          .set({ stockQuantity: sql`${products.stockQuantity} - ${item.quantity}` })
          .where(
            and(
              eq(products.id, item.productId),
              sql`${products.stockQuantity} >= ${item.quantity}`,
            ),
          );
      }
    }

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: order.id,
      totals: {
        subtotal: order.subtotal,
        discount: order.discountTotal,
        tax: order.taxTotal,
        total: order.grandTotal,
      },
      paymentInstructions,
    });
  } catch (error: any) {
    console.error("Checkout error:", error?.message ?? error);
    return NextResponse.json(
      { error: error?.message || "Checkout gagal." },
      { status: error?.status ?? 400 },
    );
  }
}
