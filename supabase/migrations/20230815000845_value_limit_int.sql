alter table "public"."customer_features" alter column "value_limit" set data type bigint using "value_limit"::bigint;

alter table "public"."features" alter column "value_limit" set data type bigint using "value_limit"::bigint;

alter table "public"."product_features" alter column "value_limit" set data type bigint using "value_limit"::bigint;


