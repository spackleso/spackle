alter table "public"."price_features" drop constraint "one_value";

alter table "public"."price_features" drop constraint "price_features_feature_id_fkey";

alter table "public"."price_features" drop constraint "price_features_stripe_account_id_fkey";

alter table "public"."price_features" drop constraint "price_features_stripe_account_id_stripe_price_id_feature_id_key";

alter table "public"."price_features" drop constraint "price_features_stripe_price_id_fkey";

alter table "public"."price_features" drop constraint "price_features_pkey";

drop index if exists "public"."price_features_pkey";

drop index if exists "public"."price_features_stripe_account_id_stripe_price_id_feature_id_key";

drop table "public"."price_features";


