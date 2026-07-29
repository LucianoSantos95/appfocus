# Red-team: como eu invadiria o Focus Hub

Fiz uma varredura real (security scan, dependency scan, checagem de RLS, revisão de edge functions e do fluxo de auth). Abaixo listo **como um atacante entraria** e o **plano priorizado** para blindar. Nada será alterado até você aprovar.

---

## 🔴 P0 — Vetores CRÍTICOS (exploráveis hoje)

### 1. Escrita cross-tenant em `sales_touchpoints`

**Como eu exploraria:** Qualquer usuário autenticado consegue `INSERT` com `user_id` de OUTRA conta desde que `created_by = auth.uid()`. Posso poluir o histórico comercial de qualquer cliente, sabotar métricas de funil, injetar dados falsos.
**Fix:** Adicionar `WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(),'admin'))` na policy de INSERT.

### 2. Edge Functions públicas sem auth robusta

`verify_jwt = false` em: `hub-assistant`, `analyze-client`, `enrich-client`, `transcribe-meeting`, `log-client-error`, `send-followup-email`, `send-whatsapp`, `send-bi-report`, `send-promo-campaign`, `google-integration`, `customer-portal`, `create-asaas-checkout`, `check-subscription`.
**Como eu exploraria:**

- `hub-assistant` / `analyze-client` / `enrich-client` / `transcribe-meeting`: rodo scripts em loop → **queimo seus créditos de Lovable AI / OpenAI / Firecrawl** (DoS financeiro).
- `send-whatsapp` / `send-followup-email` / `send-promo-campaign`: **spam via seus créditos Twilio/Resend**, dano reputacional do domínio.
- `log-client-error`: floodar `client_errors` até estourar storage.
- `customer-portal` / `create-asaas-checkout`: se aceitar `user_id` do body sem revalidar via JWT, gero checkouts em nome de outro.
**Fix:** Em cada função, validar `getClaims(token)` explicitamente + rate limit por `user_id`/IP + validar que o `user_id` do payload = `claims.sub` (nunca confiar em body).

### 3. Signup sem CAPTCHA / abuso de emails

**Como eu exploraria:** Script que cria N contas com emails válidos → dispara N emails de confirmação via seu Resend → **queima cota e mancha reputação SPF/DKIM** do `focusinteligente.com.br`.
**Fix:** Ativar Turnstile/hCaptcha no signup + rate limit por IP na função `auth-email-hook`.

### 4. `sessionStorage` MFA cache (5 min)

