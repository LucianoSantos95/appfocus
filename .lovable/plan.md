
# Plano de Melhorias: Animação de Módulos e Guia de Uso UX

## 1. ANIMAÇÃO DE SALTAR NOS MÓDULOS DO PAINEL

### Objetivo
Adicionar um efeito visual de "salto" (bounce/jump) nos cards de módulos quando o usuário passar o mouse, tornando a interação mais dinâmica e intuitiva.

### Implementação Técnica

**Arquivo: `tailwind.config.ts`**
- Adicionar novo keyframe `bounce-up` com movimento suave para cima e retorno

**Arquivo: `src/components/ui/module-card.tsx`**
- Aplicar classe `hover:-translate-y-2` ou animação customizada no hover
- Manter transição suave de 300ms com easing cubic-bezier

### Comportamento Esperado
- Card sobe 8-10px ao passar o mouse
- Retorna suavemente à posição original ao remover o mouse
- Combina com os efeitos existentes de glow e border

---

## 2. REESTRUTURAÇÃO DO GUIA DE USO (UX-FOCUSED)

### Objetivo
Transformar a página de Guia em uma experiência de onboarding completa, com passo a passo visual e foco na jornada do usuário.

### Nova Estrutura

#### 2.1 Hero Section - Boas-vindas
- Mensagem acolhedora e motivacional
- Indicador de tempo estimado (15 min para configurar tudo)
- Ilustração ou ícone destacado

#### 2.2 Jornada do Usuário (Timeline Visual)
**Etapa 1: Primeiros 5 minutos**
- Configure seu perfil
- Conheça o Painel Principal
- Navegue pelos módulos

**Etapa 2: Configuração Inicial (10 min)**
- Cadastre suas contas bancárias
- Adicione seu primeiro cliente
- Crie sua primeira tarefa

**Etapa 3: Operação Diária**
- Como registrar receitas e despesas
- Como gerenciar projetos com sprints
- Como acompanhar tarefas no Kanban

**Etapa 4: Recursos Avançados**
- Automação de conversão de clientes
- Documentação de processos
- Exportação de relatórios

#### 2.3 Cards de Módulos Interativos
- Cada módulo com:
  - Ícone e nome
  - "O que você pode fazer aqui"
  - Lista de ações principais
  - Botão "Ir para o módulo"

#### 2.4 Dicas de Produtividade
- Atalhos e truques
- Melhores práticas
- Erros comuns a evitar

#### 2.5 Seção de FAQ Expandida
- Perguntas frequentes com accordion
- Respostas claras e objetivas

#### 2.6 Call-to-Action Final
- "Pronto para começar?"
- Botão destacado para voltar ao Painel

### Elementos de UX
- Progress indicator (você está na etapa X de Y)
- Cards expansíveis para detalhes
- Animações suaves de entrada
- Cores e ícones consistentes com o design system
- Micro-interações nos botões e links

---

## ARQUIVOS A SEREM MODIFICADOS

1. **`tailwind.config.ts`** - Adicionar keyframe de bounce
2. **`src/components/ui/module-card.tsx`** - Aplicar animação de hover
3. **`src/pages/Guia.tsx`** - Reestruturação completa com foco em UX

## RESULTADO ESPERADO

- Módulos do painel com feedback visual imediato ao hover
- Guia de uso como experiência de onboarding profissional
- Usuário consegue entender e usar o sistema sem ajuda externa
- Design consistente com a identidade "Focus Inteligente"
