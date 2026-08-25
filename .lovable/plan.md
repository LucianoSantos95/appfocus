# Ajustes visuais do Hub Central (rota "/")

## 1. Logo centralizado com nome que sai de trás
- Cabeçalho passa a ter apenas o logo, centralizado e um pouco maior (32px → 44px).
- No hover (e no foco por teclado), "Hub" desliza para a esquerda e "Central" para a direita, saindo de trás do logo: partem com `opacity 0` e `translateX 0` e terminam deslocados, com transição suave (~300ms).
- Respeita `prefers-reduced-motion`: sem deslizamento, apenas aparece.

## 2. Título centralizado com subtítulo no hover
- Remove a linha "Seja bem-vindo" / "Bom te ver de novo".
- O bloco do título fica centralizado na página.
- Texto fixo: "Ferramentas pra organizar sua operação."
- Ao passar o mouse sobre o título, aparece logo abaixo: "Pegue o que precisar, sem cadastro e sem custos." (fade + leve subida; espaço reservado para não empurrar o conteúdo).

## 3. Três seções fixas na ordem do funil
1. **Templates Notion** — subtítulo "Gratuitos, prontos pra duplicar e usar hoje". Mostra os produtos do tipo `notion` (hoje, Controle Financeiro).
2. **Produtos Lovable** — mostra os produtos do tipo `lovable`; enquanto não houver nenhum, exibe um card no mesmo formato com "Em breve novos produtos" (estado desabilitado, sem clique).
3. **Fale comigo** — mostra o card Advisor. Enquanto não houver registro no banco, exibe um card "Advisor" com CTA de contato.

As seções passam a aparecer sempre (mesmo vazias), em vez de sumirem quando não há produto. As abas de navegação continuam funcionando com os novos rótulos.

## 4. Rodapé mais enxuto
- Reduz o padding vertical e o tamanho do texto; mantém o link para a Focus.

## Detalhes técnicos
- Arquivos: `src/pages/Central.tsx`, `src/components/central/AbasCatalogo.tsx` (rótulos), possivelmente um pequeno componente novo para o logo com hover.
- Animações só com Tailwind/CSS (`group-hover`, `transition`) — sem nova biblioteca; o stagger de entrada dos cards continua com `src/components/motion`.
- Sem mudanças de banco de dados; os cards placeholder são apenas UI e somem quando produtos reais forem cadastrados.
