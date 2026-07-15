
# Plano: Integrações no Fluxo + Identidade Visual Própria

Dois eixos que atacam exatamente o feedback da Lovable. Cada eixo tem fases independentes que podem ser aprovadas/executadas em partes.

---

## EIXO 1 — Integrações Tecidas no Fluxo (sair de "Configurações")

**Diagnóstico:** hoje Google, Slack, Firecrawl, Gmail, WhatsApp são toggles em `Configurações → Integrações`. O usuário precisa *descobrir* que existem. A meta é fazer com que a integração apareça **no momento exato em que agrega valor**, dentro do card/tela onde o trabalho está acontecendo.

### Fase 1.1 — Clientes/CRM (impacto alto, esforço médio)

**A) Firecrawl automático ao criar prospect**
- No `ClientesKanban` / dialog de novo cliente: quando o usuário digita um domínio no campo `site`, disparar `enrich-client` em background (debounce 800ms).
- Preencher automaticamente `segmento`, `porte`, `descricao_ia` como *sugestões editáveis* (badge "Sugerido por IA").
- Sem clique manual em "Enriquecer". A integração vira invisível — apenas o resultado aparece.

**B) Botão "Agendar reunião no Google" em cada card de cliente**
- No `ClienteInsightsCard` e no dropdown do Kanban: ação primária "📅 Agendar reunião".
- Abre mini-dialog com título pré-preenchido (`Reunião com ${cliente.nome}`), data/hora, participantes (email do cliente + user). Cria evento via `google-integration` e adiciona ao `agenda_items` local.
- Se Google não estiver conectado: botão vira "Conectar Google para agendar" com CTA inline (não redireciona para Settings).

**C) "Enviar por Gmail" em relatórios e propostas**
- No `SendReportDialog`: adicionar toggle "Enviar via meu Gmail" (padrão: Resend). Quando ativo, usa `google-integration` action `send_email` com assinatura do usuário.
- Vantagem: e-mail sai da caixa pessoal do usuário → maior taxa de resposta, aparece no histórico do Gmail dele.

**D) Slack automático em lead quente**
- Já existe cron. Falta **surface**: quando `user_funnel_stage.stage = 'quente'` de um cliente, mostrar toast + card no Dashboard "🔥 Fernando (Empresa ABC) virou lead quente — notificação enviada ao #vendas".
- Adicionar botão "Configurar canal" inline se `slack_default_channel` for null.

### Fase 1.2 — Tarefas & Projetos (impacto alto, esforço baixo)

**A) "Notificar equipe no Slack" em tarefas urgentes**
- No card de tarefa com prioridade `urgente`: botão discreto "📢 Avisar equipe".
- Envia para `slack_default_channel` com link deep para a tarefa. Registra no `audit_log`.

**B) Prazo de projeto → evento no Google Agenda**
- Ao criar/editar projeto com `end_date`: checkbox "Adicionar deadline ao meu Google Agenda" (marcado por padrão se Google conectado).
- Cria evento all-day com alerta 1 dia antes.

**C) Reunião de projeto = agenda + convites**
- Nos `ProjetoAnexos` / detalhes: aba "Reuniões" → botão "Nova reunião" que cria evento no Google com todos os `colaboradores` alocados como participantes.

### Fase 1.3 — Marketing & Conteúdo (impacto médio)

**A) Firecrawl no `ContentCalendar` para análise de concorrentes**
- Novo widget: "Analisar site de concorrente" → cola URL → retorna resumo + sugestões de conteúdo geradas por Lovable AI baseadas no scrape.

**B) Gmail para envio de newsletter/campanha**
- No `CampanhaPromoCard`: opção "Enviar via minha conta Gmail" quando o público for pequeno (<50 contatos).

### Fase 1.4 — Dashboard como hub de integrações ativas

