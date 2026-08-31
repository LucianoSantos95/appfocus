ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS downloads integer NOT NULL DEFAULT 0;

UPDATE public.produtos p
SET downloads = sub.total
FROM (SELECT produto, count(*)::int AS total FROM public.leads WHERE produto IS NOT NULL GROUP BY produto) sub
WHERE p.slug = sub.produto;

CREATE OR REPLACE FUNCTION public.increment_produto_downloads()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.produto IS NOT NULL THEN
    UPDATE public.produtos SET downloads = downloads + 1 WHERE slug = NEW.produto;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_produto_downloads ON public.leads;
CREATE TRIGGER trg_increment_produto_downloads
AFTER INSERT ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.increment_produto_downloads();