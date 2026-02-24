-- Fix: new users should get 'user' role, not 'admin'
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$function$;

-- Fix existing non-admin users: change all to 'user' except the real admin(s)
-- Keep only the first registered user as admin (likely the SaaS owner)
UPDATE public.user_roles
SET role = 'user'
WHERE user_id != (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'admin' 
  ORDER BY created_at ASC 
  LIMIT 1
);