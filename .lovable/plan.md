# Ajustes finais antes de publicar o Hub Central

## 1. Botão de tema (claro/escuro)
Adicionar o botão de alternar tema na mesma barra das abas (Notion / Lovable / Advisor), alinhado à direita.
O catálogo hoje força o visual escuro da Focus (`data-theme="focus"`); o botão passa a alternar entre esse modo escuro e uma versão clara equivalente da mesma identidade (mesmo azul, mesma tipografia, fundo claro), com a escolha lembrada no navegador.

## 2. FAQ no rodapé
Bloco de perguntas frequentes acima do rodapé atual, em acordeão, com no máximo 5 itens. Conteúdo inicial proposto (você ajusta o texto depois):
- Preciso criar conta para usar? Não.
- Os templates do Notion são realmente gratuitos?
- Como recebo o template depois de preencher nome e e-mail?
- O que é o Advisor?
- Vocês guardam meus dados? (link para Privacidade)

## 3. Advisor "Em breve"
A seção "Fale comigo" passa a exibir apenas o selo "Em breve" e o texto explicativo — sem botão de contato e sem mailto.

## 4. Card de produto com foto
- Remover o emoji/ícone do card (nada de 💰 ou 📦).
- Reduzir a altura do bloco de texto e dar mais espaço à imagem de capa, para o template já aparecer visualmente no catálogo.
- Quando não houver capa cadastrada, mostrar um espaço neutro em vez de emoji.
- Selos "Grátis" e "Recomendado" continuam como estão.
- Upload das fotos continua no painel de admin (capa + galeria já existentes) — sem mudanças ali.

## 5. Botão de feedback (MVP)
Em dois lugares, ambos abrindo o mesmo formulário curto (nota em estrelas + mensagem + nome/e-mail opcionais):
- Botão flutuante discreto no canto inferior direito, presente no catálogo.
- Link "Enviar feedback" no rodapé, junto do FAQ.

Observação técnica: hoje o banco só aceita feedback anônimo **sem e-mail**. Para permitir que visitantes deixem e-mail (útil para responder), ajusto a regra de acesso da tabela `feedbacks` para aceitar e-mail em envios anônimos, mantendo o resto igual.

## 6. Tirar páginas do ar de verdade
Hoje `/financas`, `/rh`, `/clientes`, `/planos`, `/guia`, etc. redirecionam para `/`, mas os arquivos ainda existem no projeto. Vou:
- Remover os arquivos das páginas: Financas, RH, Marketing, Projetos, Clientes, Tarefas (atividades), Processos, Guia, Planos, Onboarding, Comparar, Glossario, Mcp, OQueEHubEmpresarial (blog), DemoEntry (demo), Index.
- Manter: `/` (catálogo), `/auth` e `/admin` (seu acesso), `/termos`, `/privacidade`, o consent do Lovable e o 404.
- Qualquer outra URL digitada cai no 404 — nenhuma rota "aberta" sobrando.
- Termos e Privacidade continuam no ar (exigência de LGPD para a captura de nome/e-mail).
- Também removo do sitemap e do robots as URLs aposentadas.

## 7. Banco de dados
Conforme sua escolha: **não mexo nas tabelas agora**. As páginas saem do ar, mas nenhum dado é apagado. As bases em uso passam a ser `feedbacks`, `leads`, `support_tickets`, `produtos` e `eventos` (essas duas alimentam o catálogo e as métricas de clique).

## Detalhes técnicos
- `src/components/central/AbasCatalogo.tsx`: linha das abas vira `flex justify-between`, com o toggle de tema à direita.
- Tema claro: variante `[data-theme="focus"].light` em `src/index.css`, controlada pelo `ThemeContext` já existente.
- Novos componentes: `src/components/central/FaqCatalogo.tsx`, `src/components/central/BotaoFeedback.tsx` (reusa `FeedbackDialog`).
- `src/pages/Central.tsx`: card sem emoji, capa maior, Advisor só com selo.
- `src/App.tsx`: remoção dos lazy imports e das rotas de redirecionamento; exclusão dos arquivos em `src/pages/` e dos componentes usados só por elas (limpeza feita com cuidado para não quebrar o build).
- Migração: política de INSERT anônimo em `feedbacks` permitindo e-mail.
