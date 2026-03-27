

# Implementar SEO para Google Search

## Alterações

### 1. `public/sitemap.xml` (novo)
Criar sitemap com todas as rotas públicas do Hub:
- `/` (auth/landing)
- `/auth`
- `/planos`
- `/termos`
- `/privacidade`

### 2. `public/robots.txt` (atualizar)
Adicionar referência ao sitemap: `Sitemap: https://appfocus.lovable.app/sitemap.xml`

### 3. `index.html` (atualizar)
- Melhorar meta description com palavras-chave relevantes (gestão empresarial, agências, consultorias, ERP)
- Adicionar `<link rel="canonical">` 
- Adicionar Schema markup JSON-LD do tipo `SoftwareApplication` com nome, descrição, categoria e oferta
- Adicionar `<meta name="keywords">` com termos relevantes
- Atualizar OG tags com URL absoluta da imagem

### 4. `src/components/seo/PageMeta.tsx` (novo)
Componente usando `react-helmet-async` para definir `<title>` e `<meta description>` dinâmicos por página. Cada rota terá título e descrição únicos.

### 5. `src/main.tsx` (atualizar)
Envolver o App com `HelmetProvider` do `react-helmet-async`.

### 6. Adicionar `PageMeta` nas páginas principais
Cada página (Index, Financas, RH, Marketing, Projetos, Clientes, Tarefas, Processos, Guia, Auth, Planos) receberá um `<PageMeta title="..." description="..." />` com conteúdo único.

## Próximos passos pós-implementação
- Conectar domínio customizado (recomendado para SEO)
- Registrar no Google Search Console e enviar o sitemap

