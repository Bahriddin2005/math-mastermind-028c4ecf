
-- Fix: set view to SECURITY INVOKER so RLS of querying user applies
ALTER VIEW public.live_sessions_safe SET (security_invoker = on);
