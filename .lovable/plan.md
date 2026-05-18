# Follow-ups inteligentes para assinantes inativos

Objetivo: para cada assinante inativo, gerar e enviar e-mails de reengajamento com IA, um por vez, liberando o próximo só após o intervalo ideal definido pela própria IA (visão de marketing + comercial).

## Como vai funcionar (visão do usuário)

1. Na tabela de Assinantes (`/assinantes`), cada linha ganha uma coluna **Follow-up** com um botão de ação.
2. O botão mostra um dos 3 estados:
   - **"Gerar follow-up"** — quando não há follow-up pendente e o usuário está elegível (inativo ou no prazo do próximo toque).
   - **"Aguardando (faltam X dias)"** — desabilitado, mostra quando o próximo follow-up será liberado.
   - **"Sem follow-ups pendentes"** — quando a sequência já foi concluída ou o usuário voltou a ativar.
3. Ao clicar em **Gerar follow-up**:
   - Abre um modal com o e-mail gerado pela IA (assunto + corpo), pré-preenchido e editável.
   - A IA também sugere quantos dias esperar até o próximo follow-up (ex.: 3, 7, 14 dias), com base no estágio da sequência (1º, 2º, 3º toque), no plano atual, no tempo de inatividade e em boas práticas de cadência comercial.
   - O usuário revisa, ajusta se quiser, e clica em **Enviar**.
4. Após o envio, o botão automaticamente trava com a contagem regressiva até o próximo toque liberado.
5. Sequência padrão: até 4 toques (boas-vindas de volta → prova de valor → oferta/urgência → último toque). Depois disso, marca como "encerrada" para aquele ciclo.

## Painel agregado (opcional, mas recomendado)

No topo da página de Assinantes, um card resumo:
- Quantos estão **prontos para follow-up hoje**.
- Botão **"Gerar todos os pendentes"** que abre o fluxo um a um (mesmo modal, em fila), evitando disparo em massa cego.

## Critério de "inativo / elegível"

- Sem login há ≥ 14 dias (via `auth.users.last_sign_in_at`), **ou**
- Plano gratuito sem upgrade há ≥ 30 dias desde o cadastro, **ou**
- Já está em uma sequência de follow-up aberta e o próximo toque venceu.

## Detalhes técnicos

### 1. Banco de dados (nova tabela)
`subscriber_followups`:
- `user_id` (assinante alvo)
- `sequence_step` (1..N)
- `status` (`draft` | `sent` | `skipped`)
- `subject`, `body_html`, `body_text`
- `ai_rationale` (por que a IA escreveu assim)
- `next_followup_at` (quando o próximo toque é liberado — definido pela IA)
- `sent_at`
- timestamps + RLS restrita ao owner/admin

A "liberação" do próximo botão é simplesmente: `now() >= max(next_followup_at)` da última linha do usuário.

### 2. Edge Function `generate-followup-email`
- Input: `user_id`.
- Busca contexto: profile, plano, status, último login, follow-ups anteriores (assunto + resumo) para evitar repetição.
- Chama Lovable AI Gateway (`google/gemini-2.5-flash`) com um prompt de copywriter B2B SaaS PT-BR pedindo JSON estruturado:
  ```json
  { "subject": "...", "body_html": "...", "body_text": "...",
    "suggested_next_days": 5, "rationale": "..." }
  ```
- Retorna o rascunho ao frontend (não envia ainda). Persiste como `status: draft`.

### 3. Edge Function `send-followup-email-now`
- Input: `followup_id` + edições do usuário (subject/body).
- Reaproveita a infra de e-mail já existente (`send-followup-email` / Resend) para disparar.
- Atualiza `status = sent`, grava `sent_at` e `next_followup_at = now() + suggested_next_days`.

### 4. Frontend (`src/pages/Assinantes.tsx` + novo componente)
- Novo hook `useSubscriberFollowups(userId)` → retorna `{ canGenerate, nextAvailableAt, lastStep, isLoading }`.
- Nova coluna na tabela com o botão de estado triplo.
- Novo `FollowupComposerDialog`:
  - Loading enquanto gera.
  - Campos editáveis (assunto / corpo rich text simples).
  - Mostra "IA sugere próximo toque em X dias" + justificativa curta.
  - Botões: **Enviar agora** / **Salvar rascunho** / **Cancelar**.
- Realtime: assinar `subscriber_followups` para atualizar o estado dos botões em todas as abas abertas (igual já é feito para `subscriptions`).

### 5. Salvaguardas
- Respeita `suppressed_emails` (não envia para quem optou por sair).
- Loga tudo em `email_send_log` (já existente) com `template_name = 'subscriber_followup'`.
- Botão fica desabilitado se o assinante voltou a ficar `active` em plano pago (encerra a sequência automaticamente).

## Fora do escopo desta entrega
- Disparo automático sem revisão humana (você pediu fluxo manual com botão).
- Campanhas em massa para listas (continua usando o `CampanhaPromoCard` existente para isso).
- A/B testing de assuntos.

Posso seguir com a implementação?
