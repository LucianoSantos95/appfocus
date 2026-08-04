# Notificação automática ao resolver um ticket

Hoje o usuário só descobre que o ticket foi resolvido se abrir o diálogo de Suporte. A ideia é avisar automaticamente no momento em que o status muda para "resolvido".

## O que será feito

1. **Aviso automático no sino de notificações**
   Quando o status de um ticket de suporte mudar para `resolvido`, o sistema cria na hora uma notificação para o dono do ticket:
   - Título: "Seu ticket foi resolvido"
   - Mensagem: início da mensagem original do ticket + convite para conferir a resposta
   - Tipo: sucesso
   A notificação aparece em tempo real no sino (o app já escuta novas notificações ao vivo), sem precisar recarregar a página.

2. **Sem disparos duplicados**
   O aviso só é criado na transição para "resolvido" (de outro status). Se alguém salvar o ticket de novo já resolvido, nada é reenviado.

3. **Destaque no diálogo de Suporte**
   Tickets resolvidos recentemente ganham um leve destaque visual no card, para o usuário identificar o que mudou ao abrir a aba "Meus Tickets".

## Detalhes técnicos

- Migration com função `notify_ticket_resolved()` (`SECURITY DEFINER`, `search_path = public`) + trigger `AFTER UPDATE ON public.support_tickets`, condicionada a `OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'resolvido'`.
- A função insere em `public.notifications` (`user_id`, `title`, `message`, `type = 'success'`). Como é `SECURITY DEFINER`, contorna o RLS de INSERT sem afetar as políticas existentes.
- Nenhuma alteração nas políticas de `support_tickets` nem no fluxo de criação de tickets.
- Ajuste apenas visual em `src/components/user/SupportDialog.tsx` para o destaque dos resolvidos.

## Fora do escopo (posso adicionar depois se quiser)

- E-mail de aviso da resolução (usaria a fila de e-mails já existente).
- Aviso por WhatsApp.
