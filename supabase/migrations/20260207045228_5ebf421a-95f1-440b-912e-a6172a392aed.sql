-- Update handle_new_user to also assign the selected role
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  selected_role text;
  mapped_role app_role;
BEGIN
  INSERT INTO public.profiles (user_id, username, phone_number)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data ->> 'username', 'Player'),
    new.raw_user_meta_data ->> 'phone_number'
  );
  
  -- Assign user role based on signup selection
  selected_role := COALESCE(new.raw_user_meta_data ->> 'user_type', 'student');
  
  IF selected_role = 'parent' THEN
    mapped_role := 'parent';
  ELSIF selected_role = 'teacher' THEN
    mapped_role := 'teacher';
  ELSE
    mapped_role := 'student';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, mapped_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
END;
$function$;