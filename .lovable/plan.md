## Objetivo
Deixar todos os pontos A–D 100% funcionais na conta demo (E já está ✅).

## A) Firecrawl — do 503 ao enriquecimento real

**Causa raiz confirmada:** o connector Firecrawl não está linkado ao projeto → `LOVABLE_API_KEY`+`FIRECRAWL_API_KEY` do gateway não existem → `isFirecrawlConfigured()` retorna false → 503.

**Passos:**
1. Conectar Firecrawl via `standard_connectors--connect` (gateway-backed). Isso injeta `FIRECRAWL_API_KEY` (`lovc_...`) e usa o `LOVABLE_API_KEY` já existente.
2. Ajustar `supabase/functions/_shared/firecrawl.ts`:
   - Migrar endpoint `/firecrawl/v1/scrape` → `/firecrawl/v2/scrape` (v1 está deprecado; formato de resposta mudou).
   - Ajustar leitura da resposta: v2 retorna `data.json` diretamente; manter fallback para `data.extract` (compat).
   - Ajustar `jsonOptions` → `formats: [{ type: "json", prompt, schema }]` conforme knowledge Firecrawl v2.
3. Rodar novamente `POST /enrich-client` com `cliente_id` do Nubank e capturar retorno; se erro persistir, logar body bruto para diagnóstico.

## B) Google Agenda 2-vias + C) Envio pelo Gmail do usuário

**Bloqueio:** OAuth consent é interativo — não roda em headless. Mas dá para garantir que **tudo** que não é o clique final esteja correto e à prova de erro.

**Passos:**
1. Verificar `supabase/functions/google-integration/index.ts`:
   - Confirmar que `action=connect` gera URL de consent com `redirect_uri` = `${VITE_SUPABASE_URL}/functions/v1/google-integration` (ou callback registrado no Google Cloud).
   - Confirmar que `action=create_event` usa `get_integration_tokens` + auto-refresh via `update_integration_access_token` (respeita guardrails).
   - Confirmar que scopes incluem `https://www.googleapis.com/auth/calendar.events` e `https://www.googleapis.com/auth/gmail.send`.
2. Verificar no Google Cloud Console (via chat com o usuário — só o dono do OAuth pode) que o Redirect URI da função está autorizado. Se não estiver, orientar exatamente o que colar.
3. Front-end (`IntegrationsPanel`): garantir que após retornar de `?google_connected=true` o status atualiza e o toast confirma.
4. Fluxo AgendaWidget → "Novo Compromisso" com toggle "Google Agenda" já existe (verificado). Fazer teste manual: login com a conta demo → Integrações → Conectar Google → concluir consent → criar compromisso com toggle marcado → conferir na Google Agenda.
5. Fluxo Finanças BI → "Enviar por e-mail" → canal "Meu Gmail" → destinatário → enviar. Confirmar que `SendReportDialog` chama edge `send-bi-report` com `channel: "gmail"` e essa edge usa `google-integration` action `send_email`.
6. Se algum secret extra faltar (ex.: `GOOGLE_REDIRECT_URI` explícito), pedir com `add_secret`.

**Entrega:** relatório com screenshots do fluxo completo B e C após o usuário fazer o login manual (única etapa não automatizável).

## D) Slack — do `not_in_channel` ao envio real

**Causa raiz:** bot da conexão Slack precisa estar no canal alvo. Também não há canal padrão configurado no app, o que dificulta o disparo automático de alertas.

**Passos:**
1. **UX de canal:** adicionar em `IntegrationsPanel` (ou em `Configurações → Notificações`) um seletor "Canal padrão do Slack" que:
   - Chama `GET /notify-slack` para listar canais (já funciona).
   - Persiste o `channel` escolhido em `user_preferences` (nova coluna `slack_default_channel text`).
2. **Migration:** `ALTER TABLE user_preferences ADD COLUMN slack_default_channel text;` (com grants já cobertos pela tabela existente).
3. **Alerta de lead quente:** localizar o gatilho (provavelmente `cron-funnel-progression` ou trigger de `user_funnel_stage` quando vira `quente`) e fazê-lo chamar `notify-slack` usando `user_preferences.slack_default_channel` do dono do funil.
4. **Botão "Enviar ao Slack"** no `SendReportDialog` (canal adicional além de Email/Gmail), usando o canal padrão + fallback para dropdown de canais.
5. **Orientação one-shot no UI:** quando `notify-slack` responder `not_in_channel`, exibir toast com instrução exata: "Convide o bot no Slack: `/invite @Hub Empresarial` no canal #x". Assim o usuário resolve sem precisar consultar suporte.
6. **Teste final:** o usuário roda `/invite @Hub Empresarial` no `#social` (ou outro canal) → seleciona esse canal como padrão no app → dispara um teste ("Enviar teste") e vê a mensagem chegar. Se der certo, o alerta de lead quente já vai funcionar pelo mesmo caminho.

## Ordem de execução
1. **Firecrawl (A)** — 100% resolvível por mim: conectar + ajustar endpoint v2 + retestar. Sem depender do usuário.
2. **Slack (D)** — 90% resolvível por mim (migration + UI + hook do alerta). Único passo do usuário: um `/invite` no canal.
3. **Google (B/C)** — verificação de código + orientação para o consent manual. Sem consent OAuth do usuário, não há como um teste headless comprovar o envio real; mas o app fica pronto para receber a conexão.

## Guardrails mantidos
- Não recriar `get_integration_tokens` / `upsert_integration` / `update_integration_access_token`.
- Não aplicar migrations `20260609100002` (criptografia) e `20260714200000` (trigger slack).
- Não mexer em Stripe.

## Entregável final
- Relatório atualizado A–D todos ✅ (com a ressalva de B/C exigindo 1 clique manual do avaliador para o consent Google — inevitável).
- Migration nova só para `slack_default_channel`.
- Diffs pequenos em: `_shared/firecrawl.ts`, `IntegrationsPanel.tsx`, `SendReportDialog.tsx`, cron/trigger de lead quente.
