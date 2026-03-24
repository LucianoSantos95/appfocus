

## Atualizar popup de novidades

O popup `UpdateNotification.tsx` já tem lógica de 5 dias (`EXPIRY_DAYS = 5`). Preciso apenas atualizar a versão e o conteúdo do changelog para refletir as mudanças recentes.

### Alterações em `src/components/UpdateNotification.tsx`:

- Mudar `UPDATE_VERSION` de `"2026-03-16"` para `"2026-03-24"`
- Substituir o array `updates` pelo novo conteúdo:
  1. **Limite gratuito ampliado** — de 5 para 20 registros por módulo
  2. **Novos preços acessíveis** — Plus a partir de R$69/mês
  3. **Integração WhatsApp** — alertas automáticos de tarefas, clientes e financeiro
  4. **Guia de Uso interativo** — checklist com progresso real e celebrações
  5. **Configuração WhatsApp no perfil** — ative notificações em poucos cliques

