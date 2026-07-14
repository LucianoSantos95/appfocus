# Resposta ao feedback da Lovable — Conectores + Polish

O revisor apontou dois gaps para certificação:

1. **Uso de conectores/integrações** — precisa ficar visível no fluxo e agregar valor real.
2. **Polish de produto/design** — a experiência ainda parece "rough" em alguns pontos.

Abaixo o diagnóstico do que já existe hoje no Hub e o que recomendo adicionar/refinar.

---

## 1) Conectores — o que já temos vs. o que falta

**Já existente no projeto:**

- Google Workspace (Gmail/Calendar) via OAuth2 custom (`google-integration`)
- WhatsApp via Twilio (envio de lembretes)
- Stripe (billing)
- Lovable AI Gateway (Hub Assistant, análise de clientes, smart import)
- MCP server próprio (Hub expõe tools para ChatGPT/Claude)

**O que o revisor quer ver** é uso de **conectores Lovable oficiais** integrados ao fluxo — não só APIs custom. Recomendo estes 4, escolhidos por encaixe direto com os módulos do Hub:

### Prioridade ALTA (impacto imediato no fluxo)


| Conector                       | Módulo Hub                         | Valor entregue                                                                                                                                                                                                                                     |
| ------------------------------ | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Google Calendar (App User)** | Agenda / Home / Clientes           | Cada usuário conecta seu próprio calendário → reuniões com clientes viram eventos reais, agenda widget puxa compromissos do dia. Substitui a integração OAuth custom por App User Connector oficial (mais seguro, refresh automático via gateway). |
| **Resend** (App connector)     | Relatórios / Follow-ups / Convites | Envio transacional dos relatórios BI, convites de equipe e follow-ups de campanhas com domínio verificado. Hoje temos edge functions de e-mail mas sem provedor oficial conectado.                                                                 |


### Prioridade MÉDIA (diferenciação)


| Conector                  | Módulo Hub             | Valor entregue                                                                                                                                                  |
| ------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HubSpot (App User)**    | Clientes / CRM         | Sincronizar contatos/deals do HubSpot do usuário para o CRM do Hub → um clique importa pipeline existente. Grande WOW moment para agências que já usam HubSpot. |
| **Slack** (App connector) | Notificações / Tarefas | Notificar canal quando tarefa urgente é criada, cliente é marcado como hot lead, ou meta financeira é batida. Complementa o WhatsApp.                           |


### Por que essa combinação atende o feedback

- **Calendar + HubSpot** = cada end-user conecta seus próprios dados → prova que o app tem profundidade multi-tenant real (não é builder-only).
- **Resend + Slack** = comunicação outbound profissional, cobre o "workflow completo".
- Todos aparecem na aba **Integrações** (já existe `IntegrationsPanel.tsx`) com cards de conectar/desconectar.

---

## 2) Polish de produto/design — pontos rough identificados

Varredura da UI atual sugere estes ajustes de maior impacto/menor esforço:

### A. Consistência visual

- **Auth page**: hoje mistura hero + form + branding panel. Após remoção do card de avaliador ficou espaço vazio na direita em alguns breakpoints — rebalancear grid.
- **Sidebar collapsed state**: ícones não têm tooltip consistente em todos os itens.
- **Empty states**: vários módulos (Processos, Marketing calendário, RH vagas vazias) mostram apenas texto cru. Padronizar com ilustração + CTA + microcopy.
- **Loading skeletons**: hoje alguns painéis usam `Loader2` giratório, outros skeleton, outros nada. Padronizar para skeleton em todas as listas/cards.

### B. Microinterações

- **Toasts**: padronizar tom (sucesso verde suave, erro sem exclamação exagerada).
- **Hover states**: cards de módulo na Home carecem de elevação/transform sutil no hover.
- **Transições de página**: adicionar fade curto entre rotas (framer-motion `AnimatePresence` no `App.tsx`).

### C. Densidade e hierarquia

- **Dashboard Home**: cards de KPI competem visualmente com Agenda e Bulletin. Reduzir peso dos KPIs secundários (usar `text-muted-foreground` + `text-sm` para labels).
- **Tabelas** (Clientes, Financeiro): headers com peso 500 em vez de 600, zebra striping mais sutil, row hover mais claro.
- **Formulários em Dialogs**: espaçamento vertical inconsistente. Aplicar `space-y-4` uniforme em todos os `DialogContent`.

### D. Onboarding polish

- **Welcome modal**: reduzir de 3 passos para 2 (segmento + primeiro objetivo). Hoje sente-se longo.
- **Tour guiado**: alguns steps apontam para elementos que podem estar fora da viewport em telas menores — validar posicionamento.

### E. Acessibilidade e legibilidade

- **Light mode**: alguns textos ainda usam `text-muted-foreground` com contraste baixo — revisar tokens no `.light` block do `index.css`.
- **Focus rings**: garantir `focus-visible:ring-2` em todos os botões/inputs.

---

## 3) O que farei quando o plano for aprovado

**Fase 1 — Conectores (para o revisor ver integração real):**

1. Conectar **Google Calendar** como App User Connector oficial e migrar a Agenda/reuniões de clientes para usar as chamadas via gateway (`callAsAppUser`).
2. Conectar **Resend** como App connector e migrar `send-bi-report` + `send-followup-email` + convites de equipe para usar Resend com domínio.
3. Conectar **HubSpot** como App User Connector com botão "Importar do HubSpot" na página Clientes.
4. Conectar **Slack** como App connector opcional, com toggle "Notificar Slack" nas configurações de notificações.
5. Atualizar `IntegrationsPanel.tsx` para listar os 4 conectores oficiais com status conectado/não conectado.

**Fase 2 — Polish (5 quick wins de maior impacto visual):**

1. Padronizar empty states em todos os módulos (componente `EmptyState` reutilizável).
2. Skeletons consistentes em todas as listas (`ListSkeleton`, `CardSkeleton`, `TableSkeleton`).
3. Hover/transições em cards de módulo da Home + fade entre rotas.
4. Rebalancear Auth page (grid + espaçamentos).
5. Revisar contrastes do light mode e focus rings globais.

**Fora do escopo desta rodada** (posso propor depois se quiser):

- Redesign completo de páginas
- Novos módulos
- Reestruturação do onboarding além do encurtamento

---

## Perguntas antes de implementar

1. Confirma os **4 conectores** (Google Calendar, Resend, HubSpot, Slack)? Ou prefere trocar/reduzir algum? Slack e HubSpot são os mais "opcionais" — dá para começar só com Calendar + Resend se quiser escopo menor.
2. Para Resend, você já tem um **domínio verificado** que quer usar (ex: `focusinteligente.com.br`)? Se não, uso o domínio de sandbox do Resend temporariamente.
3. Sobre o polish: topa as 5 quick wins da Fase 2, ou quer priorizar algo específico (ex: só Auth + empty states)?  
  
  
Os conectores estão aprovados, o resend eu já utilizo  
Ponto 3 também aprovado