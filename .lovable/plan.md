

## Plano de Ajustes no Módulo Financeiro

### Problema 1: Contas bancárias não persistem
As contas bancárias usam `useState` local (linha 141) sem integração com o banco de dados. A tabela `contas_bancarias` já existe no banco.

### Problema 2: Transações sem vínculo com banco
Não há campo `bank_account_id` na tabela `transacoes` para associar uma transação a uma conta bancária.

### Problema 3: Gráfico "Por Categoria" não separa receitas e despesas
O gráfico atual mistura tudo num único PieChart. O usuário quer ver categorias de receita e despesa separadamente.

### Problema 4: StatCards não totalmente sincronizados
"Total em Caixa" soma saldos de contas locais (que somem ao recarregar). Precisa refletir os saldos reais do banco de dados.

---

### Implementação

**1. Criar hook `useContasBancarias`**
- CRUD completo contra a tabela `contas_bancarias` (já existe com RLS configurado)
- Funções: `fetchContas`, `addConta`, `updateConta`, `deleteConta`

**2. Migração: adicionar coluna `bank_account_id` na tabela `transacoes`**
- `ALTER TABLE public.transacoes ADD COLUMN bank_account_id uuid REFERENCES public.contas_bancarias(id) ON DELETE SET NULL;`

**3. Atualizar `useTransacoes`**
- Adicionar `bank_account_id` ao `TransacaoInput` e `Transacao`

**4. Lógica de atualização automática do saldo bancário**
- Quando uma transação com status "pago" é criada/atualizada e tem `bank_account_id`:
  - Receita: soma o valor ao saldo do banco
  - Despesa: subtrai o valor do saldo do banco
- Quando status muda de/para "pago", ajustar o saldo correspondente

**5. Refatorar `Financas.tsx`**
- Substituir `useState<BankAccount[]>([])` pelo hook `useContasBancarias`
- No `AddTransactionDialog`, adicionar select para escolher conta bancária
- No detalhe da transação, mostrar o banco associado
- **StatCards**: 
  - Receita Total / Despesa Total: somar todas (pagas)
  - Lucro Líquido: receita - despesa
  - Total em Caixa: somar saldos das contas bancárias do banco de dados

**6. Gráfico "Por Categoria" separado**
- Substituir o PieChart único por dois gráficos lado a lado (ou tabs):
  - "Categorias de Receita": PieChart com categorias onde `type === 'receita'`
  - "Categorias de Despesa": PieChart com categorias onde `type === 'despesa'`
- Cada um com sua legenda mostrando os valores

### Arquivos alterados
- `supabase/migrations/` — nova migração para `bank_account_id`
- `src/hooks/useContasBancarias.ts` — novo hook
- `src/hooks/useTransacoes.ts` — adicionar `bank_account_id`
- `src/pages/Financas.tsx` — integrar hook de contas, select de banco no form, gráfico separado por tipo

