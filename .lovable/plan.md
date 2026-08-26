# Métricas de e-mail: origem e abertura

## O que muda

Na aba Métricas do admin, o bloco "E-mails automáticos" passa a mostrar, por e-mail:

- **De onde veio**: Produto baixado, Feedback ou Envio manual (broadcast).
- **Se foi aberto**: selo "Aberto" / "Não aberto", com a taxa de abertura no resumo.

Hoje os três tipos já são gravados no log (`thanks_produto`, `thanks_feedback`, `subscriber_broadcast`, além de campanhas antigas `promo_*`), só faltava rotular direito. Abertura ainda não é medida por ninguém — precisa ser instrumentada.

## Como medir abertura

Cada e-mail passa a levar um pixel invisível de 1x1 apontando para uma função pública `track-email-open?m=<id do log>`. Quando o cliente de e-mail carrega a imagem, marcamos `opened_at` naquela linha do log.

Limite honesto: Gmail/Outlook às vezes bloqueiam ou pré-carregam imagens, então a taxa de abertura é uma aproximação (padrão do mercado). Vou deixar isso escrito no painel em letra pequena.

## Passos

1. **Banco**: adicionar `opened_at timestamptz` e `open_count int default 0` em `email_send_log`; índice em `opened_at`.
2. **Função `track-email-open`** (nova, pública, sem JWT): recebe `?m=<uuid>`, faz update do `opened_at` (só na primeira vez) e responde um GIF 1x1 com cache desabilitado.
3. **`send-thanks-email`**: inserir a linha do log ANTES do envio (status `pending`) para ter o id, embutir o pixel no HTML e depois atualizar a linha para `sent`/`failed`. Mantém `template_name` atual (`thanks_produto` / `thanks_feedback` / `thanks_advisor`) e grava a origem também em `metadata.origem`.
4. **`send-subscriber-broadcast`**: mesmo tratamento por destinatário — linha de log antes do envio, pixel com o id, update do status depois. `metadata.origem = "manual"`.
5. **`MetricasPanel.tsx`**: passar a selecionar `id, template_name, status, opened_at, metadata, created_at`; mapear template → origem:
   - `thanks_produto` → Produto baixado
   - `thanks_feedback` → Feedback
   - `thanks_advisor` → Contato Advisor
   - `subscriber_broadcast`, `promo_*` → Envio manual
   
   Resumo passa a mostrar: enviados, falhas, abertos e % de abertura. A lista deixa de ser só por template e vira uma tabela por origem (enviados / falhas / abertos / taxa), com um detalhamento dos últimos envios mostrando destinatário, origem e selo de abertura.
6. **Deploy** das duas funções alteradas + da nova.

## Observações técnicas

- Envios antigos (838 broadcasts já registrados) ficam sem dado de abertura — vão aparecer como "—" em vez de "não aberto", para não distorcer a taxa. A taxa é calculada só sobre e-mails enviados depois da instrumentação.
- O update do pixel roda com service role dentro da função; nenhuma política nova de leitura pública em `email_send_log`.
- O painel continua lendo o log com a mesma permissão de admin já existente.
- Card "Onde está o gargalo", gráficos de tendência e por produto ficam intactos.
