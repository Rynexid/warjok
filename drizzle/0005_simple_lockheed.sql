CREATE TABLE "staff"."StaffLoginSessions" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"StaffId" text NOT NULL,
	"IpAddress" text,
	"UserAgent" text,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "staff"."StaffLoginSessions" ADD CONSTRAINT "StaffLoginSessions_StaffId_Staff_Id_fk" FOREIGN KEY ("StaffId") REFERENCES "staff"."Staff"("Id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "StaffLoginSessions_StaffId_idx" ON "staff"."StaffLoginSessions" USING btree ("StaffId");--> statement-breakpoint
CREATE INDEX "StaffLoginSessions_CreatedAt_idx" ON "staff"."StaffLoginSessions" USING btree ("CreatedAt");