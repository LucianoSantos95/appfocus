# Redesign Auth Page - Estilo PhotoSpace com Palavra Rotativa

## Conceito

Replicar o estilo do PhotoSpace: headline gigante com **ultima palavra rotativa animada** (gradient), subtitulo curto, dois CTAs (Cadastrar abre dialog, Entrar abre dialog), fundo com imagem/pattern temático de sistema de gestão, e prova social com logos fictícios.

## Elementos-chave

### 1. Headline com palavra rotativa

Frase fixa: **"Gestão inteligente para"** seguida de uma palavra que muda a cada ~3s com animação fade/slide:

- **escalar** → **organizar** → **automatizar** → **crescer** → **faturar**

A palavra rotativa usa `gradient-text text-glow` como destaque. Fonte grande (text-5xl / text-7xl).

### 2. Subtitulo + 7 módulos com hover

Subtitulo curto: "Tudo que sua agência precisa em um só lugar."
Abaixo, 7 ícones/badges dos módulos (Finanças, Projetos, Clientes, RH, Marketing, Tarefas, Processos) — ao passar o mouse, aparece tooltip ou hover-card com descrição breve do módulo.

### 3. Fundo temático

Background com pattern sutil de elementos de gestão (grids, dashboards, documentos) usando CSS — pode ser um SVG pattern ou gradiente radial com formas geométricas sutis em opacidade baixa (~5-10%), mantendo o estilo dark premium do Hub.

### 4. Prova social com logos fictícios

As 5 bolinhas terão **iniciais estilizadas** simulando logos de empresas fictícias (ex: "MK", "DS", "AT", "NX", "VP") com cores distintas e tipografia bold — em vez de A, B, C, D, E.

### 5. CTAs → Dialogs

- **"Cadastrar"** (btn-hero, primário) → abre `AuthSignupDialog`
- **"Entrar"** (outline) → abre `AuthLoginDialog`
- Link "Ver Preços ↓" abaixo

## Layout

```text
┌──────────────────────────────────────────┐
│  [Logo Focus]              [Ver Preços]  │
├──────────────────────────────────────────┤
│         [fundo pattern gestão]           │
│                                          │
│     Gestão inteligente para              │
│           escalar ←(rotativa, gradient)  │
│                                          │
│  Tudo que sua agência precisa em um      │
│  só lugar.                               │
│                                          │
│  [💰][📊][👥][🧑‍💼][📣][✅][⚙️]  ← hover = desc │
│                                          │
│     [Cadastrar]    [Entrar]              │
│                              
│                                          │
│  [MK][DS][AT][NX][VP] 43 empresas já...  │
│  🔒 Sem cartão · ❌ Cancele quando quiser│
│  ✨ Primeiros 100 usuários...            │
│                                          │
├──────────────────────────────────────────┤
│  Termos · Privacidade · Preços           │
└──────────────────────────────────────────┘
```

## Análise de conversão

Este modelo é forte para conversão:

- **Headline rotativa** cria movimento e curiosidade, aumentando tempo na página
- **Módulos com hover** dão informação sem poluir — o visitante descobre no seu ritmo
- **Fundo temático** reforça contexto sem distrair
- **Logos fictícios** transmitem credibilidade mais que letras genéricas

## Arquivos a alterar

### `src/pages/Auth.tsx`

- Adicionar array de palavras rotativas + estado com `useEffect` (intervalo 3s)
- Animação CSS de fade-in/out na palavra
- Substituir lista de módulos por 7 ícones com `HoverCard` (tooltip ao hover)
- Fundo com SVG pattern ou pseudo-element com gradientes geométricos sutis
- Logos fictícios nas bolinhas de prova social (iniciais estilizadas)
- Manter dialogs, header, footer, lógica de auth inalterados

### `src/index.css` (opcional)

- Adicionar keyframe `fadeInUp` para a animação da palavra rotativa

## O que NÃO muda

- AuthLoginDialog, AuthSignupDialog (já funcionam)
- AuthHeader, AuthFooter
- Lógica de auth, backend, banco de dados