# Página de Usuários (acesso exclusivo do dono)

Nova página interna `/usuarios`, visível somente para `oluciano.dosantos@gmail.com`, com painéis de acompanhamento da base e disparo de e-mails selecionados.

## Acesso

- Verificação no banco (não só no front): função de segurança que só retorna verdadeiro quando o e-mail autenticado é `oluciano.dosantos@gmail.com`. Todas as consultas da página passam por ela.
- No front: link "Usuários" aparece na sidebar apenas para esse e-mail; a rota redireciona para o Painel para qualquer outra conta.

## Painéis

1. **Últimos acessos** — lista das pessoas que entraram/mexeram no Hub mais recentemente: nome, e-mail, plano, último acesso, módulos usados.
2. **Mais ativos** — ranking por ações nos últimos 30/90 dias, dias ativos e classificação (já existe uma base de engajamento pronta no banco).
3. **Tempo na plataforma** — hoje o sistema não mede duração de sessão, só datas de acesso. Vou criar um registro leve de sessão (início, último "sinal de vida" a cada ~1 min, fim) para calcular: tempo total, tempo médio por sessão e número de sessões por usuário. Os dados começam a acumular a partir da publicação; enquanto isso, mostro "sem dados suficientes" e uma estimativa por dias ativos.
4. **Disparo de e-mails** — tabela com seleção por caixinha (ou "selecionar todos" / filtrar por: mais ativos, inativos, plano, período de cadastro), campo de assunto e mensagem, prévia do e-mail no template padrão do Hub e botão de envio. Usa a função de broadcast já existente, estendida para aceitar uma lista específica de destinatários. Histórico dos envios logo abaixo.

## Sugestões extras (posso incluir)

- **Resumo do topo**: total de usuários, novos nos últimos 7/30 dias, ativos nos últimos 7 dias, taxa de retorno.
- **Inativos / risco de churn**: quem não entra há mais de 14 ou 30 dias — alvo direto para reativação.
- **Funil**: quantos em cada estágio (novo, ativado, quente, convertido, churn), com lista por estágio.
- **Uso por módulo**: quais áreas do Hub são mais e menos usadas na base.
- **Ficha do usuário**: clicar em alguém e ver histórico de acessos, módulos, plano, tickets e feedbacks.
- **Exportar CSV** de qualquer lista.

## Detalhes técnicos

- Migration: `public.user_sessions` (user_id, started_at, last_seen_at, duration_sec) com RLS — usuário insere/atualiza a própria sessão; dono lê tudo via função `is_owner()` (SECURITY DEFINER, compara `auth.jwt()->>'email'`). GRANTs explícitos.
- Views/funções SECURITY DEFINER para agregados (últimos acessos, ranking, tempo médio) protegidos por `is_owner()`, evitando expor `auth.users` ao cliente.
- Hook `useSessionHeartbeat` no layout autenticado, com throttle e `visibilitychange`.
- `src/pages/Usuarios.tsx` + componentes em `src/components/admin/` (lazy route em `App.tsx`).
- Envio: estende `send-subscriber-broadcast` com audiência `custom` (lista de e-mails) mantendo assunto/HTML customizados; sem mexer em pagamento/Asaas.
