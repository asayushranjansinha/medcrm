CREATE TYPE "public"."person_entity_type" AS ENUM('EMPLOYEE', 'STOCKIST', 'HOSPITAL', 'DOCTOR');--> statement-breakpoint
CREATE TYPE "public"."person_sales_role" AS ENUM('NSM', 'ZSM', 'RSM', 'ASM', 'MR', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."entity_hospital_type" AS ENUM('GOVT_HOSPITAL', 'PRIVATE_HOSPITAL', 'NURSING_HOME', 'CLINIC', 'PHARMACY');--> statement-breakpoint
CREATE TYPE "public"."dispatch_movement_type" AS ENUM('COMPANY_TO_STOCKIST', 'STOCKIST_TO_HOSPITAL', 'STOCKIST_TO_RETAILER', 'COMPANY_TO_HOSPITAL', 'SAMPLE_TO_DOCTOR', 'RETURN_FROM_STOCKIST', 'RETURN_FROM_HOSPITAL', 'ADJUSTMENT');--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "entity_type" "person_entity_type" DEFAULT 'DOCTOR' NOT NULL;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "role" "person_sales_role";--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "reporting_to_id" uuid;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "zone" varchar(120);--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "region" varchar(120);--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "stockist_code" varchar(80);--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "gstin" varchar(20);--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "credit_limit" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "outstanding_amount" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "entity_hospital_type" "entity_hospital_type";--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "bed_count" integer;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_reporting_to_id_persons_id_fk" FOREIGN KEY ("reporting_to_id") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "persons_entity_type_idx" ON "persons" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "persons_reporting_to_id_idx" ON "persons" USING btree ("reporting_to_id");--> statement-breakpoint
CREATE TABLE "stockist_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"current_qty" integer DEFAULT 0 NOT NULL,
	"last_movement_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stockist_inventory_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "stockist_inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "stockist_inventory_person_product_unique" UNIQUE("person_id","product_id")
);
--> statement-breakpoint
CREATE INDEX "stockist_inventory_person_id_idx" ON "stockist_inventory" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "stockist_inventory_product_id_idx" ON "stockist_inventory" USING btree ("product_id");--> statement-breakpoint
CREATE TABLE "hospital_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"current_qty" integer DEFAULT 0 NOT NULL,
	"last_movement_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hospital_inventory_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "hospital_inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "hospital_inventory_person_product_unique" UNIQUE("person_id","product_id")
);
--> statement-breakpoint
CREATE INDEX "hospital_inventory_person_id_idx" ON "hospital_inventory" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "hospital_inventory_product_id_idx" ON "hospital_inventory" USING btree ("product_id");--> statement-breakpoint
CREATE TABLE "monthly_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"product_id" uuid,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"target_value" numeric(14, 2) DEFAULT '0' NOT NULL,
	"achieved_value" numeric(14, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "monthly_targets_employee_id_persons_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "monthly_targets_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action,
	CONSTRAINT "monthly_targets_employee_product_month_year_unique" UNIQUE("employee_id","product_id","month","year")
);
--> statement-breakpoint
CREATE INDEX "monthly_targets_employee_id_idx" ON "monthly_targets" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "monthly_targets_month_year_idx" ON "monthly_targets" USING btree ("month","year");--> statement-breakpoint
ALTER TABLE "dispatches" ADD COLUMN "movement_type" "dispatch_movement_type";--> statement-breakpoint
UPDATE "dispatches" SET "movement_type" = CASE
  WHEN "dispatch_type" = 'SAMPLE' THEN 'SAMPLE_TO_DOCTOR'::"dispatch_movement_type"
  WHEN "dispatch_type" = 'RETURN' THEN 'RETURN_FROM_STOCKIST'::"dispatch_movement_type"
  ELSE 'COMPANY_TO_STOCKIST'::"dispatch_movement_type"
END;--> statement-breakpoint
ALTER TABLE "dispatches" ALTER COLUMN "movement_type" SET DEFAULT 'COMPANY_TO_STOCKIST';--> statement-breakpoint
ALTER TABLE "dispatches" ALTER COLUMN "movement_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dispatches" ADD COLUMN "from_entity_id" uuid;--> statement-breakpoint
ALTER TABLE "dispatches" ADD COLUMN "from_entity_type" varchar(80);--> statement-breakpoint
ALTER TABLE "dispatches" ADD COLUMN "to_entity_id" uuid;--> statement-breakpoint
ALTER TABLE "dispatches" ADD COLUMN "to_entity_type" varchar(80);--> statement-breakpoint
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_from_entity_id_persons_id_fk" FOREIGN KEY ("from_entity_id") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_to_entity_id_persons_id_fk" FOREIGN KEY ("to_entity_id") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dispatches_movement_type_idx" ON "dispatches" USING btree ("movement_type");--> statement-breakpoint
CREATE INDEX "dispatches_from_entity_id_idx" ON "dispatches" USING btree ("from_entity_id");--> statement-breakpoint
CREATE INDEX "dispatches_to_entity_id_idx" ON "dispatches" USING btree ("to_entity_id");
