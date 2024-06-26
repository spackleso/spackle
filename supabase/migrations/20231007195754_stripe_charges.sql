alter table "public"."stripe_invoice_line_items" drop constraint "stripe_invoice_line_items_stripe_account_id_fkey";

alter table "public"."stripe_invoice_line_items" drop constraint "stripe_invoice_line_items_stripe_id_key";

alter table "public"."stripe_invoice_line_items" drop constraint "stripe_invoice_line_items_stripe_invoice_id_fkey";

alter table "public"."stripe_invoices" drop constraint "stripe_invoices_stripe_customer_id_fkey";

alter table "public"."stripe_invoice_line_items" drop constraint "stripe_invoice_line_items_pkey";

drop index if exists "public"."stripe_invoice_line_items_pkey";

drop index if exists "public"."stripe_invoice_line_items_stripe_id_key";

drop table "public"."stripe_invoice_line_items";

create table "public"."stripe_charges" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone default now(),
    "stripe_id" text not null,
    "stripe_account_id" text not null,
    "stripe_json" json,
    "status" text not null,
    "amount" bigint not null,
    "stripe_created" timestamp with time zone not null,
    "stripe_invoice_id" text,
    "mode" smallint not null
);


alter table "public"."stripe_charges" enable row level security;

alter table "public"."stripe_invoices" drop column "status";

alter table "public"."stripe_invoices" drop column "stripe_customer_id";

alter table "public"."stripe_invoices" drop column "total";

alter table "public"."stripe_invoices" add column "stripe_subscription_id" text;

CREATE UNIQUE INDEX stripe_charges_pkey ON public.stripe_charges USING btree (id);

CREATE UNIQUE INDEX stripe_charges_stripe_id_key ON public.stripe_charges USING btree (stripe_id);

CREATE UNIQUE INDEX stripe_charges_stripe_invoice_id_key ON public.stripe_charges USING btree (stripe_invoice_id);

alter table "public"."stripe_charges" add constraint "stripe_charges_pkey" PRIMARY KEY using index "stripe_charges_pkey";

alter table "public"."stripe_charges" add constraint "stripe_charges_stripe_account_id_fkey" FOREIGN KEY (stripe_account_id) REFERENCES stripe_accounts(stripe_id) not valid;

alter table "public"."stripe_charges" validate constraint "stripe_charges_stripe_account_id_fkey";

alter table "public"."stripe_charges" add constraint "stripe_charges_stripe_id_key" UNIQUE using index "stripe_charges_stripe_id_key";

alter table "public"."stripe_charges" add constraint "stripe_charges_stripe_invoice_id_fkey" FOREIGN KEY (stripe_invoice_id) REFERENCES stripe_invoices(stripe_id) ON DELETE RESTRICT not valid;

alter table "public"."stripe_charges" validate constraint "stripe_charges_stripe_invoice_id_fkey";

alter table "public"."stripe_charges" add constraint "stripe_charges_stripe_invoice_id_key" UNIQUE using index "stripe_charges_stripe_invoice_id_key";


