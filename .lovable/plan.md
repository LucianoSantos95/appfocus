

# Plano: Redesign da Tela de Login

## O que sera feito

Redesign completo do `src/pages/Auth.tsx` seguindo a estetica da landing page do Hub Empresarial: fundo escuro com gradientes, tipografia grande com `gradient-text`, efeitos de glow, e layout split-screen.

## Mudancas

### Arquivo: `src/pages/Auth.tsx`

**Layout split-screen (desktop):**
- Coluna esquerda (50%): Painel de branding com fundo `gradient-dark`, logo grande, headline "Gestao Completa para PMEs" com `gradient-text`, bullets de modulos (Financas, CRM, Projetos, RH, Marketing, Atividades, Processos) com icones Lucide, efeito `shadow-glow` decorativo, e circulos/formas CSS sutis no fundo
- Coluna direita (50%): Formulario atual de login/cadastro com efeito `glass`, tabs e inputs mantidos, botao principal com `gradient-primary`

**Header discreto:**
- Logo pequeno no canto esquerdo + link "Ver Precos" no canto direito, linkando para `/planos`

**Footer:**
- Links para Termos, Privacidade e Precos centralizados

**Mobile (< 768px):**
- Coluna unica. Branding compacto no topo (logo + headline + subtitulo, sem bullets completos), formulario abaixo

**Elementos visuais da landing page:**
- Gradientes azul eletrico nos textos de destaque
- `shadow-glow` no painel esquerdo
- Badge `badge-primary` com texto "Hub Empresarial"
- Circulos decorativos com CSS (position absolute, blur, opacity baixa)
- Botao "Entrar" e "Criar Conta" com `gradient-primary`

### Arquivo: `.lovable/plan.md`

Adicionar ao final do arquivo a secao do Redesign Auth como tarefa concluida e a Sprint 3 de Automacoes como planejamento futuro.

## Nenhuma mudanca no backend

Apenas frontend. Nenhuma migration, edge function ou tabela nova.

