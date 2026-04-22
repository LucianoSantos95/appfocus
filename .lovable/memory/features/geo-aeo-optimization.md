---
name: GEO/AEO Optimization
description: Otimização para indexação em mecanismos de IA (ChatGPT, Claude, Gemini, Perplexity) com llms.txt, JSON-LD expandido, FAQ schema, robots permitindo crawlers de IA, e páginas de SEO `/glossario` e `/comparar`.
type: feature
---

# GEO/AEO (Fase 4)

Otimização para que o Hub Empresarial seja encontrado e citado por mecanismos de busca de IA.

## Arquivos públicos
- `public/llms.txt` — resumo curto (estilo llms.txt) para crawlers de IA.
- `public/llms-full.txt` — versão completa com módulos, planos, integrações, casos de uso.
- `public/robots.txt` — permite explicitamente GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, anthropic-ai, Claude-Web, PerplexityBot, Google-Extended, CCBot.
- `public/sitemap.xml` — inclui `/comparar` e `/glossario`.

## JSON-LD em `index.html`
- `SoftwareApplication` com `featureList`, `inLanguage`, preços atualizados.
- `Organization` (Focus Inteligente).
- `FAQPage` com 5 Q&As principais (cobertura para AEO em ChatGPT/Perplexity).

## Páginas de SEO
- `/glossario` — `Glossario.tsx` com 18 termos e schema `DefinedTermSet`.
- `/comparar` — `Comparar.tsx` com tabela Hub vs Planilhas/Trello/ERP e schema `Article`.

## Princípios
- Conteúdo em português, factual, citável.
- Cada página com `<title>`, meta description e canonical próprios.
- Schema.org embutido para máxima legibilidade por LLMs.
