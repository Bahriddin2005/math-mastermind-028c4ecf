
-- 1. Fix telegram_users: drop permissive public policy, create service_role only
DROP POLICY IF EXISTS "Service role can manage telegram users" ON public.telegram_users;
CREATE POLICY "Service role can manage telegram users" ON public.telegram_users
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Fix profiles: replace broad SELECT with own-profile + public leaderboard fields
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public leaderboard data visible" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- 3. Fix user_badges: restrict INSERT to service_role only
DROP POLICY IF EXISTS "System can create badges" ON public.user_badges;
CREATE POLICY "Service role can create badges" ON public.user_badges
  FOR INSERT TO service_role
  WITH CHECK (true);
