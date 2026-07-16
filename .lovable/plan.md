## Objetivo
Transformar o link discreto "ChatGPT / Claude" no header do `/auth` em uma oferta visualmente atrativa que gere cliques.

## Diagnóstico
Hoje é um link cinza pequeno, sem contraste, sem promessa de valor — parece um item secundário de navegação. Compete visualmente perdendo até para "Ver Preços".

## Proposta visual (novo CTA)

**Pill/badge chamativo** com:
- Fundo com gradiente sutil (primary/accent) + borda brilhante
- Ícone `Sparkles` animado (pulse suave)
- Badge "NOVO" em destaque
- Copy: **"Novo · Use no ChatGPT e Claude"** (promessa clara + gancho de novidade)
- Hover: leve scale + glow
- Mobile: versão compacta "✨ Novo no ChatGPT"

```
┌─────────────────────────────────────────┐
│ ✨ NOVO · Use no ChatGPT e Claude  →   │
└─────────────────────────────────────────┘
```

## Reforço adicional (mesmo local)
No hero de `/auth`, o link secundário "Conectar ao ChatGPT / Claude" também vira uma **mini-card com selo "Grátis para clientes"** ao invés de texto simples, reforçando o valor sem competir com o CTA principal "Cadastrar".

## Arquivos a alterar
- `src/components/auth/AuthHeader.tsx` — substituir link por pill com gradiente, badge NOVO, Sparkles animado
- `src/pages/Auth.tsx` (área do hero, ~linhas 243-250) — transformar link secundário em mini-card com selo

## Fora de escopo
- Não mexer na landing `/mcp` em si
- Não alterar posição do "Ver Preços" (fica como está, ao lado)
- Sem mudanças em lógica/backend

## Copy alternativas (para você escolher se quiser)
1. "✨ NOVO · Use no ChatGPT e Claude" (recomendado — foco em novidade + ação)
2. "🤖 Conecte sua IA favorita — Grátis"
3. "✨ Agora no ChatGPT · Grátis para clientes"

Confirma essa direção? Posso implementar já com a opção 1, ou você prefere outra copy?
