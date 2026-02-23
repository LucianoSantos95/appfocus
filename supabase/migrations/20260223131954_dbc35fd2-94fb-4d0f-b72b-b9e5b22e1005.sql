
-- Create trigger for auto-creating default subscription on new user signup (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_subscription') THEN
    CREATE TRIGGER on_auth_user_created_subscription
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.create_default_subscription();
  END IF;
END $$;

-- Create trigger for updating clientes updated_at (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clientes_updated_at') THEN
    CREATE TRIGGER update_clientes_updated_at
      BEFORE UPDATE ON public.clientes
      FOR EACH ROW EXECUTE FUNCTION public.update_clientes_updated_at();
  END IF;
END $$;
