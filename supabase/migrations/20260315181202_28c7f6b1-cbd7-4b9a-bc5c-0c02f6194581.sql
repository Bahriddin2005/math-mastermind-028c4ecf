
-- Fix: set view to use invoker's security context
ALTER VIEW public.public_profiles SET (security_invoker = on);
