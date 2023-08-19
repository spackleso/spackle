create table "public"."pricing_table_products" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone default now(),
    "stripe_account_id" text not null,
    "pricing_table_id" bigint not null,
    "stripe_product_id" text not null,
    "monthly_stripe_price_id" text,
    "annual_stripe_price_id" text
);


alter table "public"."pricing_table_products" enable row level security;

create table "public"."pricing_tables" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone default now(),
    "stripe_account_id" text not null,
    "name" text not null default 'Default'::text,
    "mode" smallint not null default '1'::smallint,
    "monthly_enabled" boolean not null default false,
    "annual_enabled" boolean not null default false
);


alter table "public"."pricing_tables" enable row level security;

CREATE UNIQUE INDEX pricing_table_products_pkey ON public.pricing_table_products USING btree (id);

CREATE UNIQUE INDEX pricing_tables_pkey ON public.pricing_tables USING btree (id);

alter table "public"."pricing_table_products" add constraint "pricing_table_products_pkey" PRIMARY KEY using index "pricing_table_products_pkey";

alter table "public"."pricing_tables" add constraint "pricing_tables_pkey" PRIMARY KEY using index "pricing_tables_pkey";

alter table "public"."pricing_table_products" add constraint "pricing_table_products_annual_stripe_price_id_fkey" FOREIGN KEY (annual_stripe_price_id) REFERENCES stripe_prices(stripe_id) ON DELETE SET NULL not valid;

alter table "public"."pricing_table_products" validate constraint "pricing_table_products_annual_stripe_price_id_fkey";

alter table "public"."pricing_table_products" add constraint "pricing_table_products_monthly_stripe_price_id_fkey" FOREIGN KEY (monthly_stripe_price_id) REFERENCES stripe_prices(stripe_id) ON DELETE SET NULL not valid;

alter table "public"."pricing_table_products" validate constraint "pricing_table_products_monthly_stripe_price_id_fkey";

alter table "public"."pricing_table_products" add constraint "pricing_table_products_pricing_table_id_fkey" FOREIGN KEY (pricing_table_id) REFERENCES pricing_tables(id) ON DELETE CASCADE not valid;

alter table "public"."pricing_table_products" validate constraint "pricing_table_products_pricing_table_id_fkey";

alter table "public"."pricing_table_products" add constraint "pricing_table_products_stripe_account_id_fkey" FOREIGN KEY (stripe_account_id) REFERENCES stripe_accounts(stripe_id) ON DELETE CASCADE not valid;

alter table "public"."pricing_table_products" validate constraint "pricing_table_products_stripe_account_id_fkey";

alter table "public"."pricing_table_products" add constraint "pricing_table_products_stripe_product_id_fkey" FOREIGN KEY (stripe_product_id) REFERENCES stripe_products(stripe_id) ON DELETE CASCADE not valid;

alter table "public"."pricing_table_products" validate constraint "pricing_table_products_stripe_product_id_fkey";

alter table "public"."pricing_tables" add constraint "pricing_tables_stripe_account_id_fkey" FOREIGN KEY (stripe_account_id) REFERENCES stripe_accounts(stripe_id) ON DELETE CASCADE not valid;

alter table "public"."pricing_tables" validate constraint "pricing_tables_stripe_account_id_fkey";


