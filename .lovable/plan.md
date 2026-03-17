

# Aplicar restricoes do PlanGate em todos os modulos

## Resumo

Atualmente, os componentes `PlanGate` e `usePlanFeatures` existem no codigo mas **nao estao sendo usados em nenhuma pagina**. Isso significa que usuarios do plano gratuito podem criar registros, exportar dados e usar IA sem restricao. Este plano aplica as restricoes em todos os 7 modulos.

## O que muda para o usuario gratuito

| Modulo | Pode ver dados | Criar/Adicionar | Exportar | IA |
|--------|---------------|-----------------|----------|-----|
| Financas | Sim | Bloqueado | Bloqueado | - |
| RH | Sim | Bloqueado | Bloqueado | - |
| Marketing | Sim | Bloqueado | Bloqueado | - |
| Projetos | Sim | Bloqueado | Bloqueado | - |
| Clientes | Sim | Bloqueado | Bloqueado | Bloqueado |
| Tarefas | Sim | Bloqueado | Bloqueado | - |
| Processos | Sim | Bloqueado | Bloqueado | - |

Quando bloqueado, o botao aparece com icone de cadeado e ao clicar redireciona para a pagina de planos.

## Abordagem tecnica

Em cada pagina, envolver os botoes de acao com o componente `PlanGate`:

1. **Botoes "Novo/Adicionar"** - envolver com `<PlanGate module="X" action="create">` 
2. **Botoes "Exportar"** - envolver com `<PlanGate module="X" action="export">`
3. **Botoes "Importar Planilha"** - envolver com `<PlanGate module="X" action="create">`
4. **Botao "Analise IA" (Clientes)** - envolver com `<PlanGate module="clientes" action="ai_analysis">`

Em vez de esconder os botoes, vou usar a abordagem de mostrar o botao desabilitado com tooltip "Disponivel no plano Plus" e redirecionar para /planos ao clicar. Isso incentiva o upgrade.

### Arquivos a modificar

- `src/pages/Financas.tsx` - Proteger botoes Exportar, Importar e dialog de nova transacao
- `src/pages/RH.tsx` - Proteger botoes Importar e dialog de novo colaborador/vaga
- `src/pages/Marketing.tsx` - Proteger botoes Importar e dialogs de nova campanha/conteudo
- `src/pages/Projetos.tsx` - Proteger botoes Importar e dialog de novo projeto
- `src/pages/Clientes.tsx` - Proteger botoes Importar, dialog de novo cliente e botao de Analise IA
- `src/pages/Tarefas.tsx` - Proteger botoes Importar e dialog de nova atividade
- `src/pages/Processos.tsx` - Proteger botoes Importar, Exportar PDF e dialog de novo processo

### Componente PlanGate - pequeno ajuste

O `PlanGate` atual renderiza um card grande quando o acesso e negado. Para botoes, vou criar uma variante inline que mostra o botao desabilitado com icone de cadeado, em vez do card grande. Isso mantem a interface limpa.

Novo componente: `PlanGateButton` - um wrapper que:
- Se tem acesso: renderiza o botao normalmente
- Se nao tem acesso: renderiza o botao com icone de cadeado e redireciona para /planos ao clicar

### Mapeamento de modulos para nomes na tabela plan_features

```text
Financas   -> module: "financas"
RH         -> module: "rh"
Marketing  -> module: "marketing"
Projetos   -> module: "projetos"
Clientes   -> module: "clientes"
Tarefas    -> module: "atividades"
Processos  -> module: "processos"
```

## Resultado esperado

- Usuarios gratuitos podem navegar e visualizar todos os modulos (dados de exemplo)
- Ao tentar criar, exportar ou importar, veem uma mensagem orientando a contratar um plano
- Usuarios com plano Plus, Pro ou Enterprise continuam usando normalmente
- Admins (dono do SaaS) continuam com acesso total

---

# Tarefas concluidas

## ✅ Redesign da tela de Auth

- Layout split-screen seguindo estetica da landing page do Hub
- Painel de branding com gradientes, glow e bullets de features
- Link para pagina de precos no header e rodape
- Responsivo (coluna unica em mobile)
- Componentes extraidos: AuthHeader, AuthFooter, AuthBrandingPanel, AuthFormPanel

---

# Sprint 3 — Automacoes e Alertas (planejamento futuro)

## Fase 1: Alertas de tarefas atrasadas e transacoes vencidas
- pg_cron job diario para verificar tarefas com due_date < now() e status != 'concluida'
- pg_cron job diario para verificar transacoes com date < now() e status = 'pendente'
- Edge function para enviar emails de alerta via Resend
- Widget de alertas no dashboard

## Fase 2: Relatorios automaticos
- Relatorio semanal de resumo financeiro enviado por email
- Relatorio mensal de desempenho de projetos
