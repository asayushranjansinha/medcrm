CREATE TYPE "public"."visit_outcome" AS ENUM('POSITIVE', 'NEUTRAL', 'NEGATIVE', 'NOT_MET');--> statement-breakpoint
CREATE TYPE "public"."visit_type" AS ENUM('DOCTOR_VISIT', 'STOCKIST_VISIT', 'HOSPITAL_VISIT', 'OTHER');--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "visit_type" "visit_type" DEFAULT 'OTHER' NOT NULL;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "outcome" "visit_outcome";--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "prescription_commitment" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "visits" v
SET "visit_type" = CASE p.entity_type
  WHEN 'DOCTOR' THEN 'DOCTOR_VISIT'::"visit_type"
  WHEN 'STOCKIST' THEN 'STOCKIST_VISIT'::"visit_type"
  WHEN 'HOSPITAL' THEN 'HOSPITAL_VISIT'::"visit_type"
  ELSE 'OTHER'::"visit_type"
END
FROM "persons" p
WHERE v.person_id = p.id;--> statement-breakpoint
UPDATE "visits"
SET "outcome" = CASE
  WHEN feedback LIKE '%Outcome: POSITIVE%' THEN 'POSITIVE'::"visit_outcome"
  WHEN feedback LIKE '%Outcome: NEUTRAL%' THEN 'NEUTRAL'::"visit_outcome"
  WHEN feedback LIKE '%Outcome: NEGATIVE%' THEN 'NEGATIVE'::"visit_outcome"
  WHEN feedback LIKE '%Outcome: NOT_MET%' THEN 'NOT_MET'::"visit_outcome"
  ELSE NULL
END
WHERE status = 'COMPLETED' AND feedback IS NOT NULL;--> statement-breakpoint
UPDATE "visits" v
SET prescription_commitment = (
  v.visit_type = 'DOCTOR_VISIT'
  AND v.status = 'COMPLETED'
  AND (
    v.outcome = 'POSITIVE'
    OR (v.outcome IS NULL AND v.order_taken IS TRUE)
  )
)
WHERE v.visit_type = 'DOCTOR_VISIT' AND v.status = 'COMPLETED';
