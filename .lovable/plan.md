

## Ajuste do Logo nos E-mails

### Problema
A imagem mostra o logo "Focus" dentro de um container escuro (`#141b2d`) com bordas arredondadas, mas o logo aparece pequeno/cortado. Isso acontece nos templates de followup (welcome, reengagement, upgrade) que usam `logoSection` com fundo escuro.

Os templates de autenticação (signup, recovery, etc.) não têm esse problema pois usam `logoSection` sem fundo.

### Solução

Atualizar os **3 templates de followup** (`followup-welcome.tsx`, `followup-reengagement.tsx`, `followup-upgrade.tsx`) para:

1. **Remover o container escuro** do `logoSection` — deixar igual aos templates de auth (sem `backgroundColor`, sem `borderRadius`, sem `padding` extra)
2. **Unificar a URL do logo** — todos os templates passam a usar `email-assets/logo.png` (mesmo asset dos templates de auth), que é o logo principal da marca
3. **Manter dimensões `width="140" height="40"`** sem o container escuro, o logo ficará visível sobre o fundo branco do e-mail

### Arquivos Editados
- `supabase/functions/_shared/email-templates/followup-welcome.tsx`
- `supabase/functions/_shared/email-templates/followup-reengagement.tsx`
- `supabase/functions/_shared/email-templates/followup-upgrade.tsx`

### Deploy
- Reimplantar as edge functions de follow-up (`send-followup-email`, `cron-followup`) após as alterações

