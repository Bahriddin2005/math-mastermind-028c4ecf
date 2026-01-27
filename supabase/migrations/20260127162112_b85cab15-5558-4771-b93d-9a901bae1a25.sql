-- Update handle_new_user function to include phone_number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, phone_number)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data ->> 'username', 'Player'),
    new.raw_user_meta_data ->> 'phone_number'
  );
  RETURN new;
END;
$$;