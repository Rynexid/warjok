CREATE TABLE "lookups"."StorefrontOrders" (
	"Id" text PRIMARY KEY NOT NULL,
	"OrderNumber" text NOT NULL,
	"Status" text DEFAULT 'pending' NOT NULL,
	"PaymentStatus" text DEFAULT 'pending' NOT NULL,
	"OrderType" text DEFAULT 'takeaway' NOT NULL,
	"TableNumber" text,
	"GuestName" text NOT NULL,
	"GuestPhone" text NOT NULL,
	"Notes" text,
	"Subtotal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"DiscountTotal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"TaxTotal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"GrandTotal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"Items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"PaymentMethod" text,
	"PaymentInstructions" jsonb,
	"ProofSubmitted" boolean DEFAULT false NOT NULL,
	"ProofUrl" text,
	"PaidAt" timestamp with time zone,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "StorefrontOrders_OrderNumber_key" UNIQUE("OrderNumber"),
	CONSTRAINT "StorefrontOrders_Status_check" CHECK ("lookups"."StorefrontOrders"."Status" in ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
	CONSTRAINT "StorefrontOrders_PaymentStatus_check" CHECK ("lookups"."StorefrontOrders"."PaymentStatus" in ('pending', 'awaiting_verification', 'verified', 'paid', 'rejected', 'expired', 'cancelled')),
	CONSTRAINT "StorefrontOrders_OrderType_check" CHECK ("lookups"."StorefrontOrders"."OrderType" in ('dine-in', 'takeaway', 'delivery')),
	CONSTRAINT "StorefrontOrders_Subtotal_check" CHECK ("lookups"."StorefrontOrders"."Subtotal" >= 0),
	CONSTRAINT "StorefrontOrders_DiscountTotal_check" CHECK ("lookups"."StorefrontOrders"."DiscountTotal" >= 0),
	CONSTRAINT "StorefrontOrders_TaxTotal_check" CHECK ("lookups"."StorefrontOrders"."TaxTotal" >= 0),
	CONSTRAINT "StorefrontOrders_GrandTotal_check" CHECK ("lookups"."StorefrontOrders"."GrandTotal" >= 0)
);
--> statement-breakpoint
CREATE INDEX "StorefrontOrders_GuestPhone_idx" ON "lookups"."StorefrontOrders" USING btree ("GuestPhone");--> statement-breakpoint
CREATE INDEX "StorefrontOrders_Status_idx" ON "lookups"."StorefrontOrders" USING btree ("Status");--> statement-breakpoint
CREATE INDEX "StorefrontOrders_PaymentStatus_idx" ON "lookups"."StorefrontOrders" USING btree ("PaymentStatus");--> statement-breakpoint
CREATE INDEX "StorefrontOrders_CreatedAt_idx" ON "lookups"."StorefrontOrders" USING btree ("CreatedAt");