

# Ajustes na página Auth

## Alterações

### 1. `src/pages/Auth.tsx`
- **Remover o badge "AO VIVO — Hub Empresarial"** (linhas 117-123)
- **Melhorar o fundo temático** — substituir o grid simples atual (opacity 0.04) por um pattern mais rico e visível (~8% opacidade):
  - Grid principal de 60px mantido mas com opacidade maior
  - Adicionar um segundo layer com formas geométricas (retângulos simulando cards/dashboards, linhas horizontais simulando documentos) via SVG inline como background-image
  - Aumentar a intensidade dos blur blobs (de `bg-primary/5` para `bg-primary/10`)
  - Adicionar um terceiro blob decorativo central

### 2. `src/components/auth/AuthHeader.tsx`
- Trocar o texto "Focus" por **"Hub Empresarial"** (linha 10)

Nenhuma outra alteração — lógica, dialogs, footer permanecem iguais.

