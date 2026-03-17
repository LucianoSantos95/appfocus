

## Plan: Atualizar logo dos emails de follow-up

### Contexto
Os 3 templates de email de follow-up (welcome, reengagement, upgrade) atualmente usam o logo em `email-assets/logo.png`. O novo logo (Focus.png) precisa ser enviado para o bucket `email-assets` e referenciado nos templates.

### Observacao importante
O logo enviado parece ser branco sobre fundo transparente. Como os emails de follow-up tem fundo branco (`backgroundColor: '#ffffff'`), o logo ficaria invisivel. Duas opcoes:
1. Manter o fundo branco e ajustar a area do logo para ter um fundo escuro (ex: `#141b2d`)
2. Usar o logo como esta (caso tenha detalhes visiveis que nao apareceram no preview)

### Passos

1. **Copiar o arquivo** `Focus.png` para `src/assets/` no projeto
2. **Upload para o storage** no bucket `email-assets` como `focus-logo.png`
3. **Atualizar os 3 templates** de follow-up para usar a nova URL do logo:
   - `followup-welcome.tsx`
   - `followup-reengagement.tsx`
   - `followup-upgrade.tsx`
   - Alterar `logoUrl` para apontar para o novo arquivo
   - Adicionar fundo escuro na seção do logo para garantir visibilidade
4. **Redeployer** as edge functions `send-followup-email` e `cron-followup`

### Arquivos modificados
- `supabase/functions/_shared/email-templates/followup-welcome.tsx`
- `supabase/functions/_shared/email-templates/followup-reengagement.tsx`
- `supabase/functions/_shared/email-templates/followup-upgrade.tsx`

