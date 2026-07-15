# Enriquecer conta demo do avaliador

**Alvo:** `demo@focusinteligente.com.br` (user_id `d3d3d3d3-...`)

## Objetivo
Deixar a demo com volume suficiente para BI/gráficos parecerem vivos e o avaliador conseguir explorar todos os módulos sem "vazios".

## Metas por módulo (volume final)

| Módulo | Hoje | Alvo | +Adicionar |
|---|---|---|---|
| Clientes | 5 | 18 | +13 (mix ativo/prospecto/inativo, vários segmentos) |
| Projetos | 4 | 15 | +11 (status variados, com deadlines passados/futuros) |
| Tarefas | 18 | 40 | +22 (Kanban com Low/Medium/High/Urgent, algumas concluídas) |
| Transações | 6 | 60 | +54 (6 meses de histórico, receitas/despesas para gráficos) |
| Colaboradores | 8 | 12 | +4 (departamentos variados) |
| Campanhas | 5 | 10 | +5 (ativas, planejamento, encerradas) |
| Conteúdos | 5 | 15 | +10 (agendados/publicados/rascunho para calendário) |
| Processos | 2 | 6 | +4 (por departamento) |
| Contas bancárias | 1 | 3 | +2 |
| Agenda | 3 | 12 | +9 (2 semanas de eventos) |
| Mural | 2 | 5 | +3 |

## Como será feito

1. **Uma única execução do insert tool** com blocos INSERT para cada tabela, todos com `user_id = 'd3d3d3d3-d3d3-4d3d-8d3d-d3d3d3d3d3d3'`.
2. **Datas relativas a `now()`** para transações e agenda — assim os gráficos "últimos 6 meses" e agenda "próximas semanas" ficam sempre populados.
3. **Vínculos coerentes** onde já existirem colunas (ex.: responsável de tarefa = nome de colaborador existente; cliente de transação = nome de cliente existente).
4. **Nada é apagado** — apenas adicionado ao que já existe.

## Fora do escopo (não farei agora)
- Alterar plano (fica `gratuito` padrão)
- Marcar onboarding como concluído
- Popular notificações / feedbacks / integrações mock
- Alterar schema, RLS, ou seed automático no login

Se quiser algum desses depois, é só pedir.
