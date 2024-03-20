alter table "public"."sync_jobs" add column "live_mode_charges_complete" boolean not null default false;

alter table "public"."sync_jobs" add column "live_mode_customers_complete" boolean not null default false;

alter table "public"."sync_jobs" add column "live_mode_invoices_complete" boolean not null default false;

alter table "public"."sync_jobs" add column "live_mode_prices_complete" boolean not null default false;

alter table "public"."sync_jobs" add column "live_mode_products_complete" boolean not null default false;

alter table "public"."sync_jobs" add column "live_mode_subscriptions_complete" boolean not null default false;

alter table "public"."sync_jobs" add column "test_mode_charges_complete" boolean not null default false;

alter table "public"."sync_jobs" add column "test_mode_customers_complete" boolean not null default false;

alter table "public"."sync_jobs" add column "test_mode_invoices_complete" boolean not null default false;

alter table "public"."sync_jobs" add column "test_mode_prices_complete" boolean not null default false;

alter table "public"."sync_jobs" add column "test_mode_products_complete" boolean not null default false;

alter table "public"."sync_jobs" add column "test_mode_subscriptions_complete" boolean not null default false;


