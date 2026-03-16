

## Plano: Dashboards de BI Interativos (Grupo 2)

Transformar os gráficos principais de 4 módulos em gatilhos clicáveis que abrem modais detalhados estilo Power BI. Recurso exclusivo para assinantes (plano pago).

---

### Arquitetura

Criar 4 novos componentes de modal BI, um por módulo. Cada gráfico existente receberá `onClick` + `cursor-pointer` para abrir o modal correspondente. Usuários gratuitos verão o `UpgradeModal` ao clicar.

### Componentes a criar

**1. `src/components/bi/FinanceiroBIPanel.tsx`**
- Gatilho: clique no gráfico "Evolução Financeira" (Financas.tsx, linha ~424)
- Conteúdo do modal (fullscreen Dialog):
  - **Lucratividade**: margem de lucro % por mês (AreaChart)
  - **Fluxo de Caixa Futuro**: projeção dos próximos 3 meses baseada na média dos últimos 6 (AreaChart com linha pontilhada)
  - **Despesas vs Receitas detalhado**: BarChart mensal comparativo (12 meses)
- Dados derivados das `transacoes` existentes via props

**2. `src/components/bi/MarketingBIPanel.tsx`**
- Gatilho: clique no gráfico "Performance de Marketing" (Marketing.tsx, linha ~289)
- Conteúdo do modal:
  - **Comparativo de Canais**: BarChart horizontal por plataforma (Instagram, Google, etc.) com orçamento vs resultado
  - **CAC (Custo de Aquisição)**: orçamento total / conversões totais, exibido como KPI card
  - **Performance por Campanha**: tabela rankeada com métricas
- Dados derivados das `campanhas` existentes via props

**3. `src/components/bi/ProjetosBIPanel.tsx`**
- Gatilho: clique no gráfico "Status dos Projetos" (Projetos.tsx, linha ~288)
- Conteúdo do modal:
  - **Progresso consolidado**: lista de todos os projetos com barra de progresso baseada em subtasks/sprints
  - **Prazos críticos**: projetos com `end_date` próximo ou ultrapassado, destacados em vermelho
  - **Orçamento vs Gasto consolidado**: visão geral com totais
- Dados derivados dos `projetos` existentes via props

**4. `src/components/bi/ClientesBIPanel.tsx`**
- Gatilho: clique no gráfico "Receita por Cliente" (Clientes.tsx, linha ~341)
- Conteúdo do modal:
  - **Funil de Vendas**: barras horizontais por status (prospecto → ativo → inativo)
  - **Ranking Maiores Clientes**: top 10 por `valor_total`, com badges
  - **Distribuição por Segmento**: PieChart detalhado com valores absolutos
- Dados derivados dos `clientes` existentes via props

### Controle de acesso

Em cada página, ao clicar no gráfico:
1. Verificar `usePlanFeatures(module).canView` ou checar se `plan !== 'gratuito'` via `usePlan()`
2. Se gratuito: abrir `UpgradeModal` com mensagem "Dashboards de BI são exclusivos para assinantes"
3. Se pago: abrir o painel BI correspondente

### Modificações em páginas existentes

- **Financas.tsx**: adicionar estado `biPanelOpen`, envolver div do gráfico Evolução Financeira com `onClick`, importar `FinanceiroBIPanel`
- **Marketing.tsx**: mesmo padrão para gráfico Performance
- **Projetos.tsx**: mesmo padrão para gráfico Status dos Projetos
- **Clientes.tsx**: mesmo padrão para gráfico Receita por Cliente

Cada gráfico clicável terá um indicador visual sutil (ícone de expandir + tooltip "Clique para análise detalhada").

### Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `src/components/bi/FinanceiroBIPanel.tsx` |
| Criar | `src/components/bi/MarketingBIPanel.tsx` |
| Criar | `src/components/bi/ProjetosBIPanel.tsx` |
| Criar | `src/components/bi/ClientesBIPanel.tsx` |
| Editar | `src/pages/Financas.tsx` |
| Editar | `src/pages/Marketing.tsx` |
| Editar | `src/pages/Projetos.tsx` |
| Editar | `src/pages/Clientes.tsx` |

Sem migrações de banco de dados necessárias — todos os dados já existem nas tabelas atuais.