**Novo widget no Dashboard:** `IntegrationsPulse` — mostra em tempo real:
- "3 e-mails enviados via Gmail hoje"
- "Slack: última notificação há 12min (#vendas)"
- "2 eventos sincronizados do Google Agenda"
- "1 cliente enriquecido via Firecrawl"

Cada linha é clicável e leva ao fluxo relacionado. Isso **prova** que as integrações estão vivas, não decorativas.

### Fase 1.5 — Onboarding contextual

Durante o AI Onboarding, ao chegar no passo "Clientes": prompt do assistente sugere conectar Google *ali*, não em Settings. Botão "Conectar agora (30s)" inline no chat. Mesma coisa para Slack no passo "Equipe".

---

## EIXO 2 — Identidade Visual Própria (sair da "cara Lovable genérica")

**Diagnóstico:** Inter em tudo, azul primário 215, cards retangulares uniformes, sem tipografia display, sem momento visual memorável. Todo módulo parece o mesmo template.

### Fase 2.1 — Sistema tipográfico distintivo

**Substituir Inter por par com personalidade:**
- **Display (H1/H2/hero/números grandes):** `Instrument Serif` — serifa moderna italiana, transmite autoridade "consultiva" (fit para "Focus Inteligente")
- **Body/UI:** `Work Sans` — grotesca humanista, muito legível, distinta de Inter
- **Mono (números financeiros, códigos):** `JetBrains Mono`
- Adicionar via `<link>` no `index.html`, mapear em `tailwind.config.ts` como `font-display`, `font-sans`, `font-mono`.
- Aplicar `font-display` em: título do Dashboard, KPIs grandes (valores em R$), hero da Auth, títulos de módulo (Clientes, Finanças, RH).

### Fase 2.2 — Paleta com identidade

**Trocar azul-genérico (215 90%) por paleta "Inteligência Focada":**
- **Primary:** `#0A2540` (navy profundo) + accent `#00D4A8` (verde-menta vibrante) — evoca fintech premium + inteligência.
- **Surfaces dark:** camadas de `#0F1729` → `#1A2138` → `#242D45` (não mais preto puro).
- **Semantic:** success verde-menta, warning âmbar `#F59E0B`, danger coral `#EF4444` (nunca vermelho puro).
- **Gradientes assinatura:** `linear-gradient(135deg, #0A2540 0%, #00D4A8 100%)` — usar SÓ em hero/CTA principal.
- Atualizar `index.css` (tokens HSL), manter compatibilidade com Light mode (navy vira azul claro, menta escurece).

### Fase 2.3 — Hero Dashboard redesenhado (peça-âncora)

Hoje o Dashboard é card+card+card uniforme. Vou transformar em:

```text
┌────────────────────────────────────────────────────────────┐
│ [font-display, 48px]                                       │
│ Boa tarde, Luciano                          [avatar+status]│
│ Sua operação hoje                                          │
├──────────────┬─────────────────────────────────────────────┤
│ HERO METRIC  │  Sparkline animado dos últimos 30 dias      │
│ R$ 47.320    │  ▁▂▃▅▆▇█▇▆▅▃  ↑ 23% vs mês passado         │
│ [display]    │                                              │
├──────────────┴─────────────────────────────────────────────┤
│ 3 KPIs pequenos  │  Integrations Pulse (fase 1.4)          │
├────────────────────────────────────────────────────────────┤
│ Agenda hoje (glass card com timeline vertical)             │
│ Bulletin (post-it style, rotacionado -1deg)                │
└────────────────────────────────────────────────────────────┘
```

- **Asymmetric grid** (60/40), não mais 3 colunas iguais.
- **Glass morphism** nos cards secundários (`backdrop-blur-xl` + `bg-white/[0.03]` no dark).
- **Sparkline animado** com Recharts + `motion` (draw-on-mount 800ms).
- **Number counter animation** no KPI hero (0 → valor final em 1.2s com easing).

### Fase 2.4 — Densidade diferenciada por módulo

