# Hub Central — cartões com galeria e captura no detalhe

## O que muda para quem visita

1. **Logo maior e tipografia própria**: o logo do topo cresce (48px → 64px) e o texto "Hub" / "Central" que aparece no hover passa a usar a fonte **Montserrat Alternates**.
2. **Clicar no cartão abre um detalhe, não um link direto**: qualquer cartão (Notion, Lovable, Advisor) abre um mesmo modelo de janela de detalhe, com:
   - galeria de imagens do produto (setas/pontinhos para navegar) — hoje fica vazia e você sobe as fotos depois pelo painel;
   - nome, selo "Grátis" ou preço e o selo "Recomendado" quando marcado;
   - texto de descrição longa (o que é, o que vem dentro, valor);
   - abaixo, o formulário com **Nome** e **E-mail** e o botão de ação, que redireciona direto para o destino.
3. **Cartão do catálogo**: mantém o formato atual (emoji, selos Grátis/Recomendado), com espaço preparado para uma foto de capa assim que ela existir — sem foto, segue o emoji como hoje.
4. **Advisor**: usa exatamente o mesmo modelo. Ao clicar, a pessoa lê o que é o Advisor, vê o valor da hora e envia o contato pelo mesmo formulário. O botão fica "Quero conversar". O pagamento/booking da hora fica como próximo passo, não entra agora.

## Botões por tipo

- Notion gratuito: "Quero o template" → abre o template ao enviar.
- Produto Lovable: "Quero este" → abre o destino ao enviar.
- Advisor: "Quero conversar" → registra o contato, sem prometer entrega imediata.

## Detalhes técnicos

**Banco (tabela `produtos`)**
- `imagens text[]` (default `{}`) — URLs da galeria, na ordem.
- `capa text` — imagem de capa opcional do cartão.
- `detalhes text` — descrição longa exibida no modal.
- Bucket público de storage `produtos` para hospedar as imagens; upload pelo painel admin de produtos.

**Front**
- `src/components/central/ProdutoDialog.tsx` (novo): substitui o `LeadCaptureDialog` como ponto de entrada. Reaproveita `ui/carousel` para a galeria (esconde a área quando `imagens` está vazio), monta cabeçalho + selos + `detalhes` e embute o formulário de lead atual (mesma inserção em `leads`, mesmo aviso no Slack, mesmo `registrarEvento`).
- A lógica de entrega/copy condicional por `produto.tipo` que hoje vive no `LeadCaptureDialog` migra para esse componente; o arquivo antigo é removido.
- `Central.tsx` e `CardAdvisor.tsx`: o clique sempre abre o dialog (deixa de abrir link direto quando `captura_lead` é falso); `CardAdvisor` passa a chamar o mesmo dialog no CTA principal.
- `index.html`: adiciona Montserrat Alternates ao link do Google Fonts; `tailwind.config.ts` ganha a família `font-brand` usada só no logotipo.
- `ProdutosPanel.tsx` (admin): campos para capa, galeria (upload múltiplo + reordenar/remover) e descrição longa.

## Fora deste passo

- Pagamento e agendamento da hora do Advisor (checkout + calendário) — planejamos separado quando quiser.
