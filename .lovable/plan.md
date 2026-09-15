# Vender produtos pagos com Asaas e liberar o acesso automático

Hoje um produto pago só abre o link que você cola no admin — não existe cobrança nem controle de quem pagou. A ideia é: o comprador preenche nome/e-mail, vai para o checkout do Asaas (Pix, Boleto ou Cartão), e assim que o pagamento é confirmado ele recebe o acesso por e-mail e por uma página de liberação no site.

## Como fica para o comprador

1. Clica no produto pago no catálogo e preenche nome e e-mail (mesmo formulário de hoje).
2. É levado ao checkout do Asaas com Pix, Boleto e Cartão.
3. Pagou (Pix e cartão liberam na hora; boleto em até 2 dias úteis), recebe um e-mail com o link do produto.
4. O e-mail traz também um link único para uma página de acesso no site, onde o produto fica disponível sempre que ele quiser voltar.
5. Se ele voltar do checkout antes da confirmação, a página avisa "pagamento em processamento" e libera sozinha quando confirmar.

## Como fica para você (admin)

- Novo campo no formulário de produto: **Link de entrega** — é o link que só é revelado depois do pagamento. O campo atual de link de destino continua servindo para os produtos gratuitos.
- Nova aba **Vendas** no admin: quem comprou, qual produto, valor, forma de pagamento, status (aguardando / pago / estornado) e data. Com opção de reenviar o e-mail de acesso.

## Detalhes técnicos

**Banco**
- `produtos`: nova coluna `link_entrega` (texto, opcional).
- Nova tabela `compras`: id, produto_slug, nome, email, valor, status (`pendente`/`pago`/`estornado`), `asaas_payment_id`, `token_acesso` (único), `liberado_em`, `created_at`. RLS: leitura só para o dono da plataforma; escrita apenas por edge function (service role); leitura pública por `token_acesso` via função security definer, sem expor a tabela.

**Edge functions**
- `create-produto-checkout` (pública, sem JWT): valida slug + nome + e-mail com Zod, confere que o produto é pago e ativo, cria a compra como `pendente`, chama o Asaas com `billingTypes: [PIX, BOLETO, CREDIT_CARD]` e `externalReference = produto|<id da compra>`, devolve a URL do checkout. Rate limit por e-mail/IP.
- `asaas-webhook`: passa a ramificar pelo prefixo do `externalReference`. Continua tratando assinaturas como hoje; quando for `produto|...`, marca a compra como paga, gera o token de acesso, envia o e-mail de entrega e registra em `email_send_log` com o template `entrega_produto` (nova categoria "Entrega de produto" no painel de Métricas). Estorno/chargeback volta a compra para `estornado` e invalida o token.
- Novo template de e-mail `entrega-produto.tsx` seguindo o padrão dos demais.

**Front**
- `ProdutoDialog.tsx`: para produto pago, após salvar o lead, chama `create-produto-checkout` e redireciona para a URL do Asaas em vez de abrir `link_destino`.
- Nova rota `/acesso/:token`: busca a compra pelo token e mostra o link de entrega, ou o estado "aguardando confirmação" com recarga automática.
- `ProdutosPanel.tsx`: campo Link de entrega. Novo `VendasPanel.tsx` na aba Vendas.

**Configuração**
- A chave do Asaas e o token do webhook já estão configurados; a URL do webhook também já recebe os eventos de pagamento, então não é preciso nada novo no painel do Asaas.

## Fora do escopo

Emissão de nota fiscal, cupons de desconto e reembolso pelo painel — dá para fazer depois.
