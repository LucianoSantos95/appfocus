export type DemoModule = "financeiro" | "clientes" | "projetos" | "painel";

export const ASSISTANT_MESSAGES: Record<DemoModule, string> = {
  financeiro: `Esse é o seu painel financeiro 💰

Aqui você tem uma visão completa da saúde financeira da sua operação.

No Hub você consegue:
→ Registrar receitas e despesas em segundos
→ Categorizar transações automaticamente
→ Ver seu fluxo de caixa em tempo real
→ Gerar relatórios para clientes

Para começar, clique em **'+ Nova Transação'** ou me pergunte qualquer coisa sobre como usar o financeiro. Pode me arrastar para qualquer canto da tela enquanto explora!`,
  clientes: `Esse é o seu CRM de clientes 👥

Aqui você centraliza toda sua carteira — desde o primeiro contato até o cliente fidelizado.

No Hub você consegue:
→ Organizar clientes por fase do funil
→ Registrar histórico de contatos
→ Definir próximos passos por cliente
→ Ver quem precisa de atenção hoje

Para adicionar seu primeiro cliente, clique em **'+ Novo Cliente'** ou me pergunte como organizar sua carteira. Pode me arrastar pra liberar a tela!`,
  projetos: `Esse é o seu gestor de projetos 📋

Aqui você acompanha todas as entregas, prazos e progresso dos seus projetos.

No Hub você consegue:
→ Criar projetos vinculados aos seus clientes
→ Acompanhar progresso em tempo real
→ Receber alertas de prazo
→ Ter visão clara de tudo que está em andamento

Para criar seu primeiro projeto, clique em **'+ Novo Projeto'** ou me pergunte como começar. Pode me arrastar enquanto navega!`,
  painel: `Bem-vindo ao Hub Empresarial 🚀

Você está no painel principal. Aqui está tudo que você pode fazer:

💰 **Finanças** — Controle receitas, despesas e fluxo de caixa
👥 **Clientes** — CRM completo com pipeline de vendas
📋 **Projetos** — Gestão de entregas e prazos
📊 **Marketing** — Campanhas e ideias de conteúdo
👤 **RH** — Gerencie sua equipe e freelancers
⚙️ **Processos** — Padronize fluxos da operação

Explore cada módulo no menu lateral. Pode me arrastar pra qualquer canto da tela enquanto navega!`,
};
