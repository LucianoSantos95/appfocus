
## Objetivo

Eliminar a tela `DemoModulePreview` (que mostra dados fictícios em um layout próprio) e fazer o onboarding levar o usuário direto para a página real do módulo escolhido (`/financas`, `/clientes`, `/projetos` ou `/`). O banner de cupom no topo continua igual. O Hub Assistant abre com a mensagem contextual e passa a ser **arrastável**, para o usuário poder posicioná-lo onde quiser enquanto explora a interface real.

## Arquivos a alterar

### 1. `src/pages/Financas.tsx`, `src/pages/Clientes.tsx`, `src/pages/Projetos.tsx`, `src/pages/Index.tsx`
- Remover o early-return que renderiza `<DemoModulePreview module="..." />`.
- Remover qualquer injeção de dados fictícios (`dadosFinanceiro`, `dadosClientes`, `dadosProjetos`, `dadosPainel`) e o badge "Modo demonstração".
- As páginas voltam a renderizar 100% como já fazem hoje, com os dados reais do Supabase (vazios para um usuário novo — é exatamente o estado em que ele vai começar a operar).

### 2. `src/components/onboarding/DemoModulePreview.tsx`
- **Remover do projeto** (não é mais usado por nenhuma página).

### 3. `src/lib/demo-data.ts`
- Manter apenas o tipo `DemoModule` e o objeto `ASSISTANT_MESSAGES` (usados pelo OnboardingFlow e pelo chat).
- Remover `dadosFinanceiro`, `dadosClientes`, `dadosProjetos`, `dadosPainel` (não são mais consumidos por ninguém).

### 4. `src/contexts/DemoDataContext.tsx`
- Mantido como está. `demoModule` continua sinalizando "estou no fluxo de demonstração" para:
  - `MainLayout` mostrar o `DemoCouponBanner`.
  - O assistente saber quando deve aparecer aberto.

### 5. `src/components/onboarding/OnboardingFlow.tsx`
- Sem mudança de fluxo: continua chamando `startDemo(module)`, criando a sessão, salvando a mensagem do assistente em `localStorage` e navegando para a rota do módulo. O usuário cai direto na página real.

### 6. `src/components/chat/AIChatWidget.tsx` — tornar arrastável
- Adicionar estado de posição (`{ x, y }`) no componente, inicializado no canto inferior direito (mesma posição atual).
- Implementar drag via `onPointerDown` no header do chat: ao pressionar, capturar o ponteiro, atualizar posição em `onPointerMove`, soltar em `onPointerUp`.
- Aplicar a posição via `style={{ transform: \`translate(${x}px, ${y}px)\` }}` no container, mantendo as classes Tailwind atuais de tamanho/sombra.
- Limitar a posição às bordas do viewport (`Math.min/Math.max`) para o widget não sair da tela.
- Persistir a última posição em `localStorage` (`hub_assistant_position`) para sobreviver à navegação.
- Em mobile (`useIsMobile`), o widget continua fullscreen — drag fica desativado.
- Cursor do header passa a `cursor-grab` / `cursor-grabbing` durante o drag.
- Mensagem pré-gerada do onboarding (já implementada) continua funcionando: o assistente abre automaticamente com o texto do `ASSISTANT_MESSAGES[module]` quando o usuário chega na página do módulo.

### 7. Banner de cupom (`DemoCouponBanner.tsx`)
- Sem alterações: continua fixo no topo enquanto `demoModule` estiver ativo, com os dois CTAs ("Assinar agora com desconto" / "Começar com meus dados reais").

## Comportamento final

1. Usuário escolhe um foco no `WelcomeChoiceModal` (Finanças / Clientes / Projetos / Ver tudo).
2. Vai para a página real do módulo, **vazia** (os dados de demonstração não existem mais; ele vê o estado real).
3. Banner de cupom aparece no topo.
4. Hub Assistant abre automaticamente no canto, com a mensagem contextual explicando o módulo e indicando o botão a clicar ("+ Nova Transação", "+ Novo Cliente", "+ Novo Projeto").
5. Usuário pode **arrastar** o assistente para qualquer canto da tela enquanto vai clicando nos botões reais e cadastrando seus dados.
6. Em qualquer momento ele pode usar os CTAs do banner para assinar (com cupom `FOCUS20`) ou encerrar a demonstração.

## Restrições respeitadas

- Stripe, autenticação, sidebar, módulos e schema do banco permanecem intactos.
- Nenhum dado fictício é mais escrito em estado da página: o usuário vê desde o início a interface real do Hub.
- Hub Assistant existente é reutilizado; só ganhou drag.

