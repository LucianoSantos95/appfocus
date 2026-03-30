

# Atualizar textos do Hub para nicho Agências e Consultorias

## Objetivo
Substituir linguagem genérica ("empresas", "negócio", "PMEs") por termos específicos do nicho: agências, consultorias, operação, carteira de clientes, entregas, playbooks.

## Arquivos e alterações

### 1. `src/pages/Index.tsx` — Dashboard
- Subtítulo: "Visão geral do seu negócio" → "Visão geral da sua operação"
- Descrições dos módulos:
  - RH: "Gerencie colaboradores e vagas" → "Gerencie sua equipe e freelancers"
  - Projetos: "Acompanhe projetos e entregas" → "Acompanhe entregas e prazos dos clientes"
  - Clientes: "Cadastro e relacionamento" → "CRM de carteira e prospecção"
  - Atividades: "Tarefas e metas do negócio" → "Tarefas e metas da operação"
  - Processos: "Documente processos internos" → "Padronize playbooks e fluxos"
- PageMeta description atualizado

### 2. `src/components/layout/Sidebar.tsx`
- Mesmas alterações de nomes nos módulos (RH permanece, mas tooltip/nomes descritivos atualizados onde aplicável)
- Footer: manter "Hub Empresarial v1.0"

### 3. `src/pages/Planos.tsx` — Planos e Preços
- Descriptions dos planos:
  - Plus: "Para pequenas empresas..." → "Para agências e consultorias que precisam de gestão completa"
  - Pro: "Para empresas em crescimento..." → "Para operações em crescimento com necessidades avançadas"
  - Enterprise: "Para grandes empresas..." → "Para agências com múltiplos times e clientes"
- Subtítulo: "Desbloqueie todo o potencial do Hub Empresarial" → "Desbloqueie todo o potencial da sua operação"
- PageMeta description atualizado

### 4. `src/components/dashboard/FAQSection.tsx`
- Reescrever todas as 6 FAQs com contexto de agências:
  - "Como começar..." → focar em cadastrar clientes e projetos da agência
  - "Limitações Free" → manter números, contextualizar para agências
  - "Hub Pro" → mencionar relatórios para clientes, automações de operação
  - "Exportar dados" → mencionar relatórios para apresentar a clientes
  - "Segurança" → manter igual (universal)
  - "Mais usuários" → contextualizar como "membros da equipe"

### 5. `src/pages/Guia.tsx` — Guia de Configuração
- Descrições das etapas:
  - "Conheça a plataforma e navegue pelos módulos" → "Conheça a plataforma e veja como organizar sua operação"
  - "Cadastre as informações essenciais" → "Cadastre sua agência e primeiros clientes"
  - "Comece a usar o sistema no dia a dia" → "Gerencie entregas e finanças no dia a dia"
  - "Explore recursos que turbinarão sua gestão" → "Explore recursos que turbinarão sua operação"
- Task labels contextualizados (ex: "Cadastre um colaborador" → "Cadastre um membro da equipe")
- FAQ do Guia: atualizar para contexto de agências
- Tips: "Atualize status dos clientes" → "Atualize status da carteira de clientes"
- Textos de conclusão: "crescimento do seu negócio" → "crescimento da sua operação"

### 6. `src/components/guide/tourSteps.ts`
- Atualizar conteúdo do tour para usar "operação", "agência", "equipe" em vez de "negócio", "empresa", "colaboradores"

### 7. `src/components/seo/PageMeta.tsx` — Sem alteração no componente
- As descriptions são atualizadas nos arquivos de cada página

### 8. PageMeta descriptions (nas respectivas páginas)
- Financas: "...do seu negócio" → "...da sua operação"
- RH: "colaboradores" → "equipe e freelancers"
- Marketing: manter (já adequado)
- Projetos: "...acompanhe projetos" → "...acompanhe entregas de clientes"
- Clientes: "...cadastro e relacionamento" → "...CRM de carteira"

## Princípio
Manter a mesma estrutura visual. Apenas textos são alterados. Nenhuma funcionalidade é modificada.

