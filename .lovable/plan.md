# Divulgação do Hub Empresarial via MCP

Objetivo: transformar a disponibilidade do servidor MCP (`https://hnextembswhejumvxbzd.supabase.co/functions/v1/mcp`) em um diferencial competitivo comunicado em todos os pontos de contato — site, app, docs, SEO e canais externos.

## 1. Landing page dedicada `/mcp` (nova)

Página pública, indexável, focada em conversão + AEO.

Seções:

- **Hero**: "Converse com seu Hub direto do ChatGPT, Claude, Cursor e Codex" + botão "Conectar via MCP".
- **O que é MCP** (2 parágrafos didáticos + link para modelcontextprotocol.io).
- **Ferramentas disponíveis** (grid com os 9 tools do manifest: list_clientes, list_projetos, list_tarefas, create_tarefa, financeiro_resumo, funnel_summary, list_hot_leads, mark_contacted, send_conversion_nudge — com títulos, descrições e badges read-only/admin-only).
- **Guia de conexão** (tabs: ChatGPT, Claude Desktop, Cursor, Codex) com URL do servidor, passo a passo do OAuth e print de exemplo.
- **Casos de uso** ("Peça ao ChatGPT o resumo financeiro do mês", "Crie tarefas por voz", "Puxe leads quentes no Claude").
- **Segurança**: OAuth 2.1 + Supabase Auth, RLS por usuário, tokens nunca expostos.
- **FAQ** (5 Q&As) — alimenta AEO.
- CTA final: "Já é cliente? Conecte agora / Ainda não? Teste 7 dias grátis".

SEO/GEO:

- `<title>` "Hub Empresarial no ChatGPT e Claude via MCP | Focus Inteligente"
- JSON-LD `SoftwareApplication` + `FAQPage` + `HowTo` (conectar via MCP).
- Adicionar `/mcp` ao `sitemap.xml` e listar em `llms.txt` / `llms-full.txt`.

## 2. Card na Home e no Guia

- **DashboardHero** ou nova seção compacta: badge "Novo: Conecte via MCP" com link para `/mcp`.
- **Guia** (`/guia`): adicionar entrada "Conectar ao ChatGPT/Claude" com o passo a passo resumido.
- **UserMenu**: item "Integrações MCP" abrindo `/mcp`.

## 3. Página pública comparativa e glossário

- `**/comparar**`: adicionar linha "Integração nativa com ChatGPT/Claude via MCP" (Hub ✓, demais ✗).
- `**/glossario**`: adicionar termos "MCP", "Tool calling", "OAuth 2.1", "Assistente externo".

## 4. Metadados e conteúdo para LLMs

- `public/llms.txt` e `llms-full.txt`: nova seção "Integração MCP" com URL do servidor, lista de tools e exemplos de prompt.
- `index.html`: acrescentar item ao `featureList` do JSON-LD ("Servidor MCP para ChatGPT, Claude, Cursor").
- `robots.txt`: já permite crawlers de IA — apenas garantir que `/mcp` não esteja bloqueado.

## 5. E-mail e in-app para base atual

- Broadcast (via `BroadcastDialog` já existente) para assinantes ativos anunciando o recurso.
- Notificação in-app one-shot (`notifications` table) com CTA para `/mcp`.
- Banner sazonal opcional no dashboard (padrão dos banners já existentes, com dismiss).

## 6. Divulgação externa (assets prontos, sem código)

Entrego no plano os textos + roteiros; publicação é manual pelo usuário:

- Post LinkedIn (versão longa PT-BR).
- Thread X/Twitter (5 tweets).
- Post no changelog/blog (`/blog/hub-mcp` — opcional, mesma landing serve).
- Submissão ao diretório oficial: PulseMCP, mcp.so, Smithery, Awesome-MCP (GitHub).
- Vídeo curto (Loom) — roteiro de 60s.

## 7. Analytics

- Eventos GA4 (`G-22MBML9K19` já instalado): `mcp_page_view`, `mcp_connect_click`, `mcp_docs_tab_change`.
- Meta de conversão: cliques em "Conectar via MCP" na landing.

## Escopo desta primeira entrega (o que codar)

Fase 1 (essencial, ~1 iteração):

1. Nova página `src/pages/Mcp.tsx` + rota em `App.tsx`.
2. Atualizar `sitemap.xml`, `llms.txt`, `llms-full.txt`, `index.html` (JSON-LD).
3. Card "Novo: MCP" no Dashboard + item no UserMenu.
4. Linha nova em `/comparar` e 4 termos em `/glossario`.
5. Eventos GA4 na landing.

Fora do escopo desta fase (para depois, se aprovar):

- Broadcast e notificação in-app (requer disparo controlado pelo usuário).
- Blog post separado, vídeo, submissões em diretórios externos (assets entregues como texto, publicação manual).

## Perguntas em aberto

- Confirma criar a landing em `/mcp` (ou prefere `/integracoes/mcp`)?
- Quer que eu já dispare o broadcast para assinantes nesta rodada, ou só preparar o texto? Pode disparar, como não tem assinates dispare para todos os usuários.
- Publicar em diretórios externos (PulseMCP, mcp.so) você mesmo faz, ou quer que eu prepare os JSONs de submissão? Quero que você faça isso