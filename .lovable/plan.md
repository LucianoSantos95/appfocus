## 1. Painel Admin — só colaboradores

Em `src/components/user/AdminPanel.tsx`, remover todos os blocos exclusivos de admin (Métricas do Funil, Usuários que mais voltam, Base de Onboarding, Gerenciar Assinaturas) e o estado/fetches que os alimentam (`funnelMetrics`, `engagement`, `onboardingRows`, busca de assinaturas e `updateSubscriptionPlan`).

Fica apenas:
- **Adicionar Colaborador** (e-mail + permissões por página + Enviar convite)
- **Colaboradores** (lista com status e remover)

Título do diálogo passa a "Equipe". Imports e ícones não usados são limpos. Nenhuma tabela ou política é alterada — só a UI deixa de exibir esses dados.

## 2. Enquadramento de "Meu Perfil"

Em `src/components/user/ProfileDialog.tsx`, o conteúdo hoje corta no rodapé (o bloco de WhatsApp e o botão Salvar ficam escondidos abaixo do limite de altura).

Ajustes:
- Cabeçalho fixo, área de conteúdo com rolagem própria e rodapé fixo com o botão **Salvar** sempre visível.
- Altura máxima passa a `90vh` com padding inferior, para não colar nas bordas.
- Espaçamento uniforme entre seções (dados, senha, 2FA, WhatsApp).

## 3. Formulário "Sistema sob medida"

Em `src/components/customize/CustomizeDialog.tsx`:
- Trocar o campo "O que sua empresa faz" por **"Site da empresa"** (input com placeholder `https://suaempresa.com.br`).
- **Todos os campos passam a obrigatórios**: Nome, E-mail, Empresa, Site da empresa e a dor da operação — todos com `*` no rótulo.
- Botão "Quero conversar" só habilita quando todos estiverem preenchidos e o e-mail for válido; o site é validado como URL simples (aceita com ou sem `https://`, normalizando no envio).
- A mensagem enviada ao Slack passa a incluir o site.

### Detalhe técnico
A tabela `custom_requests` já tem as colunas `empresa` e `atuacao`; o site será gravado numa nova coluna `site` (texto), adicionada por migration, mantendo `atuacao` intacta para os registros antigos.
