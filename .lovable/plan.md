# Campanha de e-mail: conectar o MCP + pedido de feedback

Mesmo formato de ontem: envio único para os **70 últimos cadastrados**, usando o template visual padrão do Hub (cabeçalho FOCUS, cards, botão CTA), com personalização pelo primeiro nome.

## Conteúdo do e-mail

**Assunto:** Conecte o Hub ao ChatGPT ou Claude em 2 minutos

**Abertura:** o Hub agora funciona como conector oficial (MCP) — a IA que você já usa passa a consultar e executar ações direto na sua operação (finanças, clientes, tarefas, projetos).

**Blocos:**
1. *ChatGPT* — Settings → Connectors → Add custom connector → colar a URL do servidor MCP → login OAuth com a conta do Hub → pedir "resuma minhas finanças do mês".
2. *Claude Desktop* — Settings → Connectors → Add custom connector → colar a URL → autenticar → pedir "crie uma tarefa urgente para amanhã".
3. *Bônus* — também funciona no Cursor e no Codex CLI (instruções na página).
4. *Destaque* — a URL do servidor MCP e o passo a passo completo estão em app.focusinteligente.com.br/mcp. Incluído em todos os planos, sem custo extra.

**CTA principal:** "Conectar meu Hub à IA" → https://app.focusinteligente.com.br/mcp

**Fechamento (feedback):** pedido curto e direto para responderem o e-mail contando o que estão achando da plataforma — o que ajudou, o que falta e o que travou. Responder o e-mail chega direto na equipe (o rodapé do template já convida a responder).

## Execução técnica

- Reaproveitar a edge function `send-subscriber-broadcast` já publicada, com `{ action: "send", audience: "recent", limit: 70, subject, intro_html, blocks_html, cta_label, cta_url }`.
- Disparo via `pg_net` com autenticação service_role (mesmo padrão do envio de ontem).
- A função já filtra endereços suprimidos (bounces/descadastros).
- Nenhuma alteração de código de produto; nada de Asaas, gateway ou schema.

## Verificação

- Conferir a contagem de destinatários retornada.
- Ler o resultado por destinatário e reportar quantos foram aceitos pelo provedor e quais falharam (ontem, 69/70 — o único erro foi um endereço `@example.com`).
