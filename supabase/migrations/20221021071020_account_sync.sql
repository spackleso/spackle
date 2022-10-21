-- This script was generated by the Schema Diff utility in pgAdmin 4
-- For the circular dependencies, the order in which Schema Diff writes the objects is not very sophisticated
-- and may require manual changes to the script to ensure changes are applied in the correct order.
-- Please report an issue for any failure with the reproduction steps.

-- Extension: pg_net

-- DROP EXTENSION pg_net;

CREATE EXTENSION IF NOT EXISTS pg_net
    SCHEMA extensions
    VERSION "0.6";

REVOKE ALL ON TABLE public.stripe_customers FROM anon;
REVOKE ALL ON TABLE public.stripe_customers FROM authenticated;
REVOKE ALL ON TABLE public.stripe_customers FROM postgres;
REVOKE ALL ON TABLE public.stripe_customers FROM service_role;
GRANT ALL ON TABLE public.stripe_customers TO anon;

GRANT ALL ON TABLE public.stripe_customers TO authenticated;

GRANT ALL ON TABLE public.stripe_customers TO postgres;

GRANT ALL ON TABLE public.stripe_customers TO service_role;

REVOKE ALL ON TABLE public.stripe_accounts FROM anon;
REVOKE ALL ON TABLE public.stripe_accounts FROM authenticated;
REVOKE ALL ON TABLE public.stripe_accounts FROM postgres;
REVOKE ALL ON TABLE public.stripe_accounts FROM service_role;
GRANT ALL ON TABLE public.stripe_accounts TO anon;

GRANT ALL ON TABLE public.stripe_accounts TO authenticated;

GRANT ALL ON TABLE public.stripe_accounts TO postgres;

GRANT ALL ON TABLE public.stripe_accounts TO service_role;

ALTER TABLE IF EXISTS public.stripe_accounts
    ADD COLUMN initial_sync_started_at timestamp with time zone;

REVOKE ALL ON TABLE public.features FROM anon;
REVOKE ALL ON TABLE public.features FROM authenticated;
REVOKE ALL ON TABLE public.features FROM postgres;
REVOKE ALL ON TABLE public.features FROM service_role;
GRANT ALL ON TABLE public.features TO anon;

GRANT ALL ON TABLE public.features TO authenticated;

GRANT ALL ON TABLE public.features TO postgres;

GRANT ALL ON TABLE public.features TO service_role;

REVOKE ALL ON TABLE public.stripe_products FROM anon;
REVOKE ALL ON TABLE public.stripe_products FROM authenticated;
REVOKE ALL ON TABLE public.stripe_products FROM postgres;
REVOKE ALL ON TABLE public.stripe_products FROM service_role;
GRANT ALL ON TABLE public.stripe_products TO anon;

GRANT ALL ON TABLE public.stripe_products TO authenticated;

GRANT ALL ON TABLE public.stripe_products TO postgres;

GRANT ALL ON TABLE public.stripe_products TO service_role;
