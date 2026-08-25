# Estilo visual da focusinteligente.com.br no Hub Central

Mesma hierarquia, mesmos textos, mesmas seções e mesmos componentes. Muda só a pele: cor, tipografia, textura e detalhes de borda/botão.

## O que caracteriza o visual do site

- Fundo preto profundo (quase #0A0A0B), sem gradiente colorido.
- Malha de grade sutil no fundo (linhas finas quase invisíveis).
- Títulos enormes, grotesca geométrica, peso alto e tracking negativo ("Clareza. Precisão. Operação.").
- Micro-rótulos em monoespaçada MAIÚSCULA com prefixo `/` ou bolinha (ex.: `/ ARQUITETURA DE OPERAÇÃO`, `● HUB EMPRESARIAL`).
- Acento azul elétrico usado com parcimônia (links ativos, bolinhas, um CTA).
- Cartões e pílulas: cantos bem arredondados, fundo levemente acima do preto, borda de 1px muito discreta, sem sombra colorida.
- Botão principal: pílula branca com texto preto; secundário: pílula com borda fina.

## Aplicação (sem mexer na hierarquia)

1. **Paleta da rota "/"** — o Hub Central passa a renderizar sempre no tema escuro Focus: fundo preto, superfícies de cartão levemente elevadas, texto branco/cinza, acento azul elétrico substituindo a menta nessa página. O resto do app (área logada) continua como está.
2. **Fundo com grade** — camada de grade fina fixa atrás do conteúdo, com fade nas bordas. Sem animação.
3. **Tipografia** — H1 "Ferramentas pra organizar sua operação." passa de serifa para a grotesca do site, peso forte e tracking apertado, um pouco maior. Subtítulos das seções ("Templates Notion", "Produtos Lovable", "Fale comigo") no mesmo espírito; a linha de apoio de cada seção vira micro-rótulo mono maiúsculo com o prefixo `/`. "Hub Central" no hover do logo continua em Montserrat Alternates.
4. **Cartões** — borda 1px sutil, fundo elevado, hover sem sombra colorida (só clareia a borda e sobe 2px). Selos "Grátis", "Recomendado", "Em breve" viram pílulas mono maiúsculas com bolinha, no estilo da faixa inferior do site.
5. **Abas e botões** — abas do catálogo no formato pílula mono maiúscula, ativa com bolinha azul; CTA principal vira pílula branca sobre preto, secundário com borda fina.
6. **Diálogo de produto e rodapé** — mesmos tokens (fundo preto, borda fina, botão pílula), rodapé mantém o tamanho compacto atual.

## Detalhes técnicos

- Tokens novos escopados por um wrapper `data-theme="focus"` na página Central (definidos em `src/index.css`), pra não alterar o tema light do app logado.
- Fonte display: carregar a grotesca via Google Fonts no `index.html` e mapear em `tailwind.config.ts` como uma família nova; `font-display` (Instrument Serif) segue existindo para o resto do app.
- Arquivos: `src/index.css`, `tailwind.config.ts`, `index.html`, `src/pages/Central.tsx`, `src/components/central/{AbasCatalogo,CardAdvisor,ProdutoDialog,AvisoHubAntigo}.tsx`.
- Sem mudança de banco, de rotas ou de lógica de captura de lead.
