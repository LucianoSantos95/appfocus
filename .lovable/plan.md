
# Limpeza de Clientes + Acesso Total para o Dono

## 1. Apagar dados da tabela de clientes

Sera executado um DELETE para remover todos os 8 registros atuais da tabela `clientes`. As demais tabelas permanecem intactas.

## 2. Definir Luciano como administrador do sistema

O email `oluciano.dosantos@gmail.com` sera inserido na tabela `user_roles` com o papel de `admin`. Isso garante que o sistema reconheca Luciano como dono/administrador.

## 3. Acesso total sem restricoes para admins

Atualmente, o controle de acesso por plano (`PlanContext`) bloqueia funcionalidades com base no plano contratado (gratuito, plus, pro, enterprise). O problema e que ate o dono do SaaS e restringido pelo plano.

**Mudancas no codigo:**

| Arquivo | Mudanca |
|---|---|
| `src/contexts/PlanContext.tsx` | Alterar a funcao `canAccess` para retornar `true` sempre que o usuario tiver role `admin` |
| `src/components/plan/PlanGate.tsx` | Adicionar verificacao de admin para liberar o conteudo sem mostrar tela de bloqueio |
| `src/hooks/useTeamPermissions.ts` | Ja verifica admin corretamente, sem mudancas necessarias |

**Logica**: Antes de checar as features do plano, o sistema consultara a tabela `user_roles` para verificar se o usuario logado e admin. Se for, todas as funcionalidades estarao liberadas independentemente do plano.

### Secao Tecnica

**SQL a executar:**
```text
-- Limpar clientes
DELETE FROM clientes;

-- Inserir Luciano como admin
INSERT INTO user_roles (user_id, role)
VALUES ('a65f3ede-f3f2-4af6-9183-11a8af5dc051', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

**PlanContext.tsx** - adicionar estado `isAdmin` que consulta `user_roles`, e na funcao `canAccess`:
```text
if (isAdmin) return true;
```

**PlanGate.tsx** - importar hook para verificar admin e liberar children direto:
```text
if (isAdmin) return children;
```

Isso garante que Luciano (e qualquer futuro admin) tenha acesso irrestrito a todas as funcionalidades do sistema, independentemente do plano de assinatura.
