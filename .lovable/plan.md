# Redesign Auth Page - Estilo CreateSpace com Dialogs

## Conceito

Transformar `/auth` de uma pagina com formulario integrado para uma **landing page hero fullscreen** com formularios em **popups (Dialog)**. O usuario chega na pagina, ve a proposta de valor e clica em "Entrar" ou "Cadastrar" para abrir o respectivo dialog.

## Analise de Conversao

Este estilo e eficaz para conversao por 3 motivos:

1. **Impacto visual imediato** — hero fullscreen com headline grande transmite profissionalismo e gera desejo antes de pedir qualquer dado
2. **Reducao de fricao** — o formulario so aparece quando o usuario ja decidiu agir (clicou no botao), reduzindo a sensacao de "formulario longo"
3. **Dois CTAs claros** — "Cadastrar" (primario, destaque) e "Entrar" (secundario) direcionam tanto novos quanto usuarios existentes sem confusao

**Ponto de atencao**: para o seu funil (trafego pago → landing page → /auth), esse modelo funciona bem porque o usuario ja chega pre-qualificado. O hero reafirma a proposta e os botoes convertem a intencao.

## Layout da Pagina

```text
┌──────────────────────────────────────────┐
│  [Logo do hub]              [Ver Preços]  │  ← Header
├──────────────────────────────────────────┤
│                                          │
│     O sistema de gestão feito para       │
│     agências e consultorias              │  ← Hero fullscreen
│     que querem escalar.                  │     com fundo dark + 
│                                          │     gradiente sutil
│     Subtitulo + modulos                  │
│                                          │
│     [Cadastrar]    [Entrar]              │  ← CTAs
│                                          │
│     Ver Preços ↓                         │
│                                          │
│     Prova social + badges confianca      │
│                                          │
├──────────────────────────────────────────┤
│  Termos · Privacidade · Preços           │  ← Footer
└──────────────────────────────────────────┘
```

Ao clicar "Cadastrar" → abre Dialog com formulario de signup
Ao clicar "Entrar" → abre Dialog com formulario de login

## Arquivos a alterar

### 1. `src/pages/Auth.tsx`

- Layout hero fullscreen (min-h-screen, centralizado)
- Headline grande com `gradient-text` na palavra destaque
- Subtitulo com modulos
- Dois botoes: "Cadastrar" (btn-hero, primario) e "Entrar" (btn-secondary, outline)
- Link "Ver Preços" abaixo dos botoes
- Prova social (avatares + "43 empresas") e badges de confianca
- Badge de urgencia
- Dois Dialogs controlados por estado: loginOpen e signupOpen

### 2. `src/components/auth/AuthFormPanel.tsx`

- Refatorar para ser usado dentro de Dialogs
- Separar em dois componentes ou aceitar prop de modo (login/signup)
- Remover Tabs (cada dialog mostra apenas seu formulario)
- Manter toda a logica de validacao e submit existente
- Manter botao Google OAuth em ambos os dialogs

### 3. `src/components/auth/AuthHeroSection.tsx`

- Remover (conteudo sera integrado diretamente em Auth.tsx)

### 4. `src/components/auth/AuthHeader.tsx`

- Manter como esta (logo Focus + Ver Precos)

### 5. `src/components/auth/AuthFooter.tsx`

- Manter como esta

## O que NAO muda

- Logica de autenticacao (signIn, signUp, Google OAuth, rate limiting)
- AuthContext, hooks, backend
- Nenhuma alteracao de banco de dados
- AuthFooter e AuthHeader permanecem

## Detalhes tecnicos

- Usar `Dialog` de `@/components/ui/dialog` para os popups
- Classes CSS existentes: `gradient-text`, `text-glow`, `btn-hero`, `btn-secondary`, `badge-primary`, `gradient-dark`
- Responsivo: no mobile, botoes empilham verticalmente, headline menor
- Nenhuma dependencia nova