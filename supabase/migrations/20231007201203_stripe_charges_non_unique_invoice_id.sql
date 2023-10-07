alter table "public"."stripe_charges" drop constraint "stripe_charges_stripe_invoice_id_key";

drop index if exists "public"."stripe_charges_stripe_invoice_id_key";


