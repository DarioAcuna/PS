ALTER TABLE "users"
ADD COLUMN "membership_plan" TEXT,
ADD COLUMN "membership_started_at" TIMESTAMP(3),
ADD COLUMN "stripe_customer_id" TEXT,
ADD COLUMN "stripe_subscription_id" TEXT;
