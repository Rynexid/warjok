--> statement-breakpoint
ALTER TABLE "products"."Products" ADD COLUMN "LengthCm" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products"."Products" ADD COLUMN "WidthCm" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products"."Products" ADD COLUMN "HeightCm" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products"."Products" ADD COLUMN "DiameterCm" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products"."Products" ADD COLUMN "DimensionUnit" text DEFAULT 'cm' NOT NULL;
