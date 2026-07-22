## Problema

Na landing, clicar em **"Assinar Plus"** (ou Pro/Enterprise) leva o visitante deslogado para `/planos`. Lá, ao clicar em "Assinar com cartão automático" ou "Pix/Boleto", o `handleSubscribe` não encontra sessão, dispara `toast("Faça login")` e faz `navigate("/auth")` — que é a landing. Resultado: parece que o botão "volta para a página inicial".

Causa raiz confirmada em `src/pages/Planos.tsx` linhas 119-126: sem `access_token` → redireciona para `/auth` sem preservar a intenção de assinar.

## Correção

**1. `src/pages/Planos.tsx`**
- No `handleSubscribe`, quando não houver sessão: navegar para `/auth?next=/planos&plan=<id>&cycle=<mensal|anual>&mode=<recurring|one_time>` em vez de `/auth` puro. Mostrar toast mais claro ("Crie sua conta para assinar o Plus").
- Adicionar `useEffect` que, após login (quando `authSession` existir) e houver `?plan=` na URL, dispara `handleSubscribe` automaticamente e limpa os params. Isso completa o fluxo sem exigir novo clique.

**2. `src/components/landing/PricingSection.tsx`**
- Passar o plano escolhido na navegação: `navigate("/planos?plan=plus&cycle=monthly")` (idem Pro/Enterprise). Assim, mesmo se o usuário já estiver logado, o CTA da landing pré-seleciona a intenção.

**3. `src/pages/Auth.tsx`**
- Já existe `safeNext` a partir de `?next=`. Garantir que, após signup/login bem-sucedido, o `navigate(safeNext)` preserve também os query params extras (`plan`, `cycle`, `mode`). Ajuste: usar o valor completo de `nextParam` (incluindo query string) ao validar — hoje só valida que começa com `/`, então já funciona; apenas confirmar que `PricingSection` monta a URL como `next=/planos%3Fplan%3Dplus...` (encoded).

## Resultado esperado

Deslogado clica "Assinar Plus" na landing → abre `/planos?plan=plus&cycle=monthly` → clica em "Assinar com cartão" → vai para `/auth?next=/planos?plan=plus&cycle=monthly&mode=recurring` → após cadastro/login, volta em `/planos` e o checkout Asaas é disparado automaticamente.

Sem alterações no gateway Asaas nem nas edge functions.