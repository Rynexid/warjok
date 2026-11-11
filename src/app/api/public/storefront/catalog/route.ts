import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/server/db";
import {
  businessSettings,
  categories,
  DEFAULT_BUSINESS_ID,
  DEFAULT_STORE_ID,
  products,
  receiptSettings,
} from "@/server/db/schema";

export async function GET() {
  let settings: any[] = [];
  let receipt: any[] = [];
  let categoryRows: any[] = [];
  let productRows: any[] = [];
  const errors: string[] = [];

  try {
    [settings, receipt] = await Promise.all([
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
            eq(receiptSettings.storeId, DEFAULT_STORE_ID),
          ),
        )
        .limit(1),
    ]);
  } catch (error: any) {
    console.error("Catalog settings error:", error?.message ?? error);
    errors.push("settings");
  }

  try {
    [categoryRows, productRows] = await Promise.all([
      db
        .select()
        .from(categories)
        .where(eq(categories.businessId, DEFAULT_BUSINESS_ID)),
      db.select().from(products).where(eq(products.businessId, DEFAULT_BUSINESS_ID)),
    ]);
  } catch (error: any) {
    console.error("Catalog products error:", error?.message ?? error);
    errors.push("products");
  }

  if (!settings.length && !categoryRows.length && !productRows.length && errors.length) {
    console.error("Catalog unavailable, returning empty catalog shell:", errors);
  }

  try {
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
        categories: categoryRows.map((c: any) => ({
          id: c.id,
          name: c.name,
          sortOrder: c.sortOrder,
        })),
        products: productRows.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          categoryId: p.categoryId,
          sellingPrice: Number(p.sellingPrice),
          imageUrl: p.imageUrl,
          isTaxable: p.isTaxable,
          available:
            p.status === "active" && p.isStockTracked
              ? Number(p.stockQuantity) > 0
              : p.status === "active",
          maxQuantity: p.isStockTracked ? Number(p.stockQuantity) : 99,
          unit: p.unit,
          lengthCm: p.lengthCm != null ? Number(p.lengthCm) : null,
          widthCm: p.widthCm != null ? Number(p.widthCm) : null,
          heightCm: p.heightCm != null ? Number(p.heightCm) : null,
          diameterCm: p.diameterCm != null ? Number(p.diameterCm) : null,
          dimensionUnit: p.dimensionUnit ?? "cm",
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
