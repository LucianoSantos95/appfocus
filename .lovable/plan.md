
# Novo Onboarding Hub Empresarial — Fluxo Visual com Demo

Substituir o fluxo guiado atual (welcome modal + chat + módulos 1/2/3) por um onboarding direto: o usuário escolhe um foco, vê o módulo populado com dados fictícios (apenas no estado local), o Hub Assistant abre com uma mensagem contextual e um banner de cupom oferece os próximos passos.

## Arquivos novos

- `src/contexts/DemoDataContext.tsx` — Provider com `demoMode`, `demoModule` ("financeiro" | "clientes" | "projetos" | "painel" | null), datasets fictícios e `clearDemo()`. Estado só em React, nunca persiste.
- `src/components/onboarding/WelcomeChoiceModal.tsx` — Modal fullscreen com overlay `rgba(0,0,0,0.82)`, logo, saudação `Olá, [primeiro nome] 👋`, grid 2x2 (cai para coluna única em mobile) com 4 botões nos estilos especificados, rodapé com texto auxiliar.
- `src/components/onboarding/DemoCouponBanner.tsx` — Banner fixo no topo (abaixo da navbar) com gradiente azul, texto do cupom à esquerda e dois CTAs à direita: "Assinar agora com desconto →" e "Começar com meus dados reais".
- `src/lib/demo-data.ts` — Datasets fictícios exatamente como no brief (financeiro, clientes, projetos, painel).

## Arquivos alterados

- `src/components/onboarding/OnboardingFlow.tsx` — Reescrito: só mostra o `WelcomeChoiceModal`. Remove `OnboardingChat`, `OnboardingProgressBar`, módulos 1/2/3, lógica de `completeModule`/achievements/WOW. Ao escolher um foco:
  1. Marca `demoMode` no contexto com o módulo escolhido.
  2. Cria registro em `onboarding_sessions` com `segment` = escolha, `current_step="demo"`, `completed_at=null`.
  3. Dispara abertura do Hub Assistant via flag global (`localStorage` + custom event `hub-assistant:open-with-message`) com a mensagem pré-gerada do brief.
  4. Navega para a rota do módulo (`/financas`, `/clientes`, `/projetos`, ou `/` para "Ver tudo").
- `src/pages/Index.tsx`, `src/pages/Financas.tsx`, `src/pages/Clientes.tsx`, `src/pages/Projetos.tsx` — Quando `demoMode` ativo e o módulo bate, injetar os dados fictícios no lugar dos dados reais (overlay simples no nível da página, sem tocar nos hooks Supabase). Mostrar badge sutil "Modo demonstração" perto do título.
- `src/components/layout/MainLayout.tsx` — Renderizar `DemoCouponBanner` no topo quando `demoMode` ativo.
- `src/components/chat/AIChatWidget.tsx` — Escutar o evento `hub-assistant:open-with-message`: abrir o widget e injetar a mensagem do assistente como primeira resposta visível (sem chamar a edge function). Apenas no estado local do widget.
- `src/App.tsx` — Envolver a árvore autenticada com `<DemoDataProvider>`.
- `src/hooks/useOnboardingSession.ts` — Adicionar helper `finalizeOnboarding(couponClicked: boolean)` que faz update setando `completed_at`, `coupon_shown=true`, `coupon_code='FOCUS20'`, `coupon_expires_at=now()+48h`, `current_step='completed'`. Manter o resto do hook (a tabela continua sendo a fonte de verdade para "primeira vez").
- `src/pages/Index.tsx` — Trocar a regra de redirect para `/onboarding`: continuar redirecionando apenas quando `needsOnboarding` (sem registro na tabela). Para sessões interrompidas (registro existe, `completed_at=null`, `current_step !== 'demo'` antigo), exibir banner discreto "👋 Bem-vindo de volta!" com botões `Resgatar cupom` / `Continuar explorando` — novo componente leve embutido no Index.

## Arquivos a remover (não usados mais)

- `src/components/onboarding/OnboardingChat.tsx`
- `src/components/onboarding/OnboardingWelcomeModal.tsx`
- `src/components/onboarding/OnboardingProgressBar.tsx`
- `src/components/onboarding/OnboardingCouponPreview.tsx`
- `src/components/onboarding/WowMomentCard.tsx`
- Edge function `supabase/functions/onboarding-assistant` permanece (pode ser usada pelo Hub Assistant em outro fluxo), mas não é mais chamada pelo onboarding.

A tabela `onboarding_sessions` é mantida no banco — só mudamos como ela é usada (sem migração).

## Comportamentos do banner de cupom

- "Assinar agora com desconto" → chama `finalizeOnboarding(true)`, limpa `demoMode`, navega para `/planos` (cupom `FOCUS20` aplicado automaticamente pela lógica de checkout já existente).
- "Começar com meus dados reais" → chama `finalizeOnboarding(false)`, limpa `demoMode`, fecha o banner; usuário permanece no módulo atual agora com dados reais (vazios).

## Restrições respeitadas

- Nada muda em Stripe, Google Auth, sidebar, módulos, schema do banco.
- Dados fictícios apenas em React state; nenhum INSERT em tabelas de domínio.
- Hub Assistant existente é reutilizado, não recriado.
- Mobile: grid `grid-cols-1 md:grid-cols-2` no modal.

## Pontos a confirmar antes de codar

1. Para o card "🚀 Ver tudo" o Painel Principal deve mostrar os 4 KPIs fictícios (`receitaMes`, `tarefasVencidas`, `projetosAtrasados`, `clientesSemContato`) no `HealthSummary`, sobrescrevendo os valores reais enquanto em demo — confirma?
2. Posso remover de fato os arquivos antigos listados acima (OnboardingChat, WowMomentCard, etc.) ou prefere mantê-los no repo desativados?
