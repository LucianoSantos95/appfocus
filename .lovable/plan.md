## Ajustes solicitados

**1. WowMomentCard — trocar rótulo "Momento WOW"**
Em `src/components/onboarding/WowMomentCard.tsx` (linhas 72-74), trocar o texto da label superior de `Momento WOW` para `Demo configurada`. Manter o ícone `TrendingUp` ao lado. Nada mais no card muda (título, métrica, subline e insight continuam iguais).

**2. WelcomeChoiceModal — mais visibilidade**
Em `src/components/onboarding/WelcomeChoiceModal.tsx`, aumentar contraste dos cards de seleção (Segmento e Módulo) e do bloco de telefone:

- `CardButton` (linhas 44-62): elevar opacidade do fundo (`rgba(255,255,255,0.08)` em vez de `0.04`), engrossar a borda base (`rgba(255,255,255,0.18)`), aumentar padding para `p-7`, adicionar leve `shadow-lg shadow-black/40` e um `scale-[1.02]` no hover para dar mais "peso".
- Títulos dos cards (`h3`) passam de `text-base` para `text-lg`.
- Descrições sobem de `rgba(255,255,255,0.65)` para `rgba(255,255,255,0.80)`.
- Bloco de telefone (linhas 157-198): mesmo tratamento — fundo `0.08`, borda `0.18`, `shadow-lg shadow-black/40`. Input com borda `0.30` (em vez de `0.15`).
- Subtítulo do header (linha 113) passa de `rgba(255,255,255,0.75)` para `rgba(255,255,255,0.90)`.
- Labels dos passos (dots, linhas 126-132): estado inativo sobe para `text-foreground/70` (hoje é `text-muted-foreground`, praticamente invisível no fundo escuro).
- Footer inferior (linha 232): de `rgba(255,255,255,0.45)` para `rgba(255,255,255,0.70)`.

Sem mudanças de lógica, apenas visuais.
