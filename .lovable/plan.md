# Popup de feedback do onboarding

Reusa o `FeedbackDialog` existente (que grava em `feedbacks`) e o dispara em três momentos, no painel principal (`/`), para não atrapalhar o fluxo do onboarding em si.

## Gatilhos

1. **Concluiu o onboarding** — logo após `WelcomeChoiceModal` finalizar e o usuário cair no módulo escolhido, o popup aparece (com 3–4s de atraso) **na primeira volta ao painel**.
2. **Abandonou o onboarding** — usuário entrou em `/onboarding` mas não criou `onboarding_sessions` e voltou ao painel.
3. **Pendente há X dias** — sem sessão de onboarding criada e conta tem ≥ 3 dias → dispara também.

Em todos os casos: dispara no `/` (painel), nunca em cima do fluxo de onboarding.

## Frequência

- Mostra 1×. Se o usuário fechar sem responder, reaparece 1× depois de 3 dias. Se enviar, nunca mais.
- Controle por `localStorage`:
  - `onb_feedback_state` = `{ status: "shown" | "submitted", lastShownAt, attempts }`
  - Máximo de `attempts = 2`.

## Conteúdo do popup

Reaproveita o `FeedbackDialog` atual sem mudar campos. Apenas adiciona um pré-preenchimento contextual no `mensagem` (placeholder) para guiar a resposta:
- Concluído: "Como foi sua primeira experiência configurando o Hub?"
- Abandonado/pendente: "O que te impediu de concluir a configuração inicial?"

A coluna `pagina` já é preenchida automaticamente com a rota atual (`/`), o que permite filtrar feedbacks de onboarding no admin.

## Detalhes técnicos

**Novo componente:** `src/components/onboarding/OnboardingFeedbackPrompt.tsx`
- Hook em `Index.tsx` (montado só no `/`).
- Usa `useAuth`, `useOnboardingSession` (`session`, `loading`, `needsOnboarding`) e lê `user.created_at` para o gatilho de 3 dias.
- Lógica:
  1. Se `localStorage.onb_feedback_state.status === "submitted"` → não mostra.
  2. Se `attempts >= 2` → não mostra.
  3. Se `lastShownAt` < 3 dias → não mostra.
  4. Detecta gatilho:
     - **Concluído**: flag `localStorage.onb_just_completed = "1"` setada por `OnboardingFlow.tsx` no `handleChoose` antes de navegar, e lida/limpa aqui.
     - **Abandonado/pendente**: `needsOnboarding === true` e `(now - user.created_at) >= 1h` (abandono curto) ou `≥ 3 dias` (pendente longo).
  5. Após 3–4s, abre o `FeedbackDialog` com placeholder contextual.
- Ao fechar sem enviar: incrementa `attempts`, grava `lastShownAt`.
- Ao enviar (callback novo `onSubmitted` no `FeedbackDialog`): grava `status = "submitted"`.

**Mudanças em arquivos existentes:**
- `src/components/user/FeedbackDialog.tsx`: adiciona props opcionais `placeholder?: string` e `onSubmitted?: () => void`. Sem mudar layout nem campos.
- `src/components/onboarding/OnboardingFlow.tsx`: no `handleChoose`, após `createSession`, `localStorage.setItem("onb_just_completed", "1")`.
- `src/pages/Index.tsx`: monta `<OnboardingFeedbackPrompt />` ao lado do `<OnboardingPrompt />` existente.

**Banco:** nenhuma migração. `feedbacks.pagina = "/"` identifica origem; se quiser filtrar com mais precisão depois, dá pra prefixar o `mensagem` com `[onboarding-concluido]` / `[onboarding-abandonado]` (decisão simples na hora do envio).

## Fora de escopo

- Não cria nova tabela.
- Não altera o `FeedbackDialog` visualmente.
- Não dispara durante o fluxo de `/onboarding` em si — só após sair pro painel.
