

# Plano de Melhorias do Hub Empresarial - MVP

## 1. PAINEL PRINCIPAL (Dashboard)

### 1.1 Agenda
- Habilitar função de clique nos compromissos
- Ao clicar, abrir popup com detalhes editáveis do compromisso
- Campos editáveis: título, data, horário, tipo, prioridade
- Botões de Salvar e Cancelar no popup

### 1.2 Mural de Recados
- Habilitar função de clique nos cards de recados
- Ao clicar, abrir popup com o recado completo
- Permitir edição do conteúdo, autor e status de fixado
- Botões de Salvar, Excluir e Cancelar

---

## 2. FINANÇAS

### 2.1 Contas Bancárias
- Habilitar clique nos cards de contas bancárias
- Ao clicar, abrir popup com detalhes da conta
- Campos editáveis: nome, instituição, tipo, saldo, moeda
- Botões de Salvar, Excluir e Cancelar no popup

---

## 3. RECURSOS HUMANOS (RH)

### 3.1 Colaboradores
- Adicionar função de exclusão de colaboradores
- Incluir botão de excluir no card ou no popup de detalhes
- Confirmação antes de excluir

### 3.2 Layout
- Separar visualmente as seções de Colaboradores e Vagas
- Vagas ficam logo ABAIXO da seção de Colaboradores
- Remover as abas/tabs, deixar como seções empilhadas

---

## 4. MARKETING

### 4.1 Layout Geral
- Separar em 3 seções distintas (não mais em abas):
  1. Campanhas (topo)
  2. Planejamento de Conteúdo (meio) - renomear de "Ideias de Conteúdo"
  3. Funil de Marketing (final)

### 4.2 Campanhas
- Habilitar clique nos cards de campanhas
- Ao clicar, abrir popup com detalhes editáveis:
  - Nome, objetivo, plataformas, orçamento
  - Datas de início e fim
  - Status, resultados esperados/alcançados
- Botões de Salvar e Cancelar

### 4.3 Planejamento de Conteúdo (novo nome sugerido)
- Renomear "Ideias de Conteúdo" para "Planejamento de Conteúdo" ou "Calendário Editorial"
- Habilitar clique nos cards para popup editável
- Adicionar nova visualização em Kanban por prioridade:
  - Colunas: Baixa | Média | Alta
  - Cards arrastáveis entre colunas

### 4.4 Funil de Marketing (Visual Interativo)
- Criar componente visual de FUNIL com 3 níveis:
  - TOPO DO FUNIL (Atração)
  - MEIO DO FUNIL (Consideração)  
  - FUNDO DO FUNIL (Conversão)
- Cada nível clicável para adicionar itens
- Popup para adicionar/editar:
  - Nome do canal/processo
  - Descrição
  - Métricas (se houver)
- Visual de funil invertido com cores distintas por nível

---

## 5. PROJETOS

### 5.1 Cards de Projetos
- Habilitar clique nos cards para abrir popup completo
- Popup deve mostrar visão geral do projeto:
  - Nome, descrição, status, prioridade
  - Responsável / Equipe responsável
  - Orçamento e gastos
  - Progresso geral

### 5.2 Gestão de Sprints e Tarefas
- Dentro do popup do projeto, seção de Sprints
- Cada sprint pode conter:
  - Nome da sprint (ex: Sprint 1, Sprint 2)
  - Lista de tarefas
  - Subtarefas dentro de cada tarefa
  - Status de conclusão
- Quando todas as tarefas de uma sprint são concluídas:
  - Sprint é marcada como concluída
  - Progresso do projeto é atualizado automaticamente

### 5.3 Responsáveis
- Campo para selecionar responsável ou equipe
- Lista de membros selecionáveis
- Contador de "Equipe: X pessoas"

### 5.4 Alertas de Atraso
- Calcular se projeto está atrasado baseado na data fim
- Exibir badge/alerta visual:
  - "Em dia" (verde)
  - "Próximo do prazo" (amarelo)
  - "Atrasado" (vermelho)

---

## 6. CLIENTES

### 6.1 Cards de Clientes
- Habilitar clique nos cards para popup editável
- Campos editáveis: nome, email, telefone, segmento, status

### 6.2 Separação por Status
- Criar 2 seções ou abas:
  1. **Novos/Prospectos** - Clientes em negociação
  2. **Clientes Ativos** - Clientes que fecharam contrato

### 6.3 Automação de Conversão
- Quando cliente fecha contrato/compra:
  - Status muda automaticamente para "Ativo"
  - Cliente move para aba de "Clientes Ativos"
  - Criar entrada automática no módulo Financeiro:
    - Descrição: Nome do cliente + tipo de contrato
    - Valor: Valor do contrato
    - Cliente: Preenchido automaticamente
    - Categoria: "Serviços" ou conforme tipo
    - Status: "Pendente" ou "Pago"

---

## 7. TAREFAS (antigo Atividades)

### 7.1 Layout
- Manter visualização "Todas" as tarefas como lista
- SUBSTITUIR aba "Pendentes" por quadro Kanban
- Kanban organizado por PRIORIDADE:
  - Coluna: Baixa
  - Coluna: Média  
  - Coluna: Alta
  - Coluna: Urgente
- Manter aba "Concluídas"

### 7.2 Cards de Tarefas
- Habilitar clique para popup editável
- No popup mostrar:
  - Título, descrição, prazo, prioridade
  - Responsável
  - Subtarefas (lista de checkbox)
  - Botão para adicionar subtarefas

### 7.3 Botão Nova Atividade
- Mover botão "Nova Atividade" para ABAIXO dos gráficos
- Não mais no header

---

## 8. PROCESSOS

### 8.1 Botão Novo Processo
- Mover para ao lado do campo "Buscar Processos"
- Layout: [Campo de Busca] [Botão Novo Processo]

### 8.2 Informação de Etapas
- No formulário de criação, mostrar contador de etapas
- "Este processo contém X etapas"

### 8.3 Edição de Etapas
- Ao clicar no processo, abrir detalhes
- Cada etapa pode ser editada individualmente:
  - Título da etapa
  - Descrição detalhada (rich text)
  - Responsável
  - Duração estimada
  - Suporte a imagens (upload ou URL)
  - Suporte a vídeos (embed ou URL)

### 8.4 Status do Processo
- No formulário de criação/edição, campo de status:
  - Ativo
  - Em Revisão
  - Arquivado
  - Cancelado

### 8.5 Exportação
- Manter botão de exportar PDF ao final do processo

---

## RESUMO TÉCNICO DE IMPLEMENTAÇÃO

### Componentes Novos Necessários:
1. `EditAppointmentDialog` - Popup de edição de compromissos
2. `EditNoteDialog` - Popup de edição de recados
3. `EditBankAccountDialog` - Popup de edição de contas bancárias
4. `EditCampaignDialog` - Popup de edição de campanhas
5. `ContentKanban` - Kanban para planejamento de conteúdo
6. `MarketingFunnel` - Componente visual de funil interativo
7. `ProjectDetailDialog` - Popup completo de projetos com sprints
8. `SprintManager` - Gerenciador de sprints e tarefas
9. `EditClientDialog` - Popup de edição de clientes
10. `ClientConversionFlow` - Fluxo de conversão para financeiro
11. `TaskKanban` - Kanban de tarefas por prioridade
12. `EditTaskDialog` - Popup de edição com subtarefas
13. `ProcessStepEditor` - Editor de etapas com mídia

### Integrações Necessárias:
- Clientes → Financeiro (automação de entrada)
- Projetos → Tarefas (vinculação de sprints)

