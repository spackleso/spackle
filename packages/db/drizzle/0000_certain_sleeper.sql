-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
DO $$ BEGIN
 CREATE TYPE "request_status" AS ENUM('ERROR', 'SUCCESS', 'PENDING');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "key_status" AS ENUM('expired', 'invalid', 'valid', 'default');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "key_type" AS ENUM('aead-det', 'aead-ietf');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "aal_level" AS ENUM('aal3', 'aal2', 'aal1');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "code_challenge_method" AS ENUM('plain', 's256');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "factor_status" AS ENUM('verified', 'unverified');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "factor_type" AS ENUM('webauthn', 'totp');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_features" (
	"id" bigint PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"value_limit" numeric,
	"value_flag" boolean,
	"stripe_account_id" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"feature_id" bigint NOT NULL,
	CONSTRAINT "customer_features_stripe_account_id_stripe_customer_id_feat_key" UNIQUE("stripe_account_id","stripe_customer_id","feature_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "price_features" (
	"id" bigint PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"value_limit" numeric,
	"value_flag" boolean,
	"stripe_account_id" text NOT NULL,
	"stripe_price_id" text NOT NULL,
	"feature_id" bigint NOT NULL,
	CONSTRAINT "price_features_stripe_account_id_stripe_price_id_feature_id_key" UNIQUE("stripe_account_id","stripe_price_id","feature_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stripe_prices" (
	"id" bigint PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"stripe_id" text NOT NULL,
	"stripe_account_id" text NOT NULL,
	"stripe_product_id" text NOT NULL,
	"stripe_json" json,
	CONSTRAINT "stripe_prices_stripe_id_key" UNIQUE("stripe_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stripe_products" (
	"id" bigint PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"stripe_id" text NOT NULL,
	"stripe_account_id" text NOT NULL,
	"stripe_json" json,
	CONSTRAINT "stripe_products_stripe_id_key" UNIQUE("stripe_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stripe_accounts" (
	"id" bigint PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"stripe_id" text NOT NULL,
	"stripe_json" json,
	"initial_sync_complete" boolean DEFAULT false NOT NULL,
	"initial_sync_started_at" timestamp with time zone,
	"has_acknowledged_setup" boolean DEFAULT false NOT NULL,
	"name" text,
	"billing_stripe_customer_id" text,
	CONSTRAINT "stripe_accounts_stripe_id_key" UNIQUE("stripe_id"),
	CONSTRAINT "stripe_accounts_billing_stripe_customer_id_key" UNIQUE("billing_stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stripe_subscriptions" (
	"id" bigint PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"stripe_id" text NOT NULL,
	"stripe_account_id" text NOT NULL,
	"stripe_json" json,
	"status" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	CONSTRAINT "stripe_subscriptions_stripe_id_key" UNIQUE("stripe_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tokens" (
	"created_at" timestamp with time zone DEFAULT now(),
	"token" text PRIMARY KEY NOT NULL,
	"stripe_account_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "features" (
	"id" bigint PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"name" text NOT NULL,
	"key" text NOT NULL,
	"type" smallint DEFAULT 0 NOT NULL,
	"value_limit" numeric,
	"value_flag" boolean,
	"stripe_account_id" text NOT NULL,
	CONSTRAINT "features_stripe_account_id_key_key" UNIQUE("key","stripe_account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stripe_customers" (
	"id" bigint PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"stripe_id" text NOT NULL,
	"stripe_account_id" text NOT NULL,
	"stripe_json" json,
	CONSTRAINT "stripe_customers_stripe_id_key" UNIQUE("stripe_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_features" (
	"id" bigint PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"value_limit" numeric,
	"value_flag" boolean,
	"stripe_account_id" text NOT NULL,
	"stripe_product_id" text NOT NULL,
	"feature_id" bigint NOT NULL,
	CONSTRAINT "product_features_stripe_account_id_stripe_product_id_featur_key" UNIQUE("stripe_account_id","stripe_product_id","feature_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stripe_subscription_items" (
	"id" bigint PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"stripe_id" text NOT NULL,
	"stripe_account_id" text NOT NULL,
	"stripe_json" json,
	"stripe_price_id" text NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	CONSTRAINT "stripe_subscription_items_stripe_id_key" UNIQUE("stripe_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stripe_users" (
	"id" bigint PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"email" text,
	"name" text,
	"stripe_account_id" text NOT NULL,
	"stripe_id" text NOT NULL,
	CONSTRAINT "stripe_users_stripe_account_id_stripe_id_feat_key" UNIQUE("stripe_account_id","stripe_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_features" ADD CONSTRAINT "customer_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_features" ADD CONSTRAINT "customer_features_stripe_account_id_fkey" FOREIGN KEY ("stripe_account_id") REFERENCES "stripe_accounts"("stripe_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_features" ADD CONSTRAINT "customer_features_stripe_customer_id_fkey" FOREIGN KEY ("stripe_customer_id") REFERENCES "stripe_customers"("stripe_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "price_features" ADD CONSTRAINT "price_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "price_features" ADD CONSTRAINT "price_features_stripe_account_id_fkey" FOREIGN KEY ("stripe_account_id") REFERENCES "stripe_accounts"("stripe_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "price_features" ADD CONSTRAINT "price_features_stripe_price_id_fkey" FOREIGN KEY ("stripe_price_id") REFERENCES "stripe_prices"("stripe_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stripe_prices" ADD CONSTRAINT "stripe_prices_stripe_account_id_fkey" FOREIGN KEY ("stripe_account_id") REFERENCES "stripe_accounts"("stripe_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stripe_prices" ADD CONSTRAINT "stripe_prices_stripe_product_id_fkey" FOREIGN KEY ("stripe_product_id") REFERENCES "stripe_products"("stripe_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stripe_products" ADD CONSTRAINT "stripe_products_stripe_account_id_fkey" FOREIGN KEY ("stripe_account_id") REFERENCES "stripe_accounts"("stripe_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stripe_subscriptions" ADD CONSTRAINT "stripe_subscriptions_stripe_account_id_fkey" FOREIGN KEY ("stripe_account_id") REFERENCES "stripe_accounts"("stripe_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stripe_subscriptions" ADD CONSTRAINT "stripe_subscriptions_stripe_customer_id_fkey" FOREIGN KEY ("stripe_customer_id") REFERENCES "stripe_customers"("stripe_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tokens" ADD CONSTRAINT "tokens_stripe_account_id_fkey" FOREIGN KEY ("stripe_account_id") REFERENCES "stripe_accounts"("stripe_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "features" ADD CONSTRAINT "features_stripe_account_id_fkey" FOREIGN KEY ("stripe_account_id") REFERENCES "stripe_accounts"("stripe_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stripe_customers" ADD CONSTRAINT "stripe_customers_stripe_account_id_fkey" FOREIGN KEY ("stripe_account_id") REFERENCES "stripe_accounts"("stripe_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_features" ADD CONSTRAINT "product_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_features" ADD CONSTRAINT "product_features_stripe_account_id_fkey" FOREIGN KEY ("stripe_account_id") REFERENCES "stripe_accounts"("stripe_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_features" ADD CONSTRAINT "product_features_stripe_product_id_fkey" FOREIGN KEY ("stripe_product_id") REFERENCES "stripe_products"("stripe_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stripe_subscription_items" ADD CONSTRAINT "stripe_subscription_items_stripe_account_id_fkey" FOREIGN KEY ("stripe_account_id") REFERENCES "stripe_accounts"("stripe_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stripe_subscription_items" ADD CONSTRAINT "stripe_subscription_items_stripe_price_id_fkey" FOREIGN KEY ("stripe_price_id") REFERENCES "stripe_prices"("stripe_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stripe_subscription_items" ADD CONSTRAINT "stripe_subscription_items_stripe_subscription_id_fkey" FOREIGN KEY ("stripe_subscription_id") REFERENCES "stripe_subscriptions"("stripe_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stripe_users" ADD CONSTRAINT "stripe_users_stripe_account_id_fkey" FOREIGN KEY ("stripe_account_id") REFERENCES "stripe_accounts"("stripe_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

*/