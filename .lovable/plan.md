# Ajuste: decoração Copa do Mundo em tela cheia + landing/Auth

## O que muda

### 1. Confetes e bandeirinhas em tela cheia (não só no banner)

Extrair os efeitos visuais (`Confetti` + `FlagBunting`) do `WorldCupBanner` para um componente global novo `WorldCupOverlay`:
- Posicionado `fixed inset-0 pointer-events-none z-[5]` cobrindo a viewport inteira.
- **Confetes** caem do topo ao rodapé da tela (não apenas dentro do banner), ~28 partículas distribuídas em toda a largura, com `position: fixed` e animação `translateY(100vh)`.
- **Bandeirinhas (varal)** no topo absoluto da tela, atravessando toda a largura (`fixed top-0 left-0 right-0`), ~32 bandeirinhas.
- Fica atrás de modais/dropdowns (`z-index` baixo) mas acima do conteúdo de fundo.
- `pointer-events-none` em tudo — não bloqueia cliques.
- Respeita `prefers-reduced-motion` e fica oculto em mobile (`hidden md:block`) para não pesar.
- Só renderiza se `isWorldCupActive()`.

### 2. Limpar o banner

Remover `Confetti` e `FlagBunting` de dentro do `WorldCupBanner` (agora vêm do overlay global). O banner fica apenas com o conteúdo informativo (faixa "Rumo ao Hexa", cupom, CTA, gradiente).

### 3. Decoração na página de login/landing (`/auth`)

A `Auth.tsx` (landing/conversão) hoje não tem nada relativo à Copa. Plano:
- Montar `WorldCupOverlay` (mesmos confetes e bandeirinhas em tela cheia) também em `Auth.tsx`.
- Adicionar uma **faixa promocional fina** no topo da landing, acima do header "Hub Empresarial":
  - Texto: "🏆 Rumo ao Hexa — Cadastre-se e ganhe 20% OFF nos 3 primeiros meses com o cupom **HEXA**"
  - Botão "Cadastrar" → rola para o formulário ou abre o dialog de signup.
  - Mesma identidade visual: gradiente verde/amarelo/azul, ícone de troféu.
  - Componente novo: `src/components/auth/WorldCupPromoStrip.tsx`.

### 4. Onde montar o overlay global

Em vez de duplicar `WorldCupOverlay` em cada página, montar **uma vez** em `src/App.tsx` (dentro do `BrowserRouter`, fora de rotas) para que apareça em toda a aplicação enquanto a campanha estiver ativa — Home, Planos, Auth, módulos internos, etc.

## Arquivos

**Novos:**
- `src/components/dashboard/WorldCupOverlay.tsx` — confetes + bandeirinhas tela cheia
- `src/components/auth/WorldCupPromoStrip.tsx` — faixa promocional na landing

**Editados:**
- `src/components/dashboard/WorldCupBanner.tsx` — remove `Confetti`/`FlagBunting` internos
- `src/App.tsx` — monta `<WorldCupOverlay />` global
- `src/pages/Auth.tsx` — adiciona `<WorldCupPromoStrip />` no topo

## Detalhes técnicos

- Keyframes movidos para `src/index.css` (em vez de `<style>` inline em cada componente) para evitar duplicação:
  - `@keyframes wc-confetti-fall`
  - `@keyframes wc-flag-sway`
- Z-index: overlay `z-[5]`, conteúdo da página `relative z-10`, modais Radix continuam em `z-50`+ — sem conflitos.
- `getActiveCampaignCoupon()` e `isWorldCupActive()` já existem em `src/lib/campaigns.ts`, expiração automática preservada (após 19/07/2026 tudo some sozinho).

## Resposta à sua pergunta
Sim, faz total sentido — decoração sazonal precisa estar onde o usuário entra (landing/login) e ser visível no fundo de toda a navegação, não confinada a um único bloco. Assim a campanha "respira" pela interface inteira.
