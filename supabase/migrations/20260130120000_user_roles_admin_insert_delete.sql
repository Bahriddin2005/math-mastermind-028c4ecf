-- Allow admins to add/remove admin role (for Admin panel "Admin qilish" / "Admin o'chirish")
-- Birinchi adminni qo'shish: faqat Supabase Dashboard SQL Editor orqali (pastda qo'llanma)

CREATE POLICY "Admins can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
