

# Redesign da Tela de Login - Estilo Landing Page Hub Empresarial

## Objetivo

Transformar a tela de login (`/auth`) para seguir o estilo visual e a estrutura de conversao da pagina https://focusinteligente.com.br/hub-empresarial. A tela atual usa um layout split-screen (branding esquerda + formulario direita). A nova versao sera uma pagina single-column, centrada, com hero section + formulario integrado, replicando a experiencia da landing page.

## Elementos visuais da landing page a replicar

- Fundo dark premium com gradientes sutis
- Headline grande e impactante com destaque em gradient-text ("agencias e consultorias")
- Badge "AO VIVO" com avatares circulares + "43 empresas ja utilizam"
- Subtitulo descritivo dos modulos
- Frase de preco em destaque ("Gratis para comecar. Planos a partir de R$69/mes.")
- CTA forte ("Testar Gratis por 30 dias")
- Linha de confianca ("Sem cartao de credito . Cancele quando quiser")
- Badge de urgencia ("Primeiros 100 usuarios ganham acesso antecipado...")
- Formulario de cadastro/login logo abaixo, integrado na mesma pagina

## Arquivos a alterar

### 1. `src/pages/Auth.tsx`
- Remover layout split-screen (flex-row com BrandingPanel + FormPanel)
- Novo layout: coluna unica centralizada
- Hero section no topo (headline, prova social, subtitulo)
- Formulario abaixo do hero, centralizado

### 2. `src/components/auth/AuthBrandingPanel.tsx` → remover ou substituir
- O conteudo do branding sera integrado diretamente na pagina Auth como hero section
- Pode ser refatorado em um novo componente `AuthHeroSection.tsx`

### 3. Novo: `src/components/auth/AuthHeroSection.tsx`
- Logo Hub Empresarial + badge
- Headline: "O sistema de gestao feito para **agencias e consultorias** que querem escalar."
- Indicador "AO VIVO" + avatares coloridos + "43 empresas ja utilizam"
- Subtitulo com modulos
- Frase de preco em primary
- Badge de urgencia com icone sparkles

### 4. `src/components/auth/AuthFormPanel.tsx`
- Remover container glass/card externo (formulario fica integrado na pagina)
- Manter tabs Login/Cadastrar
- Atualizar CTA principal para "Testar Gratis por 30 dias" (signup) com seta
- Manter badges de confianca abaixo
- Estilo mais limpo, largura max-w-md centralizado
- Remover headline/subtitulo duplicados (ja estao no hero)

### 5. `src/components/auth/AuthHeader.tsx`
- Simplificar: logo "Focus" a esquerda, link "Ver Precos" a direita (ja esta assim, manter)

### 6. `.lovable/plan.md`
- Atualizar plano com novo posicionamento para agencias/consultorias

## O que NAO muda
- Logica de autenticacao (signIn, signUp, Google OAuth)
- Backend, banco de dados, edge functions
- AuthFooter (manter como esta)
- Funcionalidade de MFA, convites, etc.

## Detalhes tecnicos

- Apenas alteracoes de UI (React + Tailwind)
- Usar classes CSS existentes: `gradient-text`, `gradient-dark`, `text-glow`, `badge-primary`, `btn-hero`, `glass`, `shadow-glow`
- Layout responsivo: no mobile, hero compacto + formulario empilhado
- Nenhuma dependencia nova

