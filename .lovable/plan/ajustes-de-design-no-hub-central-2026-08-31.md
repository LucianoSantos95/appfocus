# Ajustes de design no Hub Central

## 1. Remover o bloco "Semana de validação"
Tirar da home (`src/pages/Central.tsx`) o card com a pílula "Semana de validação" e o botão "Deixar minha opinião", junto com o estado que só ele usava. O botão flutuante de feedback continua existindo.

## 2. Rodapé: "Enviar feedback" vira "Precisa de suporte?"
No lugar do link de feedback, um link de suporte que abre um formulário em modal com:
- Nome (obrigatório)
- E-mail (obrigatório)
- Telefone (obrigatório)
- Mensagem (obrigatória)

Ao enviar: mensagem de sucesso e o modal fecha. Erros de validação aparecem no próprio formulário.

## 3. Remover "Conhecer a Focus"
Tirar o botão do rodapé. Fica só a assinatura "/ Plataforma criada pela Focus" (o nome Focus continua linkando pro site) e o novo link de suporte.

## Detalhes técnicos
- Nova tabela `public.suporte_publico` (nome, email, telefone, mensagem, pagina, status, created_at). A tabela atual `support_tickets` exige usuário logado, e o catálogo é público — por isso uma tabela separada.
  - RLS: `INSERT` liberado para visitantes anônimos com validação de tamanho dos campos; `SELECT`/`UPDATE` apenas para o dono da plataforma. GRANTs correspondentes para `anon`, `authenticated` e `service_role`.
- Novos componentes: `src/components/central/SuporteDialog.tsx` (modal + formulário, validação com zod e `stripHtml`, no mesmo padrão do `FeedbackForm`) e o link de suporte no rodapé.
- Edição em `src/pages/Central.tsx`: remove o bloco de validação, remove o botão "Conhecer a Focus", troca `LinkFeedback` pelo link de suporte.
- `LinkFeedback` deixa de ser usado no rodapé (o componente pode continuar disponível para outros pontos).
