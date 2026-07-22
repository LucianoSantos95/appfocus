# Nova landing `/` e `/auth` — Hub Empresarial

Reescreve `src/pages/Auth.tsx` do zero como landing de alta conversão no modelo "all-in-one que substitui suas ferramentas" + diferencial IA/MCP. Zero mudança em lógica de auth, pagamento, MCP ou banco. Só página + subcomponentes visuais.

## Design system (o real, sem inventar)

- Fontes já carregadas: **Instrument Serif itálico** (`.font-display`) nos títulos-herói, **Work Sans** no corpo, **JetBrains Mono** (`font-mono`) em eyebrows, métricas e bloco de código.
- Paleta: usa tokens `--background`, `--foreground`, `--primary` (teal do light mode, `167 100% 42%`), `--muted-foreground`, `--border`. Nada de hex hardcoded. Destaque = `.gradient-text` ou `text-primary italic font-display`.
- Marca: **Hub Empresarial**, logo real `src/assets/logo.png`. Rodapé: "© 2026 Focus Gestão Inteligente · São Paulo · BR".
- Componentes reutilizados: `Button`, `Card`, `Accordion`, `FadeIn`/`Stagger`/`CountUp` de `src/components/motion`. Respeita `prefers-reduced-motion` (já embutido nesses componentes).
- Força **light mode** na entrada da landing (via `ThemeContext.setTheme('light')` no mount, sem persistir), já que o mock é claro.

## CTAs (ligados aos fluxos que já existem)

- "Começar grátis" → `setSignupOpen(true)` (AuthSignupDialog atual).
- "Entrar" → `setLoginOpen(true)` (AuthLoginDialog atual).
- "Ver demo ao vivo" → `handleDemoLogin()` atual (demo@focusinteligente.com.br).
- Preços → `create-asaas-checkout` já usado em `/planos` (importa o mesmo helper OU navega para `/planos` com plano pré-selecionado — usar `navigate('/planos')` para não duplicar a lógica).
- "Ver página completa do MCP →" → `<Link to="/mcp">`.

## Estrutura de arquivos

Um arquivo `Auth.tsx` fica gigante. Split em subcomponentes dentro de `src/components/landing/`:

```text
src/components/landing/
├─ LandingNav.tsx
├─ LandingHero.tsx
├─ InteractivePanel.tsx       (o card do hero que cicla 4 meses)
├─ SocialProofBar.tsx
├─ ReplacesSection.tsx        (seção "1 Hub. 6 assinaturas a menos")
├─ ThreePillars.tsx
├─ AiTerminalSection.tsx      (terminal fake com Q&A)
├─ McpSection.tsx
├─ ModulesGrid.tsx
├─ PricingSection.tsx
├─ FinalCta.tsx
└─ LandingFooter.tsx
```

`src/pages/Auth.tsx` vira orquestrador: mantém os dialogs (`AuthLoginDialog`, `AuthSignupDialog`), `handleDemoLogin`, `handleGoogleLogin`, captura UTM e monta as seções na ordem.

Também garantir que `/` renderiza esta mesma landing (verificar `src/App.tsx` — se `/` já aponta para outra coisa quando não logado, ajustar route). Se `/` já cai em `Auth` para deslogados, não mexer.

## Seções (ordem final)

1. **Nav** — logo + "Hub Empresarial" · links âncora (Por que o Hub, IA & MCP, Módulos, Preços) · Entrar + "Começar grátis".
2. **Hero** — duas colunas. Eyebrow mono teal "GESTÃO COM IA · FEITO NO BRASIL". Título Instrument Serif: "Um Hub pra substituir suas *6 ferramentas* de gestão." Subtítulo, dois CTAs, microtrust mono. À direita: `InteractivePanel`.
3. **InteractivePanel** — 4 estados (Jul/Ago/Set/Out) cicla a cada 3.4s com `AnimatePresence`. Mostra Receita/Despesa/Saldo/Delta + mini-gráfico SVG de linha que redesenha via `motion.path` com `pathLength` de 0→1, ponto final animado, delta muda cor (teal ↑ / laranja `--destructive` ↓), texto "Insight da IA" troca em sincronia. `useReducedMotion` → troca sem animar.
4. **Social proof** — "+100 operações já rodam no Hub Empresarial" + badges de segmento com hover subindo.
5. **Substitui tudo isso** — título + lista com itens riscados (line-through) dos concorrentes.
6. **Três pilares** — cards com hover-lift.
7. **AI Terminal** — grid 2 col; à esquerda copy "Converse com a sua *operação*"; à direita card `bg-slate-900 text-slate-50 font-mono` com prompt teal (`text-primary`), respostas com números reais dos meses do painel, cursor `▋` piscando (CSS keyframe já existe).
8. **MCP** — badge NOVO + explicação + 3 passos + bloco de código com `https://hnextembswhejumvxbzd.supabase.co/functions/v1/mcp` (botão copy) + badges (ChatGPT, Claude, Cursor, Codex) + link `→ /mcp`.
9. **Módulos** — grid 6 cards (Finanças, Clientes, Projetos, Tarefas, Marketing, RH·Processos) com ícone + título + subtítulo de resultado. Hover-lift.
10. **Preços** — 4 cards (Grátis, Plus R$69 "MAIS POPULAR", Pro R$149, Enterprise R$297). Botão do card gratuito abre signup; demais → `navigate('/planos')`.
11. **CTA final** + **Footer**.

## Interações e movimento

- Botões primários: classe utilitária local — `transition-all hover:-translate-y-0.5 hover:shadow-premium` + seta `→` com `group-hover:translate-x-1`.
- Cards (pilares/módulos/preços): `hover:-translate-y-1 hover:border-primary/40 transition-all`.
- Badges: `hover:-translate-y-0.5 hover:border-primary` transition.
- Todas as seções envolvidas em `FadeIn` + `Stagger` (já existentes) para reveal on-mount.

## Guardrails

- Não mexer: `AuthContext`, `AuthLoginDialog`, `AuthSignupDialog`, checkout Asaas, edge functions, `Mcp.tsx`, tokens de `index.css`.
- Manter `PageMeta` no topo com título/descrição atuais.
- Não introduzir libs novas (framer-motion, lucide, radix já estão).
- Sem hardcode de cor — só tokens.
- MCP url: usar a existente em `src/pages/Mcp.tsx` (`https://hnextembswhejumvxbzd.supabase.co/functions/v1/mcp`) — colar como constante, não deixar hardcoded no meio do JSX.

## Verificação após build

1. `/auth` deslogado renderiza a nova landing em light mode.
2. Signup, Login e "Ver demo ao vivo" abrem os fluxos atuais.
3. Painel interativo cicla 4 estados e para com `prefers-reduced-motion`.
4. Link MCP vai para `/mcp` real.
5. Botões de preço abrem `/planos` (checkout Asaas existente).
6. Sem erros no console; sem warnings de token hardcoded.
