-- This script was generated by the Schema Diff utility in pgAdmin 4
-- For the circular dependencies, the order in which Schema Diff writes the objects is not very sophisticated
-- and may require manual changes to the script to ensure changes are applied in the correct order.
-- Please report an issue for any failure with the reproduction steps.

REVOKE ALL ON TABLE public.product_features FROM anon;
REVOKE ALL ON TABLE public.product_features FROM postgres;
REVOKE ALL ON TABLE public.product_features FROM service_role;
GRANT ALL ON TABLE public.product_features TO anon;

GRANT ALL ON TABLE public.product_features TO service_role;

GRANT ALL ON TABLE public.product_features TO postgres;

REVOKE ALL ON TABLE public.customer_features FROM anon;
REVOKE ALL ON TABLE public.customer_features FROM postgres;
REVOKE ALL ON TABLE public.customer_features FROM service_role;
GRANT ALL ON TABLE public.customer_features TO anon;

GRANT ALL ON TABLE public.customer_features TO service_role;

GRANT ALL ON TABLE public.customer_features TO postgres;

REVOKE ALL ON TABLE public.features FROM anon;
REVOKE ALL ON TABLE public.features FROM postgres;
REVOKE ALL ON TABLE public.features FROM service_role;
GRANT ALL ON TABLE public.features TO anon;

GRANT ALL ON TABLE public.features TO service_role;

GRANT ALL ON TABLE public.features TO postgres;

ALTER TABLE IF EXISTS public.stripe_accounts
    ADD COLUMN has_acknowledged_setup boolean NOT NULL DEFAULT false;

REVOKE ALL ON TABLE public.stripe_prices FROM anon;
REVOKE ALL ON TABLE public.stripe_prices FROM postgres;
REVOKE ALL ON TABLE public.stripe_prices FROM service_role;
GRANT ALL ON TABLE public.stripe_prices TO anon;

GRANT ALL ON TABLE public.stripe_prices TO service_role;

GRANT ALL ON TABLE public.stripe_prices TO postgres;

REVOKE ALL ON TABLE public.price_features FROM anon;
REVOKE ALL ON TABLE public.price_features FROM postgres;
REVOKE ALL ON TABLE public.price_features FROM service_role;
GRANT ALL ON TABLE public.price_features TO anon;

GRANT ALL ON TABLE public.price_features TO service_role;

GRANT ALL ON TABLE public.price_features TO postgres;

REVOKE ALL ON TABLE public.wait_list_entries FROM authenticated;
REVOKE ALL ON TABLE public.wait_list_entries FROM postgres;
REVOKE ALL ON TABLE public.wait_list_entries FROM service_role;
GRANT ALL ON TABLE public.wait_list_entries TO authenticated;

GRANT ALL ON TABLE public.wait_list_entries TO service_role;

GRANT ALL ON TABLE public.wait_list_entries TO postgres;

REVOKE ALL ON TABLE public.stripe_subscription_items FROM anon;
REVOKE ALL ON TABLE public.stripe_subscription_items FROM postgres;
REVOKE ALL ON TABLE public.stripe_subscription_items FROM service_role;
GRANT ALL ON TABLE public.stripe_subscription_items TO anon;

GRANT ALL ON TABLE public.stripe_subscription_items TO service_role;

GRANT ALL ON TABLE public.stripe_subscription_items TO postgres;

REVOKE ALL ON TABLE public.stripe_subscriptions FROM anon;
REVOKE ALL ON TABLE public.stripe_subscriptions FROM postgres;
REVOKE ALL ON TABLE public.stripe_subscriptions FROM service_role;
GRANT ALL ON TABLE public.stripe_subscriptions TO anon;

GRANT ALL ON TABLE public.stripe_subscriptions TO service_role;

GRANT ALL ON TABLE public.stripe_subscriptions TO postgres;
