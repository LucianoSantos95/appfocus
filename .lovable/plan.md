

## Plano: Grupo 3 — Novas Funcionalidades Operacionais + Guia Atualizado

### 1. Financeiro: Importação de Extrato (CSV/OFX)

**Novo componente: `src/components/financas/ImportExtratoDialog.tsx`**
- Botão "Importar Extrato" na toolbar do Financas.tsx (ao lado do botão existente de importar planilha)
- Aceita CSV e OFX (Open Financial Exchange)
- Parser OFX simples que extrai transações (data, descrição, valor)
- Usa o fluxo de mapeamento de colunas existente para CSV
- Funcional para todos; para planos pagos, integração completa com inserção no banco

**Editar: `src/pages/Financas.tsx`** — adicionar botão de importação de extrato

---

### 2. RH: Upload de Documentos + Timeline de Férias/Aniversários

**2a. Upload de Documentos no perfil do colaborador**

- Migração: criar bucket `colaborador-docs` no storage
- Migração: adicionar coluna `documents jsonb default '[]'` na tabela `colaboradores` (array de objetos `{name, url, uploaded_at}`)
- **Novo componente: `src/components/rh/DocumentUpload.tsx`** — dropzone para PDF/imagens, faz upload ao bucket e salva referência no perfil
- Integrar no dialog de edição de colaborador em `src/pages/RH.tsx`

**2b. Timeline de Férias/Aniversários**

- **Novo componente: `src/components/rh/FeriasAniversariosTimeline.tsx`** — calendário visual mostrando datas de início (aniversário de empresa) e colaboradores em férias
- Usa dados existentes da tabela `colaboradores` (campos `start_date` e `status`)
- Adicionar como nova aba "Timeline" em `src/pages/RH.tsx`

---

### 3. Marketing: Calendário de Conteúdo

- Migração: criar tabela `conteudos` com colunas: `id, user_id, title, description, platform, scheduled_date, status (rascunho/agendado/publicado), created_at, updated_at` + RLS por user_id
- **Novo hook: `src/hooks/useConteudos.ts`** — CRUD para conteúdos
- **Novo componente: `src/components/marketing/ContentCalendar.tsx`** — visualização de calendário mensal com cards de conteúdo posicionados por data, drag para reagendar
- Integrar como nova aba "Calendário" em `src/pages/Marketing.tsx`

---

### 4. Projetos: Anexos de Projeto

- Migração: criar bucket `projeto-anexos` no storage
- Migração: adicionar coluna `attachments jsonb default '[]'` na tabela `projetos`
- **Novo componente: `src/components/projetos/ProjetoAnexos.tsx`** — seção de upload/listagem de arquivos (briefings, documentos) dentro do card expandido do projeto
- Integrar na área de detalhes do projeto em `src/pages/Projetos.tsx`

---

### 5. CRM: Rich Text para Anotações de Reunião

- Migração: adicionar coluna `meeting_notes text` na tabela `clientes`
- **Novo componente: `src/components/clientes/MeetingNotesEditor.tsx`** — editor de texto rico usando `contentEditable` com toolbar básica (negrito, itálico, listas, links), salva HTML no campo `meeting_notes`
- Integrar no dialog de detalhes/edição do cliente em `src/pages/Clientes.tsx`

---

### 6. Guia de Uso Atualizado

**Editar: `src/pages/Guia.tsx`**
- Atualizar array `modules` com as novas ações de cada módulo (importação de extrato, upload de documentos, calendário de conteúdo, anexos de projeto, anotações de reunião)
- Adicionar nova seção "Funcionalidades Avançadas" com cards explicativos sobre:
  - Como usar os Dashboards de BI (clicar nos gráficos para análise detalhada)
  - Como importar extratos bancários
  - Como fazer upload de documentos no RH
  - Como usar o Calendário de Conteúdo no Marketing
  - Como anexar briefings nos Projetos
  - Como usar o editor de anotações no CRM
- Atualizar FAQ com perguntas sobre as novas funcionalidades
- Atualizar `journeySteps` para incluir etapa sobre funcionalidades avançadas

---

### Resumo de arquivos

| Ação | Arquivo |
|------|---------|
| Migração | Bucket `colaborador-docs`, coluna `documents` em colaboradores |
| Migração | Tabela `conteudos` com RLS |
| Migração | Bucket `projeto-anexos`, coluna `attachments` em projetos |
| Migração | Coluna `meeting_notes` em clientes |
| Criar | `src/components/financas/ImportExtratoDialog.tsx` |
| Criar | `src/components/rh/DocumentUpload.tsx` |
| Criar | `src/components/rh/FeriasAniversariosTimeline.tsx` |
| Criar | `src/hooks/useConteudos.ts` |
| Criar | `src/components/marketing/ContentCalendar.tsx` |
| Criar | `src/components/projetos/ProjetoAnexos.tsx` |
| Criar | `src/components/clientes/MeetingNotesEditor.tsx` |
| Editar | `src/pages/Financas.tsx` |
| Editar | `src/pages/RH.tsx` |
| Editar | `src/pages/Marketing.tsx` |
| Editar | `src/pages/Projetos.tsx` |
| Editar | `src/pages/Clientes.tsx` |
| Editar | `src/pages/Guia.tsx` |
| Editar | `src/hooks/useColaboradores.ts` |
| Editar | `src/hooks/useProjetos.ts` |

