# Ajustes no bloco de Templates Notion

## 1. Card com imagem encaixada e selo alinhado
- O selo "Recomendado" sai de fora do card (hoje flutua acima da borda) e passa a ficar **dentro** do bloco, sobreposto no canto superior esquerdo da imagem.
- A imagem deixa de ter margem interna: o bloco perde o padding no topo e a foto passa a ocupar toda a largura do card, encostada nas bordas arredondadas (topo do card = topo da imagem).
- Texto (nome, selo Grátis, descrição, CTA) continua com respiro embaixo da imagem.
- Proporção fixa 16:10 mantida, com `object-cover`, para todos os cards ficarem do mesmo tamanho.

## 2. Detalhe ao clicar: imagem → descrição → formulário
Ao clicar no bloco, a janela mostra nesta ordem:
1. Nome do produto (ex.: "Controle Financeiro") com os selos Grátis/Recomendado;
2. **Imagem do template** — hoje ela não aparece porque a janela só usa a galeria (vazia); passa a usar a capa como primeira imagem quando não há galeria;
3. Descrição ("Organize suas finanças e controle de gastos, receitas e metas");
4. Formulário com **Nome** e **E-mail obrigatórios** — o botão fica desativado até os dois estarem válidos, com aviso de campo obrigatório ao sair do campo vazio;
5. Botão "Quero o template": grava o lead, avisa no Slack e **redireciona direto** para o template do Notion na mesma janela (hoje abre em nova aba, que pode ser bloqueada pelo navegador). Se o redirecionamento falhar, a tela de confirmação com o botão "Abrir agora" continua disponível.

## 3. Imagem do produto com link permanente
A capa hoje está salva com um link assinado que **expira** (o bucket de produtos é privado). Vamos tornar o bucket público e regravar a capa com URL pública, para a foto não sumir depois de alguns dias.

## Detalhes técnicos
- `src/pages/Central.tsx` — `CardProduto`: padding só no bloco de texto, imagem full-bleed com `rounded-t-2xl`, badge absoluto dentro da imagem.
- `src/components/central/ProdutoDialog.tsx` — galeria com fallback `imagens.length ? imagens : [capa]`; validação obrigatória com mensagens; troca `window.open` por `window.location.assign` após o insert em `leads`.
- Storage: marcar o bucket `produtos` como público e atualizar a coluna `capa` do registro `controle-financeiro` para a URL pública (`/object/public/produtos/...`). Upload no admin passa a gerar URL pública.
- Sem mudanças de schema; o fluxo de lead (tabela `leads` + notificação Slack + `registrarEvento`) permanece igual.
