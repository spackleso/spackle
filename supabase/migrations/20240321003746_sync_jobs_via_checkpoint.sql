alter table "public"."sync_jobs" drop column "live_mode_charges_complete";

alter table "public"."sync_jobs" drop column "live_mode_complete";

alter table "public"."sync_jobs" drop column "live_mode_customers_complete";

alter table "public"."sync_jobs" drop column "live_mode_invoices_complete";

alter table "public"."sync_jobs" drop column "live_mode_prices_complete";

alter table "public"."sync_jobs" drop column "live_mode_products_complete";

alter table "public"."sync_jobs" drop column "live_mode_subscriptions_complete";

alter table "public"."sync_jobs" drop column "test_mode_charges_complete";

alter table "public"."sync_jobs" drop column "test_mode_complete";

alter table "public"."sync_jobs" drop column "test_mode_customers_complete";

alter table "public"."sync_jobs" drop column "test_mode_invoices_complete";

alter table "public"."sync_jobs" drop column "test_mode_prices_complete";

alter table "public"."sync_jobs" drop column "test_mode_products_complete";

alter table "public"."sync_jobs" drop column "test_mode_subscriptions_complete";

alter table "public"."sync_jobs" add column "mode_step" text;

alter table "public"."sync_jobs" add column "pipeline_step" text;

alter table "public"."sync_jobs" add column "pipeline_step_checkpoint" text;


