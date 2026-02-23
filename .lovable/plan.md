
# Persistencia de Dados em Todos os Modulos

## Problema Atual

Apenas o modulo de **Clientes** salva dados no banco. Os demais modulos (Financas, RH, Projetos, Tarefas, Marketing, Processos) usam dados mockados em `useState` -- tudo se perde ao recarregar a pagina ou importar planilhas.

## O Que Sera Feito

### 1. Criar 7 tabelas no banco de dados

| Tabela | Modulo | Campos principais |
|---|---|---|
| `transacoes` | Financas | description, value, date, category, type, status, payment_method, client, provider, notes |
| `contas_bancarias` | Financas | name, institution, type, balance |
| `colaboradores` | RH | name, role, department, salary, start_date, email, phone, status, manager |
| `projetos` | Projetos | name, status, priority, start_date, end_date, budget, responsible, description |
| `tarefas` | Tarefas | title, description, due_date, priority, status, category, responsible |
| `campanhas` | Marketing | name, objective, platforms, budget, start_date, end_date, status, responsible |
| `processos` | Processos | name, description, department, owner, status |

Todas as tabelas terao:
- `id` UUID com default `gen_random_uuid()`
- `user_id` UUID com default `auth.uid()` para isolar dados por usuario
- `created_at` e `updated_at` timestamps
- Politicas RLS para que cada usuario so veja/edite/apague seus proprios dados

### 2. Atualizar import-configs.ts

Adicionar a propriedade `table` nas configuracoes de importacao de cada modulo para que os dados importados via planilha sejam inseridos diretamente no banco.

### 3. Atualizar cada pagina de modulo

Substituir o `useState` com dados mockados por hooks que fazem CRUD no banco:
- Carregar dados do banco ao abrir a pagina
- Inserir novos registros no banco
- Atualizar registros existentes no banco
- Excluir registros do banco
- Importacao via planilha persiste automaticamente (pois o `useDataImport` ja insere no banco quando `config.table` esta definido)

### 4. Exportacao

- **CSV**: Ja funciona em Financas, sera mantido
- **PDF**: Implementar exportacao real com jsPDF em Financas (substituir o `alert` placeholder)
- Os demais modulos ja terao dados persistidos, facilitando adicionar exportacao futuramente

## Secao Tecnica

### Migracao SQL (resumo)

```text
CREATE TABLE transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT auth.uid(),
  description TEXT NOT NULL,
  value NUMERIC NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  category TEXT,
  type TEXT NOT NULL DEFAULT 'receita',
  status TEXT NOT NULL DEFAULT 'pendente',
  payment_method TEXT,
  client TEXT,
  provider TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- + RLS policies (SELECT/INSERT/UPDATE/DELETE where auth.uid() = user_id)
-- Repetir padrao para as demais 6 tabelas
```

### Padrao de hook por modulo

Cada modulo tera um hook customizado (ex: `useTransacoes`, `useProjetos`) seguindo o padrao do `useClientes`:
- `useQuery` para listar dados do banco
- Funcoes de `insert`, `update`, `delete` via Supabase client
- Invalidacao de cache via React Query

### Atualizacao do import-configs.ts

```text
financas_transacoes: {
  label: "Transacoes Financeiras",
  table: "transacoes",   // <-- adicionar isso
  fields: [...]
}
// Mesmo para rh_colaboradores, projetos, tarefas, etc.
```

### Paginas dos modulos

- Remover arrays de dados mockados (`initialTransactions`, etc.)
- Usar o hook correspondente para carregar/manipular dados
- Os handlers de CRUD passam a chamar funcoes do hook em vez de `setState`

## Ordem de Implementacao

1. Criar todas as 7 tabelas + RLS via migracao
2. Atualizar `import-configs.ts` com os nomes das tabelas
3. Criar hooks de dados para cada modulo
4. Atualizar cada pagina para usar os hooks
5. Implementar exportacao PDF real em Financas
