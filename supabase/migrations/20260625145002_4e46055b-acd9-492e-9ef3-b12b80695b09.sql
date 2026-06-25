
CREATE OR REPLACE FUNCTION public.enforce_paid_plan_for_exports()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_is_admin boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN NEW;
  END IF;
  SELECT lower(plan) INTO v_plan FROM public.subscriptions WHERE user_id = NEW.user_id LIMIT 1;
  IF v_plan IS NULL OR v_plan = 'gratuito' THEN
    RAISE EXCEPTION 'Recurso disponível apenas em planos pagos.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_paid_plan_exports ON public.data_export_requests;
CREATE TRIGGER trg_enforce_paid_plan_exports
BEFORE INSERT ON public.data_export_requests
FOR EACH ROW EXECUTE FUNCTION public.enforce_paid_plan_for_exports();
