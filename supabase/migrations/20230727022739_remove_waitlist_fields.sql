alter table
    "public"."invites" drop constraint "invites_token_key";

alter table
    "public"."stripe_accounts" drop constraint "stripe_accounts_invite_id_fkey";

alter table
    "public"."wait_list_entries" drop constraint "wait_list_entries_email_key";

alter table
    "public"."wait_list_entries" drop constraint "wait_list_entries_invite_id_fkey";

alter table
    "public"."wait_list_entries" drop constraint "wait_list_entries_stripe_account_id_fkey";

alter table
    "public"."invites" drop constraint "invites_pkey";

alter table
    "public"."wait_list_entries" drop constraint "wait_list_entries_pkey";

drop index if exists "public"."invites_pkey";

drop index if exists "public"."invites_token_key";

drop index if exists "public"."wait_list_entries_email_key";

drop index if exists "public"."wait_list_entries_pkey";

drop table "public"."invites";

drop table "public"."wait_list_entries";

alter table
    "public"."stripe_accounts" drop column "invite_id";