import { Step } from "react-joyride";

export const tourSteps: Step[] = [
  {
    target: '[data-tour="hero"]',
    title: "🚀 Bem-vindo ao Guia!",
    content:
      "Este é o seu ponto de partida para dominar o Hub Empresarial. Aqui você aprende tudo o que precisa para organizar sua operação em poucos minutos.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="progress"]',
    title: "📊 Sua Jornada",
    content:
      "Acompanhe seu progresso de configuração aqui. A barra mostra em qual etapa você está e quanto falta para completar a configuração inicial.",
    placement: "bottom",
  },
  {
    target: '[data-tour="journey"]',
    title: "🎯 Etapas de Configuração",
    content:
      "Siga as 4 etapas para configurar seu Hub: desde os primeiros minutos até os recursos avançados. Clique em cada card para ver as tarefas de cada fase.",
    placement: "top",
  },
  {
    target: '[data-tour="modules"]',
    title: "📦 Conheça os Módulos",
    content:
      "Cada módulo cuida de uma área do seu negócio: Finanças, Clientes, Projetos, Tarefas, RH, Marketing e Processos. Clique em 'Ir para' para começar a usar.",
    placement: "top",
  },
  {
    target: '[data-tour="tips"]',
    title: "💡 Dicas de Produtividade",
    content:
      "Estas dicas vão ajudar você a extrair o máximo do sistema. Pequenas práticas que fazem grande diferença no dia a dia.",
    placement: "top",
  },
  {
    target: '[data-tour="faq"]',
    title: "❓ Perguntas Frequentes",
    content:
      "Tem dúvidas? Aqui você encontra respostas rápidas para as perguntas mais comuns sobre o uso do Hub Empresarial.",
    placement: "top",
  },
  {
    target: '[data-tour="cta"]',
    title: "🎉 Pronto para Começar!",
    content:
      "Depois de conhecer o sistema, clique aqui para ir direto ao Painel Principal e começar a usar o Hub Empresarial!",
    placement: "top",
  },
];
