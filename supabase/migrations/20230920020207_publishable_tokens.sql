create table "public"."publishable_tokens" (
    "created_at" timestamp with time zone default now(),
    "token" text not null,
    "stripe_account_id" text
);


alter table "public"."publishable_tokens" enable row level security;

CREATE UNIQUE INDEX publishable_tokens_pkey ON public.publishable_tokens USING btree (token);

alter table "public"."publishable_tokens" add constraint "publishable_tokens_pkey" PRIMARY KEY using index "publishable_tokens_pkey";

alter table "public"."publishable_tokens" add constraint "publishable_tokens_stripe_account_id_fkey" FOREIGN KEY (stripe_account_id) REFERENCES stripe_accounts(stripe_id) not valid;

alter table "public"."publishable_tokens" validate constraint "publishable_tokens_stripe_account_id_fkey";


