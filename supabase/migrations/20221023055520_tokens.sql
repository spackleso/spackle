-- This script was generated by the Schema Diff utility in pgAdmin 4
-- For the circular dependencies, the order in which Schema Diff writes the objects is not very sophisticated
-- and may require manual changes to the script to ensure changes are applied in the correct order.
-- Please report an issue for any failure with the reproduction steps.

CREATE TABLE IF NOT EXISTS public.tokens
(
    created_at timestamp with time zone DEFAULT now(),
    token text COLLATE pg_catalog."default" NOT NULL,
    stripe_account_id text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT tokens_pkey PRIMARY KEY (token),
    CONSTRAINT tokens_stripe_account_id_fkey FOREIGN KEY (stripe_account_id)
        REFERENCES public.stripe_accounts (stripe_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.tokens
    OWNER to postgres;

GRANT ALL ON TABLE public.tokens TO anon;

GRANT ALL ON TABLE public.tokens TO authenticated;

GRANT ALL ON TABLE public.tokens TO postgres;

GRANT ALL ON TABLE public.tokens TO service_role;

REVOKE ALL ON TABLE public.price_features FROM authenticated;
REVOKE ALL ON TABLE public.price_features FROM postgres;
REVOKE ALL ON TABLE public.price_features FROM service_role;
GRANT ALL ON TABLE public.price_features TO authenticated;

GRANT ALL ON TABLE public.price_features TO service_role;

GRANT ALL ON TABLE public.price_features TO postgres;

REVOKE ALL ON TABLE public.stripe_prices FROM authenticated;
REVOKE ALL ON TABLE public.stripe_prices FROM postgres;
REVOKE ALL ON TABLE public.stripe_prices FROM service_role;
GRANT ALL ON TABLE public.stripe_prices TO authenticated;

GRANT ALL ON TABLE public.stripe_prices TO service_role;

GRANT ALL ON TABLE public.stripe_prices TO postgres;

REVOKE ALL ON TABLE public.customer_features FROM authenticated;
REVOKE ALL ON TABLE public.customer_features FROM postgres;
REVOKE ALL ON TABLE public.customer_features FROM service_role;
GRANT ALL ON TABLE public.customer_features TO authenticated;

GRANT ALL ON TABLE public.customer_features TO service_role;

GRANT ALL ON TABLE public.customer_features TO postgres;

REVOKE ALL ON TABLE public.features FROM anon;
REVOKE ALL ON TABLE public.features FROM postgres;
REVOKE ALL ON TABLE public.features FROM service_role;
GRANT ALL ON TABLE public.features TO anon;

GRANT ALL ON TABLE public.features TO service_role;

GRANT ALL ON TABLE public.features TO postgres;

ALTER TABLE IF EXISTS public.stripe_accounts DROP COLUMN IF EXISTS secret_key;

REVOKE ALL ON TABLE public.stripe_subscriptions FROM authenticated;
REVOKE ALL ON TABLE public.stripe_subscriptions FROM postgres;
REVOKE ALL ON TABLE public.stripe_subscriptions FROM service_role;
GRANT ALL ON TABLE public.stripe_subscriptions TO authenticated;

GRANT ALL ON TABLE public.stripe_subscriptions TO service_role;

GRANT ALL ON TABLE public.stripe_subscriptions TO postgres;

REVOKE ALL ON TABLE public.product_features FROM authenticated;
REVOKE ALL ON TABLE public.product_features FROM postgres;
REVOKE ALL ON TABLE public.product_features FROM service_role;
GRANT ALL ON TABLE public.product_features TO authenticated;

GRANT ALL ON TABLE public.product_features TO service_role;

GRANT ALL ON TABLE public.product_features TO postgres;

REVOKE ALL ON TABLE public.stripe_subscription_items FROM authenticated;
REVOKE ALL ON TABLE public.stripe_subscription_items FROM postgres;
REVOKE ALL ON TABLE public.stripe_subscription_items FROM service_role;
GRANT ALL ON TABLE public.stripe_subscription_items TO authenticated;

GRANT ALL ON TABLE public.stripe_subscription_items TO service_role;

GRANT ALL ON TABLE public.stripe_subscription_items TO postgres;