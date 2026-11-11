import {
  bigint,
  index,
  jsonb,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { DEFAULT_BUSINESS_ID, auditSchema } from "./schema";
import { businesses } from "./core";

const s = auditSchema;

/** Notifikasi in-app per user. */
export const notifications = s.table(
  "Notifications",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .default(DEFAULT_BUSINESS_ID)
      .references(() => businesses.id, { onDelete: "cascade" }),
    userId: text("UserId"),
    type: text("Type").notNull(),
    title: text("Title").notNull(),
    body: text("Body").notNull(),
    readAt: timestamp("ReadAt", { withTimezone: true }),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("Notifications_BusinessId_idx").on(t.businessId),
    index("Notifications_UserId_idx").on(t.userId),
    index("Notifications_ReadAt_idx").on(t.readAt),
    index("Notifications_CreatedAt_idx").on(t.createdAt),
  ]
);

/** Audit trail tindakan administratif. */
export const auditLogs = s.table(
  "AuditLogs",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .default(DEFAULT_BUSINESS_ID)
      .references(() => businesses.id, { onDelete: "cascade" }),
    userId: text("UserId"),
    action: text("Action").notNull(),
    entityType: text("EntityType").notNull(),
    entityId: text("EntityId"),
    oldValues: jsonb("OldValues").$type<Record<string, unknown>>(),
    newValues: jsonb("NewValues").$type<Record<string, unknown>>(),
    ipAddress: text("IpAddress"),
    userAgent: text("UserAgent"),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("AuditLogs_BusinessId_idx").on(t.businessId),
    index("AuditLogs_UserId_idx").on(t.userId),
    index("AuditLogs_EntityType_EntityId_idx").on(t.entityType, t.entityId),
    index("AuditLogs_CreatedAt_idx").on(t.createdAt),
  ]
);

/** Metadata file; isi file disimpan di object storage, bukan filesystem lokal. */
export const fileAttachments = s.table(
  "FileAttachments",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .default(DEFAULT_BUSINESS_ID)
      .references(() => businesses.id, { onDelete: "cascade" }),
    entityType: text("EntityType").notNull(),
    entityId: text("EntityId").notNull(),
    fileName: text("FileName").notNull(),
    mimeType: text("MimeType").notNull(),
    sizeBytes: bigint("SizeBytes", { mode: "number" }).notNull().default(0),
    storageProvider: text("StorageProvider").notNull().default("neon"),
    storageKey: text("StorageKey").notNull(),
    url: text("Url"),
    uploadedByUserId: text("UploadedByUserId"),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("FileAttachments_BusinessId_idx").on(t.businessId),
    index("FileAttachments_EntityType_EntityId_idx").on(
      t.entityType,
      t.entityId
    ),
    index("FileAttachments_StorageKey_idx").on(t.storageKey),
  ]
);

/** Riwayat login per user. Setiap user hanya melihat aktivitas miliknya. */
export const loginActivities = s.table(
  "LoginActivities",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .default(DEFAULT_BUSINESS_ID)
      .references(() => businesses.id, { onDelete: "cascade" }),
    userId: text("UserId").notNull(),
    status: text("Status").notNull().default("success"),
    ipAddress: text("IpAddress"),
    userAgent: text("UserAgent"),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("LoginActivities_BusinessId_idx").on(t.businessId),
    index("LoginActivities_UserId_idx").on(t.userId),
    index("LoginActivities_CreatedAt_idx").on(t.createdAt),
  ]
);
