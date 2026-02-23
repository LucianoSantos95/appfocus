
# Plano de Aprimoramento - Sprint 2

## 1. Remover Feedback do Painel

Remover o widget e popup de feedback da pagina inicial. O feedback continua acessivel pelo menu do usuario.

**Alteracoes:**
- `src/pages/Index.tsx` - Remover imports e uso de `FeedbackWidget` e `FeedbackPopup` (linhas 5-6, 106-113)
- Deletar `src/components/feedback/FeedbackWidget.tsx`
- Deletar `src/components/feedback/FeedbackPopup.tsx`

---

## 2. Controle Mensal na pagina de Financas

Adicionar uma nova secao com duas abas apos os graficos existentes:

**Aba "Controle Mensal":**
- Grid com 12 cards (Janeiro a Dezembro)
- Cada card mostra: Total Recebido, Total Gasto, Balanco Geral
- Indicador visual de status (positivo/negativo/equilibrio)
- Sem campo de cartao de credito
- Botao para expandir detalhes do mes

**Aba "Grafico Mensal":**
- Grafico de barras comparando receitas vs despesas por mes
- Reutilizando Recharts com o estilo visual ja existente (gradientes)

**Arquivo:** `src/pages/Financas.tsx` - Nova secao com componente Tabs entre os graficos e a tabela de transacoes

---

## 3. Kanban Drag-and-Drop no Marketing

Implementar arrastar e soltar nos cards do Kanban de prioridades.

**Implementacao:**
- HTML5 Drag and Drop nativo (sem dependencia extra)
- `draggable` nos cards de conteudo
- `onDragStart`, `onDragOver`, `onDrop` nas colunas de prioridade
- Ao soltar um card em outra coluna, a prioridade e atualizada no estado
- Destaque visual na coluna alvo durante o arrasto

**Arquivo:** `src/pages/Marketing.tsx` - Modificar secao do Kanban (linhas 465-482)

---

## 4. Botao de Tema Claro/Escuro

O projeto ja possui variaves CSS para modo claro (classe `.light` no `index.css`) e a dependencia `next-themes` instalada. Falta apenas ativar o sistema.

**Implementacao:**
- Adicionar `ThemeProvider` do `next-themes` no `App.tsx` envolvendo toda a aplicacao, com `attribute="class"` e `defaultTheme="dark"`
- Criar botao de alternancia (icone Sol/Lua) na Sidebar, posicionado entre a navegacao e o UserMenu
- Usar `useTheme()` do `next-themes` para alternar entre "light" e "dark"
- O botao respeita o estado colapsado da sidebar (mostra apenas icone quando recolhida)

**Arquivos:**
- `src/App.tsx` - Adicionar ThemeProvider
- `src/components/layout/Sidebar.tsx` - Adicionar botao de tema

---

## 5. Valores dos Planos Anuais (informativo)

Para criar os links de pagamento:

```text
Plano       | Mensal  | Anual (por mes) | Total Anual
Plus        | R$119   | R$99/mes        | R$1.188/ano
Pro         | R$249   | R$199/mes       | R$2.388/ano
Enterprise  | R$497   | R$397/mes       | R$4.764/ano
```

---

## Detalhes Tecnicos

### Ordem de implementacao
1. Remover feedback do painel (Index.tsx + deletar arquivos)
2. Adicionar ThemeProvider no App.tsx + botao na Sidebar
3. Controle mensal na pagina de Financas (nova secao com Tabs)
4. Drag-and-drop no Kanban do Marketing

### Arquivos criados
Nenhum novo arquivo necessario.

### Arquivos modificados
- `src/App.tsx` - ThemeProvider
- `src/pages/Index.tsx` - Remover feedback
- `src/pages/Financas.tsx` - Nova secao controle mensal
- `src/pages/Marketing.tsx` - Drag-and-drop no Kanban
- `src/components/layout/Sidebar.tsx` - Botao tema claro/escuro

### Arquivos deletados
- `src/components/feedback/FeedbackWidget.tsx`
- `src/components/feedback/FeedbackPopup.tsx`

### Dependencias
Nenhuma nova - `next-themes` ja esta instalado e as variaveis CSS de modo claro ja existem no `index.css`.
