# Destravar o botão "Ir para o pagamento"

## O que está acontecendo

O registro da função de checkout mostra o Asaas recusando a cobrança com a mensagem: "O campo billingTypes é inválido". Ou seja, o pagamento nem chega a ser criado — por isso a mensagem vermelha "Não consegui abrir o pagamento".

O checkout de produto pede Pix + Boleto + Cartão de uma vez. O checkout de planos, que funciona hoje, envia apenas Pix (com comentário no código avisando que a lista precisa ser explícita e restrita). A conta Asaas atual não aceita a combinação usada no produto.

## Ajustes

1. **Checkout do produto** (`create-produto-checkout`): enviar a mesma configuração que já funciona nos planos — cobrança avulsa com Pix e prazo de vencimento —, em vez da lista com três formas de pagamento.
2. **Fallback automático**: se o Asaas ainda recusar a lista, tentar uma segunda vez sem restringir a forma de pagamento, deixando a página do Asaas oferecer o que a conta permitir. Assim a compra não quebra caso a conta mude de configuração.
3. **Mensagem de erro útil**: quando o Asaas recusar, mostrar a razão devolvida por ele no formulário, em vez do texto genérico.
4. **Limpeza da notificação fantasma**: a função `notify-slack` está declarada na configuração mas não existe no projeto, então toda venda dispara um erro inútil no console. Remover a chamada e a declaração.
5. **Teste real**: disparar o checkout do Hub Empresarial Pro pelo ambiente e confirmar que o link do Asaas volta com sucesso.

## Observação

Se você quiser boleto e cartão além do Pix, isso depende de essas formas estarem habilitadas na sua conta Asaas — dá para reativar na lista depois que você confirmar que estão liberadas.