Cada módulo ganha personalidade visual, não é mais o mesmo template:

- **Clientes:** Kanban com cards de altura variável, avatar grande, glow sutil no card "hot lead".
- **Finanças:** densidade alta, tabelas com `font-mono` para valores, mini-charts inline em cada linha.
- **RH:** feel "humano" — fotos redondas grandes, timeline vertical de aniversários/férias com ilustrações.
- **Marketing:** feel "editorial" — grid tipo magazine, tipografia display maior, mais respiração.
- **Projetos:** Kanban com progress bars grossas e coloridas, deadline em destaque tipográfico.

### Fase 2.5 — Motion intencional (não decorativo)

Usar `framer-motion` já instalado:
- **Route transitions:** fade + slide sutil (não o padrão instantâneo).
- **Card hover:** elevação em Y (-2px) + shadow expansion, 200ms.
- **KPI counter:** count-up animation ao entrar no viewport.
- **Success moments:** confete micro (10 partículas) quando cliente vira "ativo", tarefa é concluída, meta é batida. Usa `canvas-confetti`.
- **Skeleton loading:** shimmer horizontal (não pulse padrão) — sensação de "processando".
- **Empty states:** ilustrações SVG customizadas com micro-animação de flutuar (não emoji genérico).

### Fase 2.6 — Detalhes de acabamento

- **Shadows:** `--shadow-elegant: 0 20px 40px -20px hsl(var(--primary) / 0.25)` — não sombra genérica.
- **Border radius:** hierarquia — 4px (inputs), 8px (cards), 16px (dialogs), 24px (hero). Consistência = polimento.
- **Focus states:** ring com cor primary + glow (`ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]`).
- **Scrollbars customizadas:** `::-webkit-scrollbar` fino, cor semântica.
- **Cursor:** `cursor-pointer` explícito em elementos interativos que não são `<button>` nativo.

### Fase 2.7 — Auth/Landing redesenho

A `Auth.tsx` já foi trabalhada, mas ainda tem cara de template. Aplicar:
- Hero com `Instrument Serif` gigante em italic ("Sua operação, focada.")
- Gradient assinatura como background sutil (radial no canto superior).
- Formulário em glass card centralizado.
- 3 provas sociais discretas no rodapé (logos de "clientes" fictícios/reais).

---

## Ordem de execução recomendada

**Sprint 1 (impacto imediato, 1 sessão):**
- 1.1.A (Firecrawl automático em clientes)
- 1.1.B (Agendar Google no card de cliente)
- 1.4 (widget IntegrationsPulse)
- 2.1 (tipografia)
- 2.2 (paleta)

**Sprint 2 (aprofundamento visual):**
- 2.3 (Hero Dashboard)
- 2.5 (motion)
- 2.6 (acabamentos)

**Sprint 3 (integrações restantes + personalidade por módulo):**
- 1.1.C, 1.1.D, 1.2 completa
- 2.4 (densidade por módulo)

**Sprint 4 (polimento final):**
- 1.3, 1.5
- 2.7 (Auth)

---

## Guardrails mantidos

- Não recriar `get_integration_tokens` / `upsert_integration` / `update_integration_access_token`
- Não renomear `user_integrations`
- Não aplicar migration de criptografia
- Não mexer em Stripe
- `client.ts` e `types.ts` do Supabase permanecem auto-gerados

---

## Resultado esperado nas notas

- **Uso de conectores:** 6,5 → **9,0** (integrações visíveis no trabalho diário, não em settings)
- **Polimento de design:** 6,0 → **8,5** (identidade tipográfica + paleta + motion + hierarquia por módulo)

---

**Aprovando este plano, começo pelo Sprint 1** (que já entrega salto visível em ambas as frentes numa única execução). Você pode também escolher só o Eixo 1 ou só o Eixo 2, ou pedir para eu detalhar mais alguma fase antes de rodar.
