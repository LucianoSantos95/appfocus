# Expandir hints contextuais: Slack + WhatsApp

Hoje o `ContextualIntegrationsHint` só sugere Google. Vou torná-lo multi-provider, mostrando o hint mais relevante por módulo (rotacionando entre Google/Slack/WhatsApp conforme o contexto) e ocultando providers já conectados.

## Comportamento

- Consulta `user_integrations` uma vez e verifica quais providers (`google`, `slack`, `whatsapp`) faltam para o usuário.
- Cada módulo tem uma **lista priorizada** de sugestões; mostra a primeira ainda não conectada e não dispensada:
  - **Clientes**: Google (agenda) → WhatsApp (mensagens ao cliente) → Slack (avisar time sobre novo cliente)
  - **Projetos**: Slack (notificar time sobre tarefas/kanban) → Google (deadlines na agenda) → WhatsApp (lembrete de prazo)
  - **RH**: Google (férias/aniversários) → WhatsApp (comunicados) → Slack (canal do time)
  - **Tarefas** (novo): Slack (notificar responsável) → WhatsApp (lembrete)
  - **Financeiro** (novo, opcional): WhatsApp (alerta de vencimento)
- Ícone e cor mudam por provider (Chrome/Slack/MessageCircle).
- Dismiss por (módulo + provider), permitindo o próximo hint aparecer depois.
- CTA leva para `/atividades` (Google) ou `/configuracoes?tab=integracoes` (Slack/WhatsApp), conforme onde está o setup.

## Onde aparecer

Adicionar `<ContextualIntegrationsHint module="tarefas" />` no topo de `src/pages/Tarefas.tsx` (já existe nos outros três módulos). Financeiro fica de fora nesta rodada para evitar poluição — posso incluir se você quiser.

## Arquivos

- `src/components/integrations/ContextualIntegrationsHint.tsx` — refatorar para suportar múltiplos providers, mapa por módulo, consulta única.
- `src/pages/Tarefas.tsx` — inserir o hint no topo.

Sem mudanças de banco. Sem alteração de outras rotas.
