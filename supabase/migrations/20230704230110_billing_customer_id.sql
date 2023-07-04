alter table "public"."stripe_accounts" add column "billing_stripe_customer_id" text;

CREATE UNIQUE INDEX stripe_accounts_billing_stripe_customer_id_key ON public.stripe_accounts USING btree (billing_stripe_customer_id);

alter table "public"."stripe_accounts" add constraint "stripe_accounts_billing_stripe_customer_id_key" UNIQUE using index "stripe_accounts_billing_stripe_customer_id_key";


