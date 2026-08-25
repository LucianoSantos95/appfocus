# Feedback no fluxo do template + zerar base do admin

## 1. Feedback logo depois de pegar o template

Hoje, ao clicar em "Quero o template", o lead é salvo e a pessoa é levada direto para o link do template (a aba atual é substituída) — nenhum feedback é coletado.

Mudança:

- O template passa a abrir em **nova aba**, e a aba atual mostra a tela de sucesso.
- Nessa tela de sucesso aparece direto o formulário de feedback com o título **"Me diz o que achou sobre a nova plataforma"**.
- Nome e e-mail no feedback continuam **opcionais** (nada obrigatório), só a mensagem conta — o objetivo é volume de respostas.
- Botões: "Abrir template" (caso o pop-up tenha sido bloqueado) e "Enviar feedback" / "Agora não".
- O feedback registra a página e o produto de origem, para eu saber de onde veio.

Observação: a captura de lead (nome + e-mail antes do template) segue obrigatória como está hoje. O que fica opcional é o formulário de feedback.

## 2. Zerar métricas e leads do admin

Antes de colocar no ar:

- Apagar todos os registros de `eventos` (visitas, cliques, leads enviados) — as Métricas voltam a zero.
- Apagar todos os registros de `leads` (132 hoje, incluindo a base antiga marcada como "legado").
- Os feedbacks de teste (17) também são apagados, para começar limpo — me avise se preferir manter.

## Detalhes técnicos

- `src/components/central/ProdutoDialog.tsx`: trocar `window.location.assign` por `window.open(..., "_blank")`; renderizar um bloco de feedback inline no estado `entregue`.
- `src/components/user/FeedbackDialog.tsx`: extrair o corpo do formulário para um componente reutilizável (`FeedbackForm`) com props de título/placeholder e nome/e-mail opcionais; o dialog atual passa a usá-lo (sem mudança visual nos outros pontos).
- Limpeza dos dados via `DELETE` em `eventos`, `leads` e `feedbacks`.
