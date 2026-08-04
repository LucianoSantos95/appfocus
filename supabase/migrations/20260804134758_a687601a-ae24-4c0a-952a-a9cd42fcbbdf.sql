CREATE OR REPLACE FUNCTION public.notify_ticket_resolved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'resolvido' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'Seu ticket foi resolvido',
      'O ticket "' || left(regexp_replace(COALESCE(NEW.mensagem, ''), '\s+', ' ', 'g'), 80) ||
      CASE WHEN length(COALESCE(NEW.mensagem, '')) > 80 THEN '..."' ELSE '"' END ||
      ' foi marcado como resolvido. Abra o Suporte no menu do seu perfil para conferir.',
      'success'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_ticket_resolved ON public.support_tickets;
CREATE TRIGGER trg_notify_ticket_resolved
AFTER UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.notify_ticket_resolved();