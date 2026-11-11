CREATE TABLE "audit"."LoginActivities" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"BusinessId" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL,
	"UserId" text NOT NULL,
	"Status" text DEFAULT 'success' NOT NULL,
	"IpAddress" text,
	"UserAgent" text,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit"."LoginActivities" ADD CONSTRAINT "LoginActivities_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "core"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "LoginActivities_BusinessId_idx" ON "audit"."LoginActivities" USING btree ("BusinessId");--> statement-breakpoint
CREATE INDEX "LoginActivities_UserId_idx" ON "audit"."LoginActivities" USING btree ("UserId");--> statement-breakpoint
CREATE INDEX "LoginActivities_CreatedAt_idx" ON "audit"."LoginActivities" USING btree ("CreatedAt");