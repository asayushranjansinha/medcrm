CREATE TYPE "public"."dispatch_status" AS ENUM('PENDING', 'DISPATCHED', 'DELIVERED', 'RETURNED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."dispatch_type" AS ENUM('SAMPLE', 'SALE', 'PROMOTIONAL', 'RETURN');--> statement-breakpoint
CREATE TYPE "public"."hospital_type" AS ENUM('GOVT', 'PRIVATE', 'CLINIC');--> statement-breakpoint
CREATE TYPE "public"."person_category" AS ENUM('A', 'B', 'C');--> statement-breakpoint
CREATE TYPE "public"."person_designation" AS ENUM('DOCTOR', 'PHARMACIST', 'NURSE', 'HOSPITAL_ADMIN', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."product_category" AS ENUM('TABLET', 'CAPSULE', 'INJECTION', 'SYRUP', 'DEVICE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'MANAGER', 'MR');--> statement-breakpoint
CREATE TYPE "public"."visit_purpose" AS ENUM('DETAILING', 'SAMPLE_DROP', 'FOLLOW_UP', 'ORDER_COLLECTION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."visit_status" AS ENUM('PLANNED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "dispatches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"product_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"dispatch_type" "dispatch_type" NOT NULL,
	"quantity" integer NOT NULL,
	"batch_number" varchar(80),
	"dispatch_date" timestamp with time zone NOT NULL,
	"expected_delivery_date" timestamp with time zone,
	"actual_delivery_date" timestamp with time zone,
	"status" "dispatch_status" DEFAULT 'PENDING' NOT NULL,
	"invoice_number" varchar(80),
	"total_value" numeric(14, 2),
	"address" text,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"name" varchar(200) NOT NULL,
	"designation" "person_designation" NOT NULL,
	"specialty" varchar(120),
	"qualification" varchar(120),
	"hospital_name" varchar(200) NOT NULL,
	"hospital_type" "hospital_type" NOT NULL,
	"address" text,
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"pincode" varchar(10),
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"category" "person_category" NOT NULL,
	"territory" varchar(120),
	"assigned_to_user_id" uuid,
	"last_visit_date" timestamp with time zone,
	"total_visits" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"name" varchar(200) NOT NULL,
	"generic_name" varchar(200) NOT NULL,
	"category" "product_category" NOT NULL,
	"description" text,
	"mrp" numeric(12, 2) NOT NULL,
	"ptr" numeric(12, 2) NOT NULL,
	"pts" numeric(12, 2),
	"manufacturer" varchar(200) NOT NULL,
	"batch_number" varchar(80),
	"expiry_date" timestamp with time zone,
	"stock_qty" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"name" varchar(200) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'MR' NOT NULL,
	"territory" varchar(120),
	"phone" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"person_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"visit_date" timestamp with time zone NOT NULL,
	"purpose" "visit_purpose" NOT NULL,
	"products_discussed" text[],
	"samples_given" jsonb,
	"feedback" text,
	"order_taken" boolean DEFAULT false NOT NULL,
	"order_value" numeric(14, 2),
	"next_visit_date" timestamp with time zone,
	"status" "visit_status" DEFAULT 'PLANNED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dispatches_product_id_idx" ON "dispatches" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "dispatches_person_id_idx" ON "dispatches" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "dispatches_user_id_idx" ON "dispatches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "dispatches_dispatch_date_idx" ON "dispatches" USING btree ("dispatch_date");--> statement-breakpoint
CREATE INDEX "dispatches_status_idx" ON "dispatches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "persons_city_idx" ON "persons" USING btree ("city");--> statement-breakpoint
CREATE INDEX "persons_state_idx" ON "persons" USING btree ("state");--> statement-breakpoint
CREATE INDEX "persons_territory_idx" ON "persons" USING btree ("territory");--> statement-breakpoint
CREATE INDEX "persons_category_idx" ON "persons" USING btree ("category");--> statement-breakpoint
CREATE INDEX "persons_assigned_to_user_id_idx" ON "persons" USING btree ("assigned_to_user_id");--> statement-breakpoint
CREATE INDEX "persons_designation_idx" ON "persons" USING btree ("designation");--> statement-breakpoint
CREATE INDEX "visits_person_id_idx" ON "visits" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "visits_user_id_idx" ON "visits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "visits_visit_date_idx" ON "visits" USING btree ("visit_date");--> statement-breakpoint
CREATE INDEX "visits_status_idx" ON "visits" USING btree ("status");