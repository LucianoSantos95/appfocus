# Disparo do e-mail "O Hub agora é gratuito" para os últimos 70 cadastrados

Sem tela nova: o envio usa a função de broadcast que já existe no projeto, com o template visual padrão do Hub (cabeçalho FOCUS, cards e botão CTA).

## Aviso de entregabilidade

Este é um e-mail de anúncio para lista, disparado pela mesma infraestrutura que envia confirmação de conta e recuperação de senha. Existe risco real de queda de reputação do domínio se isso virar rotina. Recomendação: usar este caminho apenas para este disparo pontual e, para futuras campanhas, um subdomínio/ferramenta dedicada.

## O que muda

1. **Nova audiência "recentes"** na função `send-subscriber-broadcast`: seleciona os 70 usuários mais recentes por `created_at`, com limite parametrizável. Endereços presentes em `suppressed_emails` continuam sendo excluídos automaticamente.
2. **Conteúdo fixo do disparo** (sem geração por IA), usando a copy já aprovada:
   - Assunto: "O Hub Empresarial agora é gratuito"
   - Intro + 3 cards (módulos liberados / sem limite de registros / sistema sob medida)
   - CTA: "Entrar no Hub" → https://app.focusinteligente.com.br
   - Versão texto puro equivalente
3. **Deploy** da função e **execução do envio** para os 70 destinatários, com intervalo entre envios já existente (150 ms) para não estourar limite do provedor.
4. **Relatório**: número de enviados, falhas e total, com base no registro em `email_send_log`.

## Detalhes técnicos

- `supabase/functions/send-subscriber-broadcast/index.ts`: `Audience` passa a aceitar `"recent"`; `listRecipients` ordena `profiles` por `created_at desc` com `limit` (padrão 70) e cruza com os e-mails de `auth.users`.
- Nada é alterado no gateway Asaas, em auth, nem nas funções de e-mail transacional/auth existentes.
- Chamada do envio feita com credencial de admin já existente; cada envio é registrado em `email_send_log` com `template_name: "subscriber_broadcast"`.
