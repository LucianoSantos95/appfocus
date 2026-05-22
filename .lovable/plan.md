# Pré-renderização estática das rotas públicas

## Objetivo

Resolver o problema de SPA sem HTML renderizado para crawlers (Googlebot, WhatsApp, LinkedIn, X) gerando HTML estático por rota pública no momento do build. **Zero alteração** de layout, design, comportamento ou conteúdo das páginas.

## Rotas públicas a pré-renderizar

Rotas hoje acessíveis sem login no projeto:

- `/auth` — login/signup
- `/planos` — preços
- `/termos` — termos de uso
- `/privacidade` — política de privacidade
- `/glossario` — termos do nicho (SEO)
- `/comparar` — Hub vs Planilhas/Trello/ERP (SEO)

`/` e demais rotas estão atrás de `<ProtectedRoute>` e redirecionam para `/auth`, portanto não fazem sentido como SSG (são app autenticado). Confirmado no escopo.

## Ferramenta escolhida: `react-snap`

Decisão técnica:

- **vite-react-ssg / Vike** exigem migrar de `<Routes>` JSX para rotas data-driven (`createBrowserRouter` + arquivos de rota). Quebra arquitetura atual e o `<ProtectedRoute>`.
- **react-snap** roda como passo *post-build*: sobe um servidor local sobre `dist/`, abre cada URL com puppeteer (Chromium headless) e salva o HTML final em `dist/<rota>/index.html`. Não exige refator de roteamento.

Único ajuste de código exigido: trocar `createRoot(...).render(...)` por `hydrateRoot(...)` quando `document.getElementById("root")` já tem filhos (HTML pré-renderizado). Isso é transparente em dev (continua usando `createRoot`).

## Mudanças

### 1. Dependência
- `bun add -d react-snap`

### 2. `package.json`
- Adicionar script `"postbuild": "react-snap"`.
- Adicionar bloco `"reactSnap"` com:
  - `source: "dist"`
  - `include: ["/auth", "/planos", "/termos", "/privacidade", "/glossario", "/comparar"]`
  - `inlineCss: false` (mantém Vite chunking)
  - `puppeteerArgs: ["--no-sandbox", "--disable-setuid-sandbox"]` (necessário em CI/sandbox)
  - `skipThirdPartyRequests: true` (bloqueia Clarity/Google/Stripe durante o snapshot — evita scripts pesados no HTML estático e mantém preview limpo para crawlers)

### 3. `src/main.tsx`
- Substituir `createRoot(...).render(<App/>)` por:
  ```ts
  const rootEl = document.getElementById("root")!;
  if (rootEl.hasChildNodes()) {
    hydrateRoot(rootEl, <App/>);
  } else {
    createRoot(rootEl).render(<App/>);
  }
  ```
- Mantém `HelmetProvider` e `ThemeProvider` como estão.

### 4. Auditoria de `<PageMeta>` em rotas públicas
- Já presentes: `Termos`, `Onboarding`, `Index`.
- Verificar e completar (sem mudar layout) em: `Auth`, `Planos`, `Privacidade`, `Glossario`, `Comparar` — cada um deve emitir `<title>`, `<meta name="description">`, `<link rel="canonical">` e `og:*` próprios via `PageMeta`. Onde já existir, deixar como está.

### 5. `index.html`
- Remover `<link rel="canonical">` se estiver presente (não está hoje, mas confirmar) para evitar canônicos duplicados após Helmet rodar nas snapshots.
- Manter sitewide `og:*` como fallback — já está.
- Sem outras mudanças (Clarity, JSON-LD, CSP permanecem).

## O que **não** muda

- Nenhum componente visual, rota, contexto, hook ou estilo.
- `App.tsx`, `BrowserRouter`, `ProtectedRoute`, Suspense, lazy imports — tudo intacto.
- Comportamento em dev (`vite dev`) idêntico.
- Rotas autenticadas continuam SPA pura (não faz sentido SSG nelas).

## Limitações honestas

- O Lovable preview/publish atual serve `dist/` estaticamente, então as snapshots geradas pelo `postbuild` são entregues como `/<rota>/index.html` automaticamente — funciona sem mudança de hosting.
- **WhatsApp/LinkedIn previews** vão funcionar **apenas para as 6 rotas públicas listadas**. O app autenticado (rotas `/`, `/clientes`, etc.) continua SPA e crawlers sociais continuarão vendo shell vazio nelas — mas isso é o comportamento desejado (app interno).
- Googlebot já executa JS e indexa SPAs; o ganho real do SSG é (a) social previews para as rotas públicas e (b) TTFB de conteúdo em buscadores que não executam JS (Bing antigo, DuckDuckGo, etc.).

## Validação

Após implementar:
1. Rodar `bun run build` localmente no sandbox e confirmar que `dist/auth/index.html`, `dist/planos/index.html` etc. contêm o HTML renderizado com `<title>`, `<meta description>` e `og:*` corretos no `<head>`.
2. Abrir um dos arquivos gerados e checar se o título da página aparece no markup (não apenas no `<div id="root">`).

Aprova para eu implementar?
