-- (2) Login: trava por e-mail+IP e por IP; RPCs só pelo servidor
DROP FUNCTION IF EXISTS public.check_login_rate_limit(text);
DROP FUNCTION IF EXISTS public.record_login_attempt(text);

CREATE OR REPLACE FUNCTION public.login_guard_check_and_record(p_email text, p_ip text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_ip text := coalesce(nullif(trim(p_ip), ''), 'desconhecido');
  n_par integer; n_ip integer; mais_antigo timestamptz; espera integer;
BEGIN
  SELECT count(*), min(attempted_at) INTO n_par, mais_antigo FROM public.login_attempts
   WHERE email = v_email AND ip_address = v_ip AND attempted_at > now() - interval '5 minutes';
  SELECT count(*) INTO n_ip FROM public.login_attempts
   WHERE ip_address = v_ip AND attempted_at > now() - interval '5 minutes';
  IF n_par >= 5 OR n_ip >= 20 THEN
    espera := greatest(0, EXTRACT(EPOCH FROM (coalesce(mais_antigo, now()) + interval '5 minutes' - now()))::integer);
    RETURN jsonb_build_object('allowed', false, 'wait_seconds', greatest(espera, 60));
  END IF;
  INSERT INTO public.login_attempts (email, ip_address) VALUES (v_email, v_ip);
  RETURN jsonb_build_object('allowed', true);
END; $$;
REVOKE ALL ON FUNCTION public.login_guard_check_and_record(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.login_guard_check_and_record(text, text) TO service_role;

-- (3) Limite de envios de visitantes (leads e eventos)
CREATE TABLE public.anon_rate_limits (
  chave text NOT NULL,
  janela timestamptz NOT NULL,
  total integer NOT NULL DEFAULT 0,
  PRIMARY KEY (chave, janela)
);
GRANT ALL ON public.anon_rate_limits TO service_role;
ALTER TABLE public.anon_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.anon_rate_hit(p_chave text, p_limite integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_total integer;
BEGIN
  INSERT INTO public.anon_rate_limits (chave, janela, total)
  VALUES (p_chave, date_trunc('minute', now()), 1)
  ON CONFLICT (chave, janela) DO UPDATE SET total = anon_rate_limits.total + 1
  RETURNING total INTO v_total;
  IF random() < 0.02 THEN
    DELETE FROM public.anon_rate_limits WHERE janela < now() - interval '1 hour';
  END IF;
  RETURN v_total <= p_limite;
END; $$;
REVOKE ALL ON FUNCTION public.anon_rate_hit(text, integer) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.request_ip()
RETURNS text LANGUAGE plpgsql STABLE SET search_path TO 'public' AS $$
DECLARE h json;
BEGIN
  BEGIN h := nullif(current_setting('request.headers', true), '')::json;
  EXCEPTION WHEN others THEN RETURN NULL; END;
  IF h IS NULL THEN RETURN NULL; END IF;
  RETURN nullif(trim(split_part(coalesce(h->>'cf-connecting-ip', h->>'x-real-ip', h->>'x-forwarded-for', ''), ',', 1)), '');
END; $$;

CREATE OR REPLACE FUNCTION public.enforce_anon_rate_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_ip text; v_role text := coalesce(auth.role(), '');
BEGIN
  IF v_role NOT IN ('anon', 'authenticated') THEN RETURN NEW; END IF;
  IF public.is_platform_owner() THEN RETURN NEW; END IF;
  v_ip := public.request_ip();
  IF TG_TABLE_NAME = 'leads' THEN
    IF v_ip IS NOT NULL AND NOT public.anon_rate_hit('lead:ip:' || v_ip, 5) THEN
      RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'P0001', HINT = 'Muitos envios. Aguarde um minuto.';
    END IF;
    IF (SELECT count(*) FROM public.leads WHERE email = lower(NEW.email) AND created_at > now() - interval '10 minutes') >= 5 THEN
      RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'P0001', HINT = 'Muitos envios. Aguarde alguns minutos.';
    END IF;
  ELSIF TG_TABLE_NAME = 'eventos' THEN
    IF v_ip IS NOT NULL AND NOT public.anon_rate_hit('evento:ip:' || v_ip, 60) THEN
      RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'P0001';
    END IF;
    IF NEW.sessao IS NOT NULL AND NOT public.anon_rate_hit('evento:sessao:' || NEW.sessao, 40) THEN
      RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_leads_rate_limit BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.enforce_anon_rate_limit();
CREATE TRIGGER trg_eventos_rate_limit BEFORE INSERT ON public.eventos
  FOR EACH ROW EXECUTE FUNCTION public.enforce_anon_rate_limit();

-- (4) Contador de downloads = contagem real de leads (recalcula em inserção, exclusão e troca de produto)
CREATE OR REPLACE FUNCTION public.recalcular_downloads_produto(p_slug text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  UPDATE public.produtos p
     SET downloads = (SELECT count(*) FROM public.leads l WHERE l.produto = p.slug)
   WHERE p.slug = p_slug;
$$;
REVOKE ALL ON FUNCTION public.recalcular_downloads_produto(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_produto_downloads()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.produto IS NOT NULL THEN
    PERFORM public.recalcular_downloads_produto(NEW.produto);
  END IF;
  IF TG_OP IN ('DELETE', 'UPDATE') AND OLD.produto IS NOT NULL
     AND (TG_OP = 'DELETE' OR OLD.produto IS DISTINCT FROM NEW.produto) THEN
    PERFORM public.recalcular_downloads_produto(OLD.produto);
  END IF;
  RETURN NULL;
END; $$;
REVOKE ALL ON FUNCTION public.increment_produto_downloads() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_increment_produto_downloads ON public.leads;
CREATE TRIGGER trg_increment_produto_downloads
  AFTER INSERT OR DELETE OR UPDATE OF produto ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.increment_produto_downloads();

-- (5) Excluir lead remove o evento lead_enviado correspondente (mesmo produto, horário mais próximo em ±5 min)
CREATE OR REPLACE FUNCTION public.remover_evento_do_lead()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF OLD.produto IS NULL THEN RETURN OLD; END IF;
  DELETE FROM public.eventos WHERE id = (
    SELECT e.id FROM public.eventos e
     WHERE e.tipo = 'lead_enviado' AND e.produto = OLD.produto
       AND e.created_at BETWEEN OLD.created_at - interval '5 minutes' AND OLD.created_at + interval '5 minutes'
     ORDER BY abs(EXTRACT(EPOCH FROM (e.created_at - OLD.created_at)))
     LIMIT 1);
  RETURN OLD;
END; $$;
REVOKE ALL ON FUNCTION public.remover_evento_do_lead() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_leads_remove_evento AFTER DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.remover_evento_do_lead();

-- Higiene: funções internas deixam de ser chamáveis por visitantes
REVOKE EXECUTE ON FUNCTION public.cleanup_old_client_errors() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_audit_event(text, text, text, jsonb) FROM anon;