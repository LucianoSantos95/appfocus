

## Remover Autenticacao - Acesso Livre

### Objetivo
Remover a tela de login/cadastro e a protecao de rotas para que qualquer pessoa possa acessar o Hub sem precisar se autenticar. A autenticacao sera reimplementada futuramente.

### O que sera feito

**1. App.tsx - Remover protecao de rotas**
- Remover o import do `ProtectedRoute` e do `AuthProvider`
- Remover o wrapping de `AuthProvider` ao redor da app
- Remover o `ProtectedRoute` de todas as rotas, deixando os componentes diretos
- Remover a rota `/auth`

**2. Sidebar.tsx - Remover logout e email do usuario**
- Remover o import e uso do `useAuth`
- Remover o botao "Sair" e a exibicao do email do usuario
- Remover o `handleLogout` e a navegacao para `/auth`
- Manter o rodape com versao e nome da empresa

**3. Manter arquivos de auth no projeto**
- Os arquivos `AuthContext.tsx`, `ProtectedRoute.tsx` e `Auth.tsx` serao mantidos no projeto para facilitar a reimplementacao futura
- Apenas nao serao mais importados/utilizados

### Resultado
- Acesso direto ao Painel Principal ao abrir o app
- Navegacao livre entre todos os modulos
- Sem botao de logout ou referencia a autenticacao na interface

### Secao Tecnica

Arquivos modificados:
- `src/App.tsx` - Remover AuthProvider, ProtectedRoute e rota /auth
- `src/components/layout/Sidebar.tsx` - Remover useAuth, botao Sair e email

Arquivos preservados (sem alteracao):
- `src/contexts/AuthContext.tsx`
- `src/components/auth/ProtectedRoute.tsx`
- `src/pages/Auth.tsx`
