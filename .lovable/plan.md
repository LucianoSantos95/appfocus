
# Correcao de Erros de Seguranca

## Problemas Identificados

Existem 4 problemas de seguranca ativos no projeto:

| # | Problema | Nivel | Scanner |
|---|----------|-------|---------|
| 1 | Dados de clientes expostos a qualquer usuario autenticado (sem filtro por dono) | error | supabase_lov |
| 2 | Politicas RLS com `USING (true)` na tabela clientes (muito permissivas) | warn | supabase |
| 3 | Tabela feedbacks sem politicas de UPDATE/DELETE para administradores | warn | supabase_lov |
| 4 | Protecao contra senhas vazadas desativada | warn | supabase |

## Solucoes Propostas

### 1. Adicionar coluna `user_id` na tabela `clientes` e restringir RLS (resolve problemas 1 e 2)

Cada cliente passara a pertencer ao usuario que o cadastrou. As politicas RLS serao atualizadas para que cada usuario so veja/edite seus proprios clientes.

- Adicionar coluna `user_id` (UUID, referenciando `auth.users`)
- Preencher registros existentes com o usuario atual (via migration)
- Tornar a coluna NOT NULL com default `auth.uid()`
- Substituir as 4 politicas `USING (true)` por `USING (auth.uid() = user_id)`

### 2. Adicionar politicas de UPDATE/DELETE na tabela `feedbacks` (resolve problema 3)

- Criar politica de DELETE para que o autor do feedback possa remover o proprio (usando email ou user_id)
- Como feedbacks nao tem `user_id` e permitem insercao anonima, a opcao mais segura e permitir que qualquer usuario autenticado delete apenas feedbacks associados ao seu email

### 3. Protecao contra senhas vazadas (resolve problema 4)

- Este e um ajuste de infraestrutura do backend. Sera habilitado via configuracao de autenticacao, nao requer mudanca de codigo.

### 4. Atualizar o codigo do hook `useClientes`

- Passar o `user_id` do usuario logado ao inserir novos clientes
- A Edge Function `analyze-client` ja usa service role, entao continuara funcionando normalmente

## Detalhes Tecnicos

### Migration SQL

```sql
-- 1. Adicionar user_id na tabela clientes
ALTER TABLE public.clientes ADD COLUMN user_id UUID DEFAULT auth.uid();

-- 2. Remover politicas antigas
DROP POLICY "Authenticated users can read clientes" ON public.clientes;
DROP POLICY "Authenticated users can insert clientes" ON public.clientes;
DROP POLICY "Authenticated users can update clientes" ON public.clientes;
DROP POLICY "Authenticated users can delete clientes" ON public.clientes;

-- 3. Criar novas politicas baseadas em ownership
CREATE POLICY "Users can read own clientes"
  ON public.clientes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clientes"
  ON public.clientes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clientes"
  ON public.clientes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clientes"
  ON public.clientes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 4. Feedbacks: permitir delete pelo autor (por email)
CREATE POLICY "Authors can delete own feedbacks"
  ON public.feedbacks FOR DELETE TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
```

### Arquivos a modificar

- `src/hooks/useClientes.ts` - Adicionar `user_id` ao inserir cliente
- Edge Function nao precisa de mudanca (usa service role que bypassa RLS)

### Limitacao importante

Registros de clientes ja existentes no banco nao terao `user_id` preenchido automaticamente pela migration se nao houver um usuario logado no momento. Sera necessario rodar um UPDATE manual depois associando esses registros ao usuario correto, ou os registros antigos ficarao invisiveis ate serem reatribuidos.
