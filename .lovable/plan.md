# Cabeçalho do Hub Central — nome só no hover

## O que muda

Hoje o logo aparece com "Hub Central" fixo embaixo e o rótulo "/ by Focus Inteligente" surgindo no hover.

Novo comportamento:

- Estado padrão: **apenas o logo** centralizado (nada de texto embaixo).
- Ao passar o mouse (ou focar via teclado): **"Hub"** desliza para a esquerda do logo e **"Central"** para a direita, ambos surgindo com fade.
- Logo abaixo do logo, aparece o rótulo **"/ by Focus Inteligente"** com o mesmo fade suave.

```text
  repouso:            hover:
     [logo]        Hub  [logo]  Central
                     / by Focus Inteligente
```

## Detalhes técnicos

- Arquivo: `src/pages/Central.tsx` (bloco `<header>`, linhas ~158-186).
- Trocar a coluna atual por uma linha flex centralizada: `Hub` (translate-x positivo → 0, opacity 0 → 1), logo no centro, `Central` (translate-x negativo → 0, opacity 0 → 1), tudo disparado por `group-hover` / `group-focus-visible`.
- Reservar espaço fixo para os dois lados (largura mínima ou `absolute` em relação ao logo) para o logo não "pular" ao aparecer o texto.
- Manter tipografia `font-brand` (Montserrat Alternates), o halo/glow e o `wordmark-sheen`.
- O rótulo "/ by Focus Inteligente" vira uma linha abaixo com altura reservada (`h-5`), evitando deslocar as abas.
- Respeitar `motion-reduce:transition-none` e manter `aria-label="Hub Central"` para acessibilidade/SEO.
- Nenhuma outra seção da página é alterada.