**Como eu exploraria:** Se eu tenho XSS (ver #5), leio `sessionStorage["mfa_check_*"]` e vejo se a vítima tem MFA. Não permite bypass, mas é reconhecimento.
**Fix:** Não é crítico isoladamente — a AAL é validada server-side. Documentar risco aceito ou mover para memory-only.

---

## 🟠 P1 — Vetores ALTOS (exigem conjunção de fatores)

### 5. XSS via `dangerouslySetInnerHTML` / rich text de notas de reunião

Você tem `sanitizeHtml` com DOMPurify — **bom**. Preciso auditar que TODO render de conteúdo salvo por usuário (bulletin_notes, meeting_notes, followup body_html preview no admin) passa pelo sanitizer.
**Fix:** Grep de todos `dangerouslySetInnerHTML` no repo e garantir `sanitizeHtml()` em 100%.

### 6. 30 funções `SECURITY DEFINER` executáveis por `anon`/`authenticated`

Ex.: `record_login_attempt`, `check_login_rate_limit`, `enqueue_email`, `move_to_dlq`, `verify_cron_token`, `populate_demo_data`.
**Como eu exploraria:**

- `enqueue_email(queue_name, payload)`: se eu chamar direto via PostgREST RPC, **enfileiro emails arbitrários** que o `process-email-queue` vai disparar.
- `populate_demo_data`: injetar dados demo em contas de terceiros se acessível.
- `record_login_attempt`: poluir tabela de rate-limit para bloquear login de um email-alvo (DoS de conta).
**Fix:** `REVOKE EXECUTE FROM anon, authenticated` em todas as funções que não devem ser RPC públicas. Deixar EXECUTE só nas que a UI chama (`check_login_rate_limit`, `has_role`, `recompute_funnel_stage`, etc.).

### 7. Token Google/Slack em texto claro em `user_integrations`

`access_token` e `refresh_token` armazenados sem criptografia. Se houver **qualquer** SQL injection futura ou vazamento de backup, o atacante ganha **acesso ao Gmail/Calendar/Slack de todos os usuários**.
**Fix (respeitando o guardrail):** você pediu para NÃO aplicar a migration de criptografia. Alternativa mínima: garantir que `user_integrations` tenha policy SELECT restrita a `service_role` (apenas edge functions leem via `get_integration_tokens`) e nunca ao `authenticated` — verificar policies atuais.

### 8. Storage buckets — path traversal / enumeração

Buckets `client-recordings`, `colaborador-docs`, `projeto-anexos`, `relatorios-pdf` são privados ✓. Preciso confirmar que as **policies exigem `owner = auth.uid()**` e que o path sempre começa com `${user_id}/`.
**Fix:** Auditar policies dos 4 buckets; se qualquer permitir SELECT com `bucket_id = 'x'` sem checar owner/path, atacante lista/baixa arquivos alheios.

### 9. `client_errors` sem auth pode ser flood

`log-client-error` é público (por design, para capturar erros de sessão anônima). Sem rate limit, atacante lota a tabela.
**Fix:** Rate limit por IP (5/min) + TTL de 30 dias na tabela via cron.

---

## 🟡 P2 — Hardening defensivo

### 10. CSP / Headers de segurança

Verificar se o hosting envia `Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. Sem CSP, XSS residual vira exfiltração completa.
**Fix:** Adicionar meta CSP em `index.html` (script-src 'self' 'unsafe-inline' apenas para o gtag; connect-src limitado a supabase/lovable/asaas).

### 11. Enumeração de usuários no login

Mensagens de erro do Supabase diferenciam "email não existe" vs "senha errada" em alguns fluxos → atacante enumera base.
**Fix:** No `AuthContext.signIn`, normalizar todos os erros para "Credenciais inválidas".

### 12. `SUPABASE_SERVICE_ROLE_KEY` em edge functions

Confirmar que nenhuma edge function **retorna** a service key em log/response, e que nenhum `console.log` de erro leaka o `authHeader` do usuário.
**Fix:** Grep em `supabase/functions/**` por `console.log` que loga headers, tokens ou payload completo.

---

## Plano de execução (4 sprints curtas)

```text
Sprint 1 (P0 - 1 dia)
├── Fix RLS sales_touchpoints (migration)
├── Adicionar getClaims + rate limit em 5 edge functions mais caras
│   (hub-assistant, analyze-client, enrich-client, transcribe-meeting, send-whatsapp)
└── REVOKE EXECUTE em enqueue_email, move_to_dlq, populate_demo_data

Sprint 2 (P0/P1 - 1 dia)
├── CAPTCHA no signup (Turnstile grátis)
├── Rate limit em log-client-error + TTL 30d
├── Auditoria de policies dos 4 storage buckets
└── Auditoria de dangerouslySetInnerHTML

Sprint 3 (P1 - meio dia)
├── REVOKE EXECUTE nas 25 funções SECURITY DEFINER restantes
├── Restringir SELECT em user_integrations a service_role
└── Normalizar mensagens de erro do login

Sprint 4 (P2 - meio dia)
├── Meta CSP + headers em index.html
├── Grep de logs vazando tokens/headers
└── Atualizar security memory com riscos aceitos
```

## Detalhes técnicos

- **Guardrails respeitados:** não vou tocar em `get_integration_tokens`/`upsert_integration`/`update_integration_access_token`, não vou criptografar `user_integrations`, não vou mexer em Asaas/Stripe.
- **Ferramentas por camada:**
  - DB: migrations SQL (REVOKE, ALTER POLICY, novas policies)
  - Edge: helper compartilhado `_shared/auth.ts` com `requireUser(req)` + `_shared/ratelimit.ts` usando tabela `rate_limits` já existente
  - Front: `sanitizeHtml` já existe (`src/lib/sanitize.ts`), só falta cobertura 100%
  - CAPTCHA: Turnstile do Cloudflare (grátis, sem secret novo — só site key pública)
- **Verificação:** após cada sprint, rodar `security--run_security_scan` + tentar exploit manual via `curl` nas edge functions para confirmar 401.

## O que preciso saber antes de começar

1. Topo o plano completo (4 sprints) ou você quer só P0 primeiro? - Plano completo
2. Posso usar Turnstile (Cloudflare, grátis) ou prefere hCaptcha/reCAPTCHA? prefiro o grátis
3. Confirma que posso **revogar EXECUTE** nas SECURITY DEFINER — algumas podem ser chamadas por edge functions com service_role (que ignora REVOKE), mas quero confirmar que nenhum código do frontend chama diretamente `enqueue_email`, `populate_demo_data`, etc.  pode sim