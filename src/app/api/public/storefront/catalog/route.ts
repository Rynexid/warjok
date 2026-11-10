import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/server/db";
import {
  businessSettings,
  categories,
  DEFAULT_BUSINESS_ID,
  products,
  receiptSettings,
} from "@/server/db/schema";

export async function GET() {
  try {
    const [settings, receipt] = await Promise.all([
      db
        .select()
        .from(businessSettings)
        .where(eq(businessSettings.id, "default"))
        .limit(1),
      db
        .select()
        .from(receiptSettings)
        .where(
          and(
            eq(receiptSettings.businessId, DEFAULT_BUSINESS_ID),
            eq(receiptSettings.storeId, "00000000-0000-0000-0000-000000000002"),
          ),
        )
        .limit(1),
    ]);

    const [categoryRows, productRows] = await Promise.all([
      db
        .select()
        .from(categories)
        .where(eq(categories.businessId, DEFAULT_BUSINESS_ID)),
      db
        .select()
        .from(products)
        .where(eq(products.businessId, DEFAULT_BUSINESS_ID)),
    ]);

    const paymentMethods = [{ id: "qris", label: "QRIS" }];

    return NextResponse.json({
      ok: true,
      catalog: {
        business: {
          name: settings[0]?.businessName ?? "Warjok",
          description: null,
          logoUrl: null,
          city: null,
        },
        payment: {
          storefrontCheckoutEnabled: true,
          manualTransferEnabled: false,
          qrisEnabled: true,
          methods: paymentMethods,
        },
        categories: categoryRows.map((c) => ({
          id: c.id,
          name: c.name,
          sortOrder: c.sortOrder,
        })),
        products: productRows.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          categoryId: p.categoryId,
          sellingPrice: Number(p.sellingPrice),
          imageUrl: p.imageUrl,
          isTaxable: p.isTaxable,
          available: p.status === "active" && p.isStockTracked
            ? Number(p.stockQuantity) > 0
            : p.status === "active",
          maxQuantity: p.isStockTracked ? Number(p.stockQuantity) : 99,
          variants: [],
        })),
      },
      context: { mode: "direct" },
    });
  } catch (error: any) {
    console.error("Catalog error:", error?.message ?? error);
    return NextResponse.json(
      { error: error?.message || "Gagal memuat katalog." },
      { status: 500 },
    );
  }
}
