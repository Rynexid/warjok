import {
  boolean,
  check,
  index,
  integer,
  numeric,
  text,
  timestamp,
  unique,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { DEFAULT_BUSINESS_ID, productsSchema } from "./schema";
import { businesses, stores } from "./core";

const s = productsSchema;

/** Kategori produk. Mendukung kategori bertingkat. */
export const categories = s.table(
  "Categories",
  {
    id: text("Id").primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .default(DEFAULT_BUSINESS_ID)
      .references(() => businesses.id, { onDelete: "cascade" }),
    parentCategoryId: text("ParentCategoryId").references(
      (): AnyPgColumn => categories.id,
      { onDelete: "set null" },
    ),
    name: text("Name").notNull(),
    description: text("Description"),
    sortOrder: integer("SortOrder").notNull().default(0),
    status: text("Status").notNull().default("active"),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("DeletedAt", { withTimezone: true }),
  },
  (t) => [
    index("Categories_BusinessId_idx").on(t.businessId),
    index("Categories_ParentCategoryId_idx").on(t.parentCategoryId),
    index("Categories_Name_idx").on(t.name),
    index("Categories_Status_idx").on(t.status),
    check(
      "Categories_Status_check",
      sql`${t.status} in ('active', 'archived')`,
    ),
  ],
);

/** Produk katalog. SKU unik dalam lingkup bisnis. */
export const products = s.table(
  "Products",
  {
    id: text("Id").primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .default(DEFAULT_BUSINESS_ID)
      .references(() => businesses.id, { onDelete: "cascade" }),
    categoryId: text("CategoryId").references(() => categories.id, {
      onDelete: "set null",
    }),
    name: text("Name").notNull(),
    description: text("Description"),
    sku: text("Sku").notNull(),
    barcode: text("Barcode"),
    sellingPrice: numeric("SellingPrice", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    costPrice: numeric("CostPrice", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    stockQuantity: integer("StockQuantity").notNull().default(0),
    minimumStock: integer("MinimumStock").notNull().default(0),
    unit: text("Unit").notNull().default("pcs"),
    imageUrl: text("ImageUrl"),
    isTaxable: boolean("IsTaxable").notNull().default(true),
    isStockTracked: boolean("IsStockTracked").notNull().default(true),
    status: text("Status").notNull().default("active"),
    /** Dimensi produk (cm) untuk ditampilkan saat pemesan memesan. */
    lengthCm: numeric("LengthCm", { precision: 10, scale: 2 }),
    widthCm: numeric("WidthCm", { precision: 10, scale: 2 }),
    heightCm: numeric("HeightCm", { precision: 10, scale: 2 }),
    diameterCm: numeric("DiameterCm", { precision: 10, scale: 2 }),
    dimensionUnit: text("DimensionUnit").notNull().default("cm"),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    archivedAt: timestamp("ArchivedAt", { withTimezone: true }),
    deletedAt: timestamp("DeletedAt", { withTimezone: true }),
  },
  (t) => [
    unique("Products_BusinessId_Sku_key").on(t.businessId, t.sku),
    index("Products_BusinessId_idx").on(t.businessId),
    index("Products_CategoryId_idx").on(t.categoryId),
    index("Products_Barcode_idx").on(t.barcode),
    index("Products_Name_idx").on(t.name),
    index("Products_Status_idx").on(t.status),
    check(
      "Products_Status_check",
      sql`${t.status} in ('active', 'archived', 'discontinued')`,
    ),
    check("Products_SellingPrice_check", sql`${t.sellingPrice} >= 0`),
    check("Products_CostPrice_check", sql`${t.costPrice} >= 0`),
    check("Products_StockQuantity_check", sql`${t.stockQuantity} >= 0`),
    check("Products_MinimumStock_check", sql`${t.minimumStock} >= 0`),
  ],
);

/** Varian produk (mis. ukuran, rasa). */
export const productVariants = s.table(
  "ProductVariants",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .default(DEFAULT_BUSINESS_ID)
      .references(() => businesses.id, { onDelete: "cascade" }),
    productId: text("ProductId")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("Name").notNull(),
    sku: text("Sku").notNull(),
    barcode: text("Barcode"),
    sellingPrice: numeric("SellingPrice", { precision: 14, scale: 2 }),
    costPrice: numeric("CostPrice", { precision: 14, scale: 2 }),
    isActive: boolean("IsActive").notNull().default(true),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("ProductVariants_BusinessId_Sku_key").on(t.businessId, t.sku),
    index("ProductVariants_ProductId_idx").on(t.productId),
    index("ProductVariants_Barcode_idx").on(t.barcode),
  ],
);

/** Satuan produk dan faktor konversinya. */
export const productUnits = s.table(
  "ProductUnits",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    productId: text("ProductId")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("Name").notNull(),
    abbreviation: text("Abbreviation").notNull(),
    conversionFactor: numeric("ConversionFactor", { precision: 12, scale: 4 })
      .notNull()
      .default("1"),
    isBase: boolean("IsBase").notNull().default(false),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("ProductUnits_ProductId_Name_key").on(t.productId, t.name),
    index("ProductUnits_ProductId_idx").on(t.productId),
    check(
      "ProductUnits_ConversionFactor_check",
      sql`${t.conversionFactor} > 0`,
    ),
  ],
);

/** Barcode tambahan per produk. */
export const productBarcodes = s.table(
  "ProductBarcodes",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    productId: text("ProductId")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    barcode: text("Barcode").notNull(),
    isPrimary: boolean("IsPrimary").notNull().default(false),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("ProductBarcodes_Barcode_key").on(t.barcode),
    index("ProductBarcodes_ProductId_idx").on(t.productId),
  ],
);

/** Harga produk per toko / tipe harga. */
export const productPrices = s.table(
  "ProductPrices",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    productId: text("ProductId")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    storeId: uuid("StoreId").references(() => stores.id, {
      onDelete: "set null",
    }),
    priceType: text("PriceType").notNull().default("retail"),
    sellingPrice: numeric("SellingPrice", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    costPrice: numeric("CostPrice", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    startsAt: timestamp("StartsAt", { withTimezone: true }),
    endsAt: timestamp("EndsAt", { withTimezone: true }),
    isActive: boolean("IsActive").notNull().default(true),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("ProductPrices_ProductId_idx").on(t.productId),
    index("ProductPrices_StoreId_idx").on(t.storeId),
    index("ProductPrices_PriceType_idx").on(t.priceType),
    check(
      "ProductPrices_PriceType_check",
      sql`${t.priceType} in ('retail', 'wholesale', 'member')`,
    ),
    check("ProductPrices_SellingPrice_check", sql`${t.sellingPrice} >= 0`),
    check("ProductPrices_CostPrice_check", sql`${t.costPrice} >= 0`),
  ],
);
