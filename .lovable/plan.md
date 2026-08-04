# Teste end-to-end: convite de colaborador

Objetivo: entrar no sistema como usuário real (navegador automatizado) e confirmar que o convite de colaborador agora envia o e-mail e mostra erro quando falha.

## Passos do teste

1. Abrir o app no navegador headless com a sessão do usuário logado no preview.
2. Ir até Painel do administrador (menu do usuário > Equipe/Colaboradores).
3. Preencher o formulário "Adicionar colaborador" com um endereço de teste real de captura e enviar.
4. Capturar screenshots antes/depois e o toast de resultado.
5. Verificar no backend:
   - registro criado na tabela de convites/colaboradores;
   - log da função `send-invite` (status 200, id do e-mail);
   - registro no log de envio de e-mails.
6. Teste negativo: enviar com e-mail inválido e confirmar que agora aparece mensagem de erro na tela (em vez de falha silenciosa).

## Entrega

Relatório curto com: o que foi clicado, screenshots, status do envio, e veredito (resolvido / não resolvido) para cada um dos dois cenários.

## Observações técnicas

- Nenhuma alteração de código prevista; apenas execução e leitura de logs.
- Se algum passo falhar, aponto a causa exata e proponho a correção em um plano separado antes de mexer no código.
- O convite criado no teste será removido ao final para não poluir a base.
