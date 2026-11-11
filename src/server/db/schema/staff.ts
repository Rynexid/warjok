import {
  boolean,
  check,
  index,
  numeric,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { DEFAULT_BUSINESS_ID, staffSchema } from "./schema";
import { businesses, roles, stores } from "./core";

const s = staffSchema;

/**
 * Data operasional staf. Kredensial tetap di Neon Auth; `UserId` hanya
 * menghubungkan staf ke identitas login jika ada.
 */
export const staff = s.table(
  "Staff",
  {
    id: text("Id").primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .default(DEFAULT_BUSINESS_ID)
      .references(() => businesses.id, { onDelete: "cascade" }),
    storeId: uuid("StoreId").references(() => stores.id, {
      onDelete: "set null",
    }),
    userId: text("UserId"),
    name: text("Name").notNull(),
    email: text("Email").notNull(),
    role: text("Role")
      .notNull()
      .default("cashier")
      .references(() => roles.code, { onDelete: "restrict" }),
    status: text("Status").notNull().default("active"),
    joinedAt: timestamp("JoinedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastActive: timestamp("LastActive", { withTimezone: true }),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("DeletedAt", { withTimezone: true }),
  },
  (t) => [
    unique("Staff_BusinessId_Email_key").on(t.businessId, t.email),
    index("Staff_BusinessId_idx").on(t.businessId),
    index("Staff_StoreId_idx").on(t.storeId),
    index("Staff_UserId_idx").on(t.userId),
    index("Staff_Role_idx").on(t.role),
    index("Staff_Status_idx").on(t.status),
    check(
      "Staff_Status_check",
      sql`${t.status} in ('active', 'inactive', 'suspended')`
    ),
  ]
);

/** Shift kerja staf. */
export const shifts = s.table(
  "Shifts",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .default(DEFAULT_BUSINESS_ID)
      .references(() => businesses.id, { onDelete: "cascade" }),
    storeId: uuid("StoreId")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    staffId: text("StaffId")
      .notNull()
      .references(() => staff.id, { onDelete: "restrict" }),
    startTime: timestamp("StartTime", { withTimezone: true }).notNull(),
    endTime: timestamp("EndTime", { withTimezone: true }),
    status: text("Status").notNull().default("scheduled"),
    notes: text("Notes"),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("Shifts_BusinessId_idx").on(t.businessId),
    index("Shifts_StoreId_idx").on(t.storeId),
    index("Shifts_StaffId_idx").on(t.staffId),
    index("Shifts_StartTime_idx").on(t.startTime),
    check(
      "Shifts_Status_check",
      sql`${t.status} in ('scheduled', 'active', 'completed', 'cancelled')`
    ),
  ]
);

/** Kasir fisik / titik pembayaran. */
export const cashRegisters = s.table(
  "CashRegisters",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .default(DEFAULT_BUSINESS_ID)
      .references(() => businesses.id, { onDelete: "cascade" }),
    storeId: uuid("StoreId")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    name: text("Name").notNull(),
    code: text("Code").notNull(),
    isActive: boolean("IsActive").notNull().default(true),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("CashRegisters_StoreId_Code_key").on(t.storeId, t.code),
    index("CashRegisters_BusinessId_idx").on(t.businessId),
    index("CashRegisters_StoreId_idx").on(t.storeId),
  ]
);

/** Sesi buka/tutup kasir. */
export const cashRegisterSessions = s.table(
  "CashRegisterSessions",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    cashRegisterId: uuid("CashRegisterId")
      .notNull()
      .references(() => cashRegisters.id, { onDelete: "restrict" }),
    storeId: uuid("StoreId")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    openedByStaffId: text("OpenedByStaffId")
      .notNull()
      .references(() => staff.id, { onDelete: "restrict" }),
    closedByStaffId: text("ClosedByStaffId").references(() => staff.id, {
      onDelete: "set null",
    }),
    openingBalance: numeric("OpeningBalance", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    closingBalance: numeric("ClosingBalance", { precision: 14, scale: 2 }),
    expectedBalance: numeric("ExpectedBalance", { precision: 14, scale: 2 }),
    difference: numeric("Difference", { precision: 14, scale: 2 }),
    status: text("Status").notNull().default("open"),
    openedAt: timestamp("OpenedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    closedAt: timestamp("ClosedAt", { withTimezone: true }),
    notes: text("Notes"),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("CashRegisterSessions_CashRegisterId_idx").on(t.cashRegisterId),
    index("CashRegisterSessions_StoreId_idx").on(t.storeId),
    index("CashRegisterSessions_OpenedByStaffId_idx").on(t.openedByStaffId),
    index("CashRegisterSessions_Status_idx").on(t.status),
    check(
      "CashRegisterSessions_Status_check",
      sql`${t.status} in ('open', 'closed', 'voided')`
    ),
    check(
      "CashRegisterSessions_OpeningBalance_check",
      sql`${t.openingBalance} >= 0`
    ),
  ]
);

/** Cash-in / cash-out di dalam sesi kasir. */
export const cashMovements = s.table(
  "CashMovements",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    sessionId: uuid("SessionId")
      .notNull()
      .references(() => cashRegisterSessions.id, { onDelete: "cascade" }),
    movementType: text("MovementType").notNull(),
    amount: numeric("Amount", { precision: 14, scale: 2 }).notNull(),
    reason: text("Reason").notNull(),
    staffId: text("StaffId").references(() => staff.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("CashMovements_SessionId_idx").on(t.sessionId),
    index("CashMovements_StaffId_idx").on(t.staffId),
    index("CashMovements_CreatedAt_idx").on(t.createdAt),
    check(
      "CashMovements_MovementType_check",
      sql`${t.movementType} in ('in', 'out')`
    ),
    check("CashMovements_Amount_check", sql`${t.amount} >= 0`),
  ]
);

/** Riwayat masuk staf. Setiap entri mencatat satu kali staf masuk ke sistem. */
export const staffLoginSessions = s.table(
  "StaffLoginSessions",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    staffId: text("StaffId")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    ipAddress: text("IpAddress"),
    userAgent: text("UserAgent"),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("StaffLoginSessions_StaffId_idx").on(t.staffId),
    index("StaffLoginSessions_CreatedAt_idx").on(t.createdAt),
  ]
);
