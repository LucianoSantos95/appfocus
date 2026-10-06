# Hub Central — Focus Inteligente

Catálogo público de templates Notion (gratuitos e pagos) com captura de leads, entrega automática do material, e-mails transacionais e painel administrativo com métricas de funil e de tráfego.

Site em produção: <https://app.focusinteligente.com.br>

> **Histórico.** O projeto nasceu como "Hub Empresarial", um SaaS de gestão com login, planos e integrações. Em 2026 foi reconstruído como catálogo sem login e 100% gratuito. Parte do código e das Edge Functions daquela fase ainda está no repositório (veja [Legado](#legado)).

## O que faz

**Para o visitante**

- Vitrine de produtos em abas, com galeria, detalhe e formulário curto (nome, e-mail, WhatsApp opcional) para receber o template.
- Entrega por e-mail e link de acesso por token (`/acesso/:token`), com reenvio.
- Produtos pagos: checkout via Asaas; o acesso é liberado automaticamente quando o webhook de pagamento confirma.
- Feedback e suporte.

**Para o administrador (`/admin`)**

- Produtos: criar, editar, arquivar, excluir, reordenar, destaque temporário.
- Leads, feedbacks, vendas e mensagens de contato.
- Métricas: visitas, cliques, leads e taxa de conversão por período; funil por produto; origem do tráfego e visitantes em tempo real (Supabase Realtime).
- E-mail: envio manual segmentado por produto, rascunho gerado por IA, métricas de entrega e abertura.

## Rotas

| Rota | Conteúdo |
| --- | --- |
| `/` | Catálogo |
| `/templates-notion-gratuitos` | Página de aquisição (SEO), pré-renderizada com `react-snap` |
| `/acesso/:token` | Entrega do produto comprado ou baixado |
| `/auth` | Login do administrador |
| `/admin` | Painel (rota protegida) |
| `/avaliacao-recebida` | Confirmação de feedback |
| `/termos`, `/privacidade` | Páginas legais |

## Stack

- **Front-end:** React 18, TypeScript, Vite 5, Tailwind CSS 3, shadcn/ui (Radix), React Router 7, TanStack Query 5, Recharts, Zod
- **Back-end:** Supabase (Postgres com RLS, Auth, Storage, Realtime, Edge Functions em Deno)
- **E-mail:** Resend · **Pagamento:** Asaas · **IA:** Lovable AI Gateway
- **Testes:** Vitest + Testing Library (jsdom)
- **Hospedagem:** Lovable (as alterações no `main` sincronizam com o projeto)

## Estrutura

```
src/
  pages/           telas do roteador
  components/
    central/       catálogo público
    admin/         painéis do /admin
    ui/            componentes shadcn
  lib/             regras sem UI: eventos, buscarTodas, sanitize, schemas, owner
  integrations/    cliente Supabase e tipos gerados
supabase/
  functions/       Edge Functions
  migrations/      migrações SQL (fonte de verdade do banco)
drizzle/           migrações geradas pelo fluxo do Lovable (espelho)
.lovable/          notas e planos gerados pelo agente do Lovable
```

## Decisões que valem registro

- **Segurança no banco, não no front-end.** Toda tabela tem RLS; as chaves do navegador são públicas por desenho. O limite de tentativas de login fica no servidor (`login-guard`, por e-mail + IP) e as funções SQL sensíveis não são chamáveis pelo navegador.
- **Contagem de downloads vem do banco.** `produtos.downloads` é recalculado por trigger a partir das linhas reais de `leads`; nunca é incrementado à mão.
- **Listas do admin passam por `buscarTodas`** (`src/lib/buscarTodas.ts`), que pagina a consulta porque o PostgREST corta respostas em 1000 linhas.
- **E-mail só por referência.** `send-thanks-email` recebe apenas o id do lead/feedback e lê destinatário, produto e link do banco; os tipos automáticos exigem a chave de servidor.
- **Webhook de pagamento validado.** `asaas-webhook` confere o token configurado antes de liberar qualquer acesso.
- **Eventos nunca quebram a página.** `registrarEvento` (`src/lib/eventos.ts`) engole falhas de rede; mede origem (referrer/UTM) e usa um id de sessão por aba (`sessionStorage`), sem cookies.
- **HTML sanitizado.** Textos digitados por visitantes (suporte, feedback) e conteúdo de produto passam por DOMPurify (`src/lib/sanitize.ts`).

## Rodando localmente

```bash
npm install        # ou bun install
cp .env.example .env   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev        # http://localhost:5173
```

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (+ pré-renderização com `react-snap`, se houver Chromium) |
| `npm test` | Testes (Vitest) |
| `npm run lint` | ESLint |

### Variáveis de ambiente

O front-end só precisa de `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Os segredos das Edge Functions (service role, Resend, Asaas, IA) são configurados no painel do Supabase e **nunca** entram no repositório; a lista está comentada em [`.env.example`](.env.example).

## Testes

`src/lib/*.test.ts` cobre a lógica pura e os pontos onde um erro silencioso custaria dados: paginação do `buscarTodas`, comparação do e-mail do dono, sanitização contra XSS, validação dos formulários e o registro de eventos (origem, UTM, sessão, tolerância a falha).

## Legado

Restos do Hub Empresarial ainda presentes e **não usados pelo catálogo atual**: `PlanContext` e `DemoDataContext` em `src/contexts`, schemas antigos em `src/lib/schemas.ts` e Edge Functions como `create-checkout` (Stripe), `sync-subscribers`, `send-bi-report`, `whatsapp-scheduler` e a família `cron-*`. Antes de remover qualquer função já publicada, confira no Supabase se ela ainda tem agendamento (`pg_cron`) ou invocações recentes.

## Licença

Todos os direitos reservados. O código está público como portfólio; não há licença de uso concedida.
