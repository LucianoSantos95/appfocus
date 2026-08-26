# Data e hora do lead no Admin

Hoje o card do lead no painel Admin mostra só a data (ex.: `26/08/2026`). Vamos passar a mostrar data e hora do momento em que a pessoa pegou o produto.

## O que muda

- No painel de Leads, ao lado do e-mail e da empresa, o carimbo passa a ser `26/08/2026 · 14:32` (fuso de Brasília).
- Passar o mouse sobre o carimbo mostra a data completa por extenso.
- Nenhuma outra informação, filtro ou comportamento do painel é alterado.

## Detalhe técnico

- Arquivo: `src/components/admin/LeadsPanel.tsx`.
- Trocar `new Date(l.created_at).toLocaleDateString("pt-BR")` por uma formatação com `toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })`, com `title` contendo a versão longa.
- O campo `created_at` já vem da tabela `leads`; não é preciso mudar banco nem consulta.
