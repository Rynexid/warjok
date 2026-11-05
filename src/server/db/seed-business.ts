import { and, eq } from "drizzle-orm";

import { createSeedData } from "../../lib/business-seed";
import { db, pool } from "./index";
import {
  businesses,
  businessSettings,
  categories,
  customers,
  DEFAULT_BUSINESS_ID,
  DEFAULT_STORE_ID,
  inventory,
  paymentMethods,
  payments,
  permissions,
  products,
  receiptSettings,
  rolePermissions,
  roles,
  staff,
  stockMovements,
  storeSettings,
  stores,
  taxRates,
  transactionDiscounts,
  transactionItems,
  transactions,
} from "./schema";

const data = createSeedData();

const money = (value: number) => value.toFixed(2);
const date = (value: string) => new Date(value);

const TAX_RATE_ID = "00000000-0000-0000-0000-000000000003";
const RECEIPT_SETTINGS_ID = "00000000-0000-0000-0000-000000000004";
const STORE_SETTINGS_ID = "00000000-0000-0000-0000-000000000005";

const ROLE_ROWS = [
  { code: "user", name: "User", rank: 0, description: "Akun dasar" },
  { code: "cashier", name: "Cashier", rank: 1, description: "Operasional kasir" },
  { code: "manager", name: "Manager", rank: 2, description: "Operasional toko" },
  { code: "admin", name: "Admin", rank: 3, description: "Administrasi bisnis" },
  { code: "owner", name: "Owner", rank: 4, description: "Pemilik bisnis" },
];

const PERMISSION_ROWS = [
  { code: "category.create", name: "Buat kategori", module: "categories" },
  { code: "category.update", name: "Ubah kategori", module: "categories" },
  { code: "category.delete", name: "Hapus kategori", module: "categories" },
  { code: "product.create", name: "Buat produk", module: "products" },
  { code: "product.update", name: "Ubah produk", module: "products" },
  { code: "product.status", name: "Ubah status produk", module: "products" },
  { code: "product.delete", name: "Hapus produk", module: "products" },
  { code: "customer.create", name: "Buat pelanggan", module: "customers" },
  { code: "customer.update", name: "Ubah pelanggan", module: "customers" },
  { code: "customer.delete", name: "Hapus pelanggan", module: "customers" },
  { code: "staff.create", name: "Buat staf", module: "staff" },
  { code: "staff.update", name: "Ubah staf", module: "staff" },
  { code: "staff.delete", name: "Hapus staf", module: "staff" },
  { code: "stock.adjust", name: "Sesuaikan stok", module: "inventory" },
  { code: "transaction.void", name: "Batalkan transaksi", module: "transactions" },
  { code: "settings.update", name: "Ubah pengaturan", module: "settings" },
];

function permissionsForRole(role: string) {
  if (role === "owner") return PERMISSION_ROWS.map((p) => p.code);
  if (role === "admin") {
    return PERMISSION_ROWS.filter((p) => p.code !== "staff.delete").map(
      (p) => p.code
    );
  }
  if (role === "manager") {
    return PERMISSION_ROWS.filter(
      (p) =>
        !p.code.endsWith(".delete") &&
        p.code !== "staff.create" &&
        p.code !== "staff.update" &&
        p.code !== "settings.update"
    ).map((p) => p.code);
  }
  if (role === "cashier") return ["stock.adjust"];
  return [];
}

