# Logo ao lado do título das seções (hover)

## Comportamento

Nos títulos "Templates Notion" e "Produtos Lovable":

- Repouso: só o texto, como hoje.
- Hover (ou foco por teclado) na seção: o logo correspondente aparece ao lado direito do título, com fade + leve deslize da esquerda para a direita e um micro-scale.
  - "Templates Notion" → ícone do Notion (cubo preto/branco).
  - "Produtos Lovable" → coração colorido da Lovable.
- "Fale comigo" (Advisor) continua sem logo.

```text
  repouso:                    hover:
  Templates Notion            Templates Notion  [N]
  Produtos Lovable            Produtos Lovable  [♥]
```

## Detalhes

- O espaço do logo fica reservado (largura fixa) para o título não deslocar ao aparecer.
- Tamanho do ícone alinhado à altura da linha do H2 (~28-32px), com opacidade total no hover.
- O ícone do Notion é preto sobre fundo escuro; no tema Focus (fundo quase preto) ele recebe um fundo branco arredondado pequeno para ficar legível; no tema claro, sem fundo.
- Respeita `motion-reduce:transition-none`; ícones marcados `aria-hidden` (decorativos).

## Técnico

- Assets: os dois PNGs enviados entram como assets do projeto (`lovable-assets` → `src/assets/notion.png.asset.json` e `lovable-color.png.asset.json`), importados no componente.
- Arquivo: `src/pages/Central.tsx` — o mapa `SECOES` ganha um campo opcional `logo`, e o bloco do `<h2>` (linha ~249) vira um flex com o `<img>` animado via `group-hover`. A `<section>` recebe `className="group"`.
- Nenhuma outra seção, dado ou lógica é alterada.
