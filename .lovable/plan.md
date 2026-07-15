## Objetivo
Criar uma conta demo funcional, popular com dados de exemplo e testar de ponta a ponta as 5 áreas (A–E) recentemente adicionadas, entregando um relatório com status HTTP e mensagens exatas de erro quando houver.

## Guardrails respeitados
- **Não** recriar `get_integration_tokens`, `upsert_integration`, `update_integration_access_token`.
- **Não** rodar migrations `20260609100002` (criptografia) nem `20260714200000` (trigger slack).
- **Não** mexer em lógica Stripe/pagamento.
- **Não** renomear `user_integrations`.

## Parte 1 — Conta demo

1. Criar usuário via `supabase.auth.admin` (edge function ad-hoc ou insert direto no auth) com credenciais fixas que eu devolvo no relatório:
   - email: `avaliador.demo+<timestamp>@focusinteligente.com.br`
   - senha: gerada e revelada no relatório final
   - `email_confirm: true` para pular verificação
2. Os triggers `handle_new_user`, `assign_admin_role`, `create_default_subscription`, `populate_demo_data` e `init_funnel_stage` já criam profile, role `user`, subscription gratuita, dados-seed (2 contas, 3 transações, 3 colaboradores, 2 campanhas, 3 projetos, 3 clientes, 3 tarefas, 2 processos, 3 itens de agenda, 2 notes) e estágio de funil. Nada a fazer manualmente para isso.
3. Complementar via `supabase--insert` para atender ao pedido específico:
   - 1 cliente extra com e-mail de domínio corporativo (`contato@nubank.com.br`) para testar Firecrawl.
   - Marcar `onboarding_progress.completed = true` para o Painel abrir direto.
4. Login manual via Playwright (localhost:8080) para validar acesso e capturar screenshot do Painel.

## Parte 2 — Testes A–E

Executados via Playwright headless contra `http://localhost:8080`, logado como a conta demo. Cada passo com screenshot.

### A) Enriquecimento Firecrawl (`enrich-client`)
- Abrir cliente Nubank → clicar "Enriquecer empresa" → "Buscar dados".
- Capturar: status HTTP, corpo da resposta da edge function (via `supabase--curl_edge_functions` como fallback direto), texto do toast, painel resultante.
- Ponto frágil já mapeado: caminho do gateway em `_shared/firecrawl.ts` usa `/firecrawl` + `/v1/scrape` (v1, não v2) e lê `data.json ?? data.extract` — vou logar a resposta bruta se falhar.

### B) Google Agenda 2-vias
- Checar em `Integrações` se há botão "Conectar Google". Como a conta é nova e não vou completar OAuth (requer interação humana no consent do Google), o teste real de `create_event` não é executável de forma automatizada.
- Reportar: presença dos secrets `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (ambos já configurados), presença do botão, e limitação de que o OAuth interativo não roda em headless sem credenciais Google reais.

### C) Gmail send_email
- Mesma limitação de B — sem Google conectado, marcar como "não testável sem OAuth interativo" e reportar se o botão/fluxo aparece corretamente.

### D) Slack
- Verificar `SLACK_API_KEY` (existe) e chamar edge function que dispara alerta/relatório (identificar qual: provavelmente `notify-slack` ou `cron-funnel-progression`).
- Se houver canal padrão configurado no user_preferences/whatsapp_preferences equivalente, disparar e capturar retorno.
- Se depender de config do usuário no app, reportar o que falta.

### E) Design
- Screenshot dos tooltips em cada módulo (Finanças, Clientes, Projetos, Tarefas, Marketing, RH) com mouseover em ponto do gráfico → validar cor do texto vs. tema.
- Navegar a `/guia` e capturar frame inicial → confirmar se aparece skeleton ou texto "Carregando...".

## Parte 3 — Relatório final
Tabela A–E com:
- ✅ / ⚠️ / ❌
- Mensagem exata do toast + status HTTP das edge functions
- Screenshot referenciado
- O que falta para os itens bloqueados por OAuth

E ao final: **email + senha da conta demo** em bloco destacado.

## Notas técnicas
- Uso `supabase--curl_edge_functions` com Authorization gerado a partir do login da conta demo (via Playwright pegando o access_token do localStorage) para validar `enrich-client` isoladamente e capturar status HTTP puro.
- Todos os screenshots vão para `/tmp/browser/demo-audit/`.
- Nenhuma migration nova será criada.

## Confirma?
Se aprovar, eu executo tudo em sequência e devolvo o relatório + credenciais.
