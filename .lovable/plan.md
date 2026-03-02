

# Integrar Resend para E-mails de Follow-up

## Objetivo
Configurar o Resend como serviço de envio de e-mails de follow-up (marketing/transacional) para usuários cadastrados no Focus Gestao Inteligente.

## O que sera feito

### 1. Configurar a API Key do Resend
- Solicitar que voce insira sua chave de API do Resend (obtida em resend.com/api-keys)
- Armazenar de forma segura como secret do projeto

### 2. Criar Edge Function `send-followup-email`
- Nova funcao backend que recebe destinatario, assunto e tipo de e-mail
- Usa a API do Resend para envio
- Valida autenticacao do usuario chamador
- Suporta diferentes templates (boas-vindas, reengajamento, upgrade)

### 3. Criar Templates de Follow-up
- Templates React Email no estilo da marca Focus (azul eletrico #4da3ff, fonte Inter, logo)
- Todos em Portugues (BR)
- Templates planejados:
  - **Boas-vindas** (Day 1): mensagem de onboarding pos-cadastro
  - **Reengajamento** (Day 3-7): lembrete para explorar funcionalidades
  - **Upgrade** (Day 14): CTA para planos pagos

### 4. Criar Edge Function `cron-followup` (opcional)
- Funcao que consulta a tabela `profiles` buscando usuarios por data de cadastro
- Dispara os e-mails automaticamente com base em regras de tempo
- Acionada via cron job (pg_cron) para automacao completa

## Pre-requisitos
- Conta no Resend (resend.com) - plano gratuito envia ate 100 emails/dia
- Dominio verificado no Resend (pode ser o mesmo `app.focusinteligente.com.br` ou outro)
- API Key do Resend

## Detalhes tecnicos

### Estrutura de arquivos
```text
supabase/functions/send-followup-email/index.ts    -- funcao de envio
supabase/functions/_shared/email-templates/
  followup-welcome.tsx                              -- template boas-vindas
  followup-reengagement.tsx                         -- template reengajamento
  followup-upgrade.tsx                              -- template upgrade
```

### Fluxo
```text
pg_cron (agendamento)
  -> cron-followup (edge function)
    -> consulta profiles (created_at)
    -> send-followup-email (edge function)
      -> Resend API
        -> usuario recebe e-mail
```

### Seguranca
- API Key armazenada como secret (nunca exposta no frontend)
- Edge function valida autenticacao antes de permitir envios manuais
- Rate limiting para evitar envios duplicados