async function seed() {
  await db.transaction(async (tx) => {
    await tx
      .insert(businesses)
      .values({
        id: DEFAULT_BUSINESS_ID,
        name: data.settings.businessName,
        slug: "warjok",
        legalName: data.settings.businessName,
        currency: data.settings.currency,
        timezone: data.settings.timezone,
        status: "active",
      })
      .onConflictDoNothing();

    await tx
      .insert(stores)
      .values({
        id: DEFAULT_STORE_ID,
        businessId: DEFAULT_BUSINESS_ID,
        name: "Toko Utama",
        code: "MAIN",
        address: data.settings.address,
        phone: data.settings.phone,
        email: data.settings.email,
        timezone: data.settings.timezone,
        isActive: true,
      })
      .onConflictDoNothing();

    await tx
      .insert(roles)
      .values(
        ROLE_ROWS.map((role) => ({
          code: role.code,
          name: role.name,
          description: role.description,
          rank: role.rank,
          isSystem: true,
        }))
      )
      .onConflictDoNothing();

    await tx
      .insert(permissions)
      .values(
        PERMISSION_ROWS.map((permission) => ({
          code: permission.code,
          name: permission.name,
          module: permission.module,
          description: permission.name,
        }))
      )
      .onConflictDoNothing();

    await tx
      .insert(rolePermissions)
      .values(
        ROLE_ROWS.flatMap((role) =>
          permissionsForRole(role.code).map((permissionCode) => ({
            roleCode: role.code,
            permissionCode,
          }))
        )
      )
      .onConflictDoNothing();

    await tx
      .insert(paymentMethods)
      .values([
        { code: "cash", name: "Tunai", sortOrder: 1 },
        { code: "qris", name: "QRIS", sortOrder: 2, requiresReference: true },
        { code: "card", name: "Kartu", sortOrder: 3, requiresReference: true },
      ])
      .onConflictDoNothing();

    await tx
      .insert(taxRates)
      .values({
        id: TAX_RATE_ID,
        businessId: DEFAULT_BUSINESS_ID,
        name: "PPN",
        rate: String(data.settings.taxRate),
        isDefault: true,
        isActive: true,
      })
      .onConflictDoNothing();

    await tx
      .insert(businessSettings)
      .values({
        id: "default",
        businessId: DEFAULT_BUSINESS_ID,
        businessName: data.settings.businessName,
        address: data.settings.address,
        phone: data.settings.phone,
        email: data.settings.email,
        currency: data.settings.currency,
        timezone: data.settings.timezone,
        taxRate: String(data.settings.taxRate),
        memberDiscountRate: String(data.settings.memberDiscountRate),
        lowStockThreshold: data.settings.lowStockThreshold,
        legacyReceiptFooter: data.settings.receiptFooter,
      })
      .onConflictDoNothing();

    await tx
      .insert(receiptSettings)
      .values({
        id: RECEIPT_SETTINGS_ID,
        businessId: DEFAULT_BUSINESS_ID,
        storeId: DEFAULT_STORE_ID,
        header: data.settings.businessName,
        footer: data.settings.receiptFooter,
        showTax: true,
        showCashier: true,
        paperWidth: 58,
      })
      .onConflictDoNothing();

    await tx
      .insert(storeSettings)
      .values({
        id: STORE_SETTINGS_ID,
        businessId: DEFAULT_BUSINESS_ID,
        storeId: DEFAULT_STORE_ID,
        lowStockThreshold: data.settings.lowStockThreshold,
        taxRate: String(data.settings.taxRate),
      })
      .onConflictDoNothing();

    await tx
      .insert(categories)
      .values(
        data.categories.map((category) => ({
          id: category.id,
          businessId: DEFAULT_BUSINESS_ID,
          name: category.name,
          description: category.description ?? null,
          status: category.status,
          createdAt: date(category.createdAt),
          updatedAt: date(category.createdAt),
        }))
      )
      .onConflictDoNothing();

    await tx
      .insert(products)
      .values(
        data.products.map((product) => ({
          id: product.id,
          businessId: DEFAULT_BUSINESS_ID,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode ?? null,
          categoryId: product.categoryId,
          sellingPrice: money(product.price),
          costPrice: money(product.cost),
          stockQuantity: product.stock,
          minimumStock: product.minStock,
          unit: product.unit,
          imageUrl: product.imageUrl ?? null,
          status: product.status,
          createdAt: date(product.createdAt),
          updatedAt: date(product.createdAt),
        }))
      )
      .onConflictDoNothing();

    await tx
      .insert(inventory)
      .values(
        data.products.map((product) => ({
          businessId: DEFAULT_BUSINESS_ID,
          storeId: DEFAULT_STORE_ID,
          productId: product.id,
          stockQuantity: product.stock,
          minimumStock: product.minStock,
        }))
      )
      .onConflictDoNothing();

    await tx
      .insert(customers)
      .values(
        data.customers.map((customer) => ({
          id: customer.id,
          businessId: DEFAULT_BUSINESS_ID,
          name: customer.name,
          phone: customer.phone,
          email: customer.email ?? null,
          notes: customer.notes ?? null,
          joinedAt: date(customer.joinedAt),
          updatedAt: date(customer.joinedAt),
        }))
      )
      .onConflictDoNothing();

    await tx
      .insert(staff)
      .values(
        data.staff.map((member) => ({
          id: member.id,
          businessId: DEFAULT_BUSINESS_ID,
          storeId: DEFAULT_STORE_ID,
          name: member.name,
          email: member.email,
          role: member.role,
          status: member.status,
          joinedAt: date(member.joinedAt),
          lastActive: member.lastActive ? date(member.lastActive) : null,
          updatedAt: date(member.joinedAt),
        }))
      )
      .onConflictDoNothing();

    const productById = new Map(data.products.map((product) => [product.id, product]));

    for (const transaction of data.transactions) {
      await tx
        .insert(transactions)
        .values({
          id: transaction.id,
          businessId: DEFAULT_BUSINESS_ID,
          storeId: DEFAULT_STORE_ID,
          transactionNumber: transaction.number,
          cashierId: null,
          cashierName: transaction.cashier,
          customerId: transaction.customerId ?? null,
          customerName: transaction.customerName,
          orderType: transaction.orderType,
          tableNumber: transaction.tableNumber ?? null,
          paymentMethod: transaction.paymentMethod,
          paymentStatus: transaction.status === "voided" ? "voided" : "paid",
          taxRateId: TAX_RATE_ID,
          subtotal: money(transaction.subtotal),
          discountTotal: money(transaction.discount),
          taxTotal: money(transaction.tax),
          grandTotal: money(transaction.total),
          amountPaid:
            transaction.cashReceived != null
              ? money(transaction.cashReceived)
              : money(transaction.total),
          changeAmount:
            transaction.change != null ? money(transaction.change) : "0.00",
          status: transaction.status,
          voidReason: transaction.voidReason ?? null,
          createdAt: date(transaction.createdAt),
          updatedAt: date(transaction.createdAt),
        })
        .onConflictDoNothing();

      if (transaction.items.length > 0) {
        await tx
          .insert(transactionItems)
          .values(
            transaction.items.map((item, index) => ({
              id: `${transaction.id}-item-${index + 1}`,
              transactionId: transaction.id,
              productId: item.productId,
              productName: item.name,
              sku: item.sku,
              quantity: item.quantity,
              unitPrice: money(item.unitPrice),
              lineTotal: money(item.lineTotal),
              costPrice: money(productById.get(item.productId)?.cost ?? 0),
            }))
          )
          .onConflictDoNothing();
      }

      const [existingPayment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.transactionId, transaction.id))
        .limit(1);
      if (!existingPayment) {
        await tx.insert(payments).values({
          transactionId: transaction.id,
          paymentMethod: transaction.paymentMethod,
          amount:
            transaction.cashReceived != null
              ? money(transaction.cashReceived)
              : money(transaction.total),
          status: "completed",
          paidAt: date(transaction.createdAt),
        });
      }

      if (transaction.discount > 0) {
        const [existingDiscount] = await tx
          .select()
          .from(transactionDiscounts)
          .where(
            and(
              eq(transactionDiscounts.transactionId, transaction.id),
              eq(transactionDiscounts.name, "Diskon seed")
            )
          )
          .limit(1);
        if (!existingDiscount) {
          await tx.insert(transactionDiscounts).values({
            transactionId: transaction.id,
            name: "Diskon seed",
            type: "fixed",
            value: money(transaction.discount),
            amount: money(transaction.discount),
          });
        }
      }
    }

    await tx
      .insert(stockMovements)
      .values(
        data.movements.map((movement) => ({
          id: movement.id,
          businessId: DEFAULT_BUSINESS_ID,
          storeId: DEFAULT_STORE_ID,
          productId: movement.productId,
          productName: movement.productName,
          movementType: movement.type,
          quantity: movement.quantity,
          stockAfter: movement.stockAfter,
          note: movement.note,
          staffName: movement.staff,
          referenceType: "seed",
          referenceId: movement.id,
          createdAt: date(movement.createdAt),
        }))
      )
      .onConflictDoNothing();
  });

  console.log(
    `Seeded ${data.categories.length} categories, ${data.products.length} products, ` +
      `${data.customers.length} customers, ${data.staff.length} staff, ` +
      `${data.transactions.length} transactions, ${data.movements.length} movements.`
  );
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
