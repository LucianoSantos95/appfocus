

# Plano: Ajuste do Logo + Correção de Persistência no Financeiro

## Problema 1: Logo da Focus pequeno

No `AuthBrandingPanel.tsx`, o logo da Focus usa `h-16` no desktop e `h-10` no mobile. Basta aumentar para `h-24` (desktop) e `h-14` (mobile).

### Arquivo: `src/components/auth/AuthBrandingPanel.tsx`
- Linha 34: `h-10` -> `h-14` (mobile)
- Linha 53: `h-16` -> `h-24` (desktop)

---

## Problema 2: Transações não salvam no banco de dados

O bug esta no `AddTransactionDialog` (linha 876 de `Financas.tsx`). O componente cria um objeto `Transaction` local e chama `onAdd(transaction)`, mas o pai passa como callback `() => refetchTransacoes()` (linhas 500 e 509), que **ignora completamente o objeto** recebido. Nenhuma chamada ao `addTransacao` do hook `useTransacoes` e feita, por isso nada persiste.

### Correção em `src/pages/Financas.tsx`:
1. Importar `addTransacao` do hook `useTransacoes` (linha 228 -- ja esta disponivel, so precisa desestruturar)
2. Modificar o `AddTransactionDialog` para receber e chamar `addTransacao` do hook em vez de criar um objeto local
3. Ou, mais simples: mudar o callback `onAdd` nas linhas 500 e 509 para chamar `addTransacao` com os dados recebidos, e ajustar a tipagem

**Abordagem escolhida**: Refatorar o `AddTransactionDialog` para receber `addTransacao` diretamente e chamar a funcao do hook dentro do `handleSubmit`, garantindo que os dados vao para o banco.

### Mudancas concretas:
- Desestruturar `addTransacao` do `useTransacoes()` na linha 228
- Alterar `AddTransactionDialog` para aceitar uma prop `onAdd` que recebe `TransacaoInput` e chamar `addTransacao` no submit
- No `handleSubmit` do dialog, montar o objeto compativel com `TransacaoInput` (do hook) e chamar a funcao

### Outras paginas com o mesmo padrao a verificar:
Preciso checar se RH, Marketing, Projetos, Tarefas e Processos tem o mesmo problema de criar objetos locais sem persistir. Pela estrutura do projeto, eles usam hooks dedicados (`useColaboradores`, `useCampanhas`, etc.) que provavelmente ja chamam o hook corretamente, mas confirmarei durante a implementacao.

## Nenhuma mudanca no backend
Apenas frontend. As tabelas e RLS ja estao corretas.

