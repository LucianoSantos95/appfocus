# Ajustes de "sem dados", animação de Kanban e mensagens de ajuda

Quatro melhorias pontuais em RH, Tarefas e Processos, todas apenas de UI/UX. Nenhuma alteração de schema, hook ou lógica de negócio.

## 1. RH — Empty states nos gráficos e listas

Hoje os cards de gráfico e a lista de colaboradores ficam vazios (sem feedback) quando não há dados — parece bug.

**Arquivo:** `src/pages/RH.tsx`

- **Gráfico "Colaboradores por Departamento"**: quando `departmentData.length === 0`, substituir o `PieChart` por `<EmptyState size="sm" icon={Users} title="Sem dados" description="Cadastre colaboradores para visualizar a distribuição por departamento." />`.
- **Gráfico "Média Salarial por Departamento"**: mesmo tratamento com `icon={DollarSign}` e descrição "Informe salários dos colaboradores ativos para gerar esta análise."
- **Timeline de Férias/Aniversários**: já existe, apenas garantir empty state consistente se aplicável.
- **Grid de colaboradores por aba (Ativos / Férias / Afastados / Todos)**: quando `getFilteredColaboradores(filter).length === 0`, renderizar `<EmptyState icon={Users} title="Sem dados" description="Nenhum colaborador nesta categoria. Clique em 'Novo Colaborador' para começar." />` no lugar do grid.
- **Seção de Vagas**: quando `vagas.length === 0`, renderizar `<EmptyState icon={Briefcase} title="Sem dados" description="Cadastre vagas em aberto para acompanhar seu processo seletivo." />`.

Importar `EmptyState` de `@/components/ui/empty-state`.

## 2. Tarefas — Kanban com animação estilo Marketing

O Kanban de Tarefas hoje é estático (`renderKanbanColumn` só filtra por prioridade — sem drag & drop). O de Marketing tem highlight de coluna alvo (`dragOverPriority`), cards `draggable`, `onDrop` que muda a prioridade, e transição suave.

**Arquivo:** `src/pages/Tarefas.tsx`

- Adicionar estado `const [dragOverPriority, setDragOverPriority] = useState<Atividade["priority"] | null>(null);`.
- Nos cards do Kanban:
  - `draggable`
  - `onDragStart={(e) => e.dataTransfer.setData("text/plain", a.id)}`
  - Wrap com motion (`framer-motion`) usando `layout` + transição spring para o "flow" ao mudar de coluna (mesma sensação suave da UI atual do Marketing, sem introduzir novas semânticas de props gestuais que exijam nova infra).
- Nas colunas (`renderKanbanColumn`):
  - `onDragOver={(e) => { e.preventDefault(); setDragOverPriority(priority); }}`
  - `onDragLeave={() => setDragOverPriority(null)}`
  - `onDrop={(e) => { const id = e.dataTransfer.getData("text/plain"); if (id) updateTarefa(id, { priority }); setDragOverPriority(null); }}`
  - Classe condicional `dragOverPriority === priority && "border-primary/50 bg-primary/5 scale-[1.01]"` com `transition-all duration-200`.
- Cursor `cursor-grab active:cursor-grabbing` nos cards.

Resultado: mover uma tarefa entre colunas re-prioriza no banco e a coluna alvo ganha highlight animado igual ao Marketing.

## 3. Tarefas — "Sem dados" + informação no último campo

**Arquivo:** `src/pages/Tarefas.tsx`

- **Aba "Todas"**: quando `todasAtividades.length === 0`, renderizar `<EmptyState icon={ListTodo} title="Sem dados" description="Crie sua primeira tarefa clicando em 'Nova Tarefa' acima." />` no lugar do map.
- **Colunas do Kanban**: o empty state por coluna já existe. Manter.
- **Aba "Concluídas"**: já tem empty state — manter.
- **Informação no "último campo" (rodapé da página de Tarefas)**: adicionar um bloco discreto de dica logo abaixo das `Tabs`, algo como:

  > 💡 **Dica:** arraste tarefas entre as colunas do Kanban para repriorizar. Marque como concluída no checkbox à esquerda de cada item.

  Estilo: `rounded-lg border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground flex items-start gap-3` com ícone `Lightbulb`.

## 4. Processos — Mensagem de orientação

Hoje, se o usuário não tem processos, a lista fica vazia sem instrução. E dentro de um processo, `steps` ainda não é persistido no banco (só edição local), o que confunde.

**Arquivo:** `src/pages/Processos.tsx`

- **Lista principal vazia** (`processos.length === 0`): renderizar `<EmptyState icon={GitBranch} title="Nenhum processo documentado ainda" description="Documente seus playbooks e fluxos internos para padronizar a operação. Clique em 'Novo Processo' acima para começar." />`.
- **Banner informativo no topo da lista** (sempre visível, discreto): bloco com borda tracejada explicando o valor da seção — algo como:

  > 📋 **Documente seus processos:** cadastre playbooks de onboarding, fluxos comerciais, rotinas financeiras e qualquer procedimento repetível. Você pode exportar cada processo em PDF para compartilhar com a equipe.

  Estilo consistente com a dica de Tarefas.
- **Dentro de cada processo expandido, quando `p.steps.length === 0`**: mostrar `<EmptyState size="sm" icon={FileText} title="Sem etapas cadastradas" description="Adicione etapas para documentar o passo a passo deste processo." />` acima da timeline.

## Verificação

- `tsgo` limpo.
- Playwright: navegar em `/rh`, `/atividades` e `/processos`; capturar screenshots confirmando empty states visíveis, tip de dica em Tarefas, banner em Processos, e testar drag & drop no Kanban de Tarefas (mover card de "Alta" → "Baixa" e ver o update).

## Fora de escopo

- Persistir `steps` de processos no banco.
- Refatorar Kanban para lib de drag & drop dedicada.
- Novos gráficos ou métricas.
