# E-mail de pedido de feedback para os usuários mais ativos

Disparo único, no mesmo formato dos dois últimos envios: template visual padrão do Hub (cabeçalho FOCUS, cards, botão CTA), personalizado pelo primeiro nome, com filtro automático de endereços suprimidos.

## Público

Base atual (medida agora na view de engajamento):
- 16 usuários com alguma atividade nos últimos 90 dias
- 11 deles com 3 ou mais ações
- 7 ativos nos últimos 30 dias

Audiência escolhida: os usuários com atividade nos últimos 90 dias (16), ordenados por volume de ações, **mais** `oluciano.dosantos@gmail.com` incluído explicitamente (mesmo que já esteja na lista, sem duplicar).

## Conteúdo do e-mail

**Assunto:** Seu depoimento pode aparecer na nossa página

**Abertura:** reconhecimento — a pessoa está entre quem mais usa o Hub; por isso a opinião dela vale mais do que qualquer texto de marketing.

**Blocos:**
1. *O que pedimos* — um feedback curto (2-3 frases) sobre o que o Hub resolveu na operação.
2. *Como deixar* — dentro da plataforma: clicar no próprio nome (canto superior direito) → **Feedback** → nota em estrelas + comentário. Leva menos de 1 minuto.
3. *Onde vai aparecer* — depoimentos selecionados entram na página inicial, com nome e empresa; quem não quiser aparecer é só avisar no próprio comentário.

**CTA principal:** "Deixar meu feedback" → https://app.focusinteligente.com.br/

**Fechamento:** agradecimento curto, assinatura da equipe Focus.

## Execução técnica

- Adicionar a audiência `"active"` em `supabase/functions/send-subscriber-broadcast/index.ts`: seleciona usuários da view de engajamento com ações nos últimos 90 dias, ordenados por total de ações, com `limit` parametrizável, e garante a inclusão do e-mail extra informado (`extra_emails`).
- Reaproveitar todo o resto já publicado: render do template, personalização por nome, filtro de `suppressed_emails`, log em `email_send_log` e intervalo de 150 ms entre envios.
- Deploy da função e disparo via `pg_net` com autenticação service_role (mesmo padrão dos envios anteriores).
- Nenhuma alteração de produto, Asaas, auth ou schema.

## Verificação

- Conferir a contagem de destinatários retornada antes do envio.
- Reportar quantos foram aceitos pelo provedor e quais falharam, com base no retorno e no registro de envios.
