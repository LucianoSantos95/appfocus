# Liberar Pix, boleto e cartão no pagamento dos produtos

Hoje a cobrança do produto sai só como Pix. A primeira tentativa de oferecer as três formas foi recusada, mas naquele momento o pedido também levava os dados do comprador sem CPF — o que sozinho já derrubava a cobrança. Vale testar de novo agora que esse problema foi corrigido.

## O que será feito

1. Passar a pedir as três formas de pagamento (Pix, boleto e cartão) na criação da cobrança.
2. Manter uma rede de segurança em degraus: se o Asaas recusar as três, tenta Pix + boleto; se recusar de novo, tenta só Pix. Assim a compra nunca deixa de abrir.
3. Registrar qual combinação foi aceita, para sabermos exatamente o que a conta permite.
4. Publicar a função e fazer uma compra de teste real pelo próprio site para confirmar que a tela do Asaas mostra as três opções.

Se o Asaas continuar recusando boleto ou cartão, isso significa que essas formas ainda não estão liberadas na sua conta Asaas — nesse caso eu te aviso e você libera direto no painel do Asaas (ativação de boleto e cartão costuma exigir dados da empresa aprovados).

## Detalhes técnicos

- Arquivo: `supabase/functions/create-produto-checkout/index.ts`.
- Tentativas em cascata sobre o mesmo `baseBody`: `["PIX","BOLETO","CREDIT_CARD"]` → `["PIX","BOLETO"]` → `["PIX"]`, mantendo `dueDateLimitDays: 3` e `chargeTypes: ["DETACHED"]`.
- Erro final continua marcando a compra como `erro` e devolvendo a razão do Asaas ao formulário.
- Deploy explícito de `create-produto-checkout` e teste via chamada direta à função.
