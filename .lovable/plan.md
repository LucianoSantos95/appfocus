
# Plano: Tour Guiado Interativo para o Guia de Uso

## Objetivo
Criar um tour guiado interativo que destaca cada elemento da interface quando o usuário acessa a página de Guia de Uso pela primeira vez. O tour será acionado apenas na página `/guia` e usará localStorage para lembrar se o usuário já completou o tour.

---

## Arquitetura da Solução

```text
+------------------+     +----------------------+     +------------------+
|   Guia.tsx       | --> | GuidedTour Component | --> | react-joyride    |
|   (página)       |     | (lógica do tour)     |     | (biblioteca UI)  |
+------------------+     +----------------------+     +------------------+
         |                         |
         v                         v
  localStorage               Estilos CSS
  (hasSeenTour)              (tema dark)
```

---

## Etapas do Tour (8 passos)

| Passo | Elemento | Título | Descrição |
|-------|----------|--------|-----------|
| 1 | Hero Section | Bem-vindo ao Guia! | Apresentação inicial e objetivo da página |
| 2 | Progress Bar | Sua Jornada | Como acompanhar seu progresso de configuração |
| 3 | Journey Cards | Etapas de Configuração | Como navegar pelas 4 etapas do onboarding |
| 4 | Module Cards | Conheça os Módulos | Cards que explicam cada módulo do sistema |
| 5 | Productivity Tips | Dicas de Produtividade | Atalhos e melhores práticas |
| 6 | FAQ Section | Perguntas Frequentes | Onde encontrar respostas rápidas |
| 7 | CTA Section | Pronto para Começar | Como ir para o Painel Principal |
| 8 | Pro Features | Funcionalidades Pro | Recursos avançados disponíveis |

---

## Implementação Técnica

### 1. Instalar Dependência
```bash
npm install react-joyride
```

### 2. Criar Componente GuidedTour
**Arquivo:** `src/components/guide/GuidedTour.tsx`

- Wrapper do react-joyride com configuração personalizada
- Tema dark matching com o design system "Focus Inteligente"
- Callbacks para finalizar/pular o tour
- Integração com localStorage

### 3. Definir Steps do Tour
**Arquivo:** `src/components/guide/tourSteps.ts`

- Array de steps com targets CSS
- Conteúdo em português
- Posicionamento otimizado para cada elemento

### 4. Atualizar Guia.tsx
**Arquivo:** `src/pages/Guia.tsx`

- Adicionar data-tour-id em cada seção
- Importar e renderizar GuidedTour
- Botão "Refazer Tour" para usuários que queiram ver novamente

### 5. Estilos Customizados
**Arquivo:** `src/index.css`

- Estilos para tooltips do tour
- Overlay com blur suave
- Cores consistentes com o tema dark

---

## Comportamento do Tour

### Primeira Visita
1. Usuário acessa `/guia`
2. Tour inicia automaticamente
3. Spotlight destaca cada elemento
4. Usuário pode avançar, voltar ou pular
5. Ao finalizar, localStorage salva `hubTourCompleted: true`

### Visitas Subsequentes
1. Tour não inicia automaticamente
2. Botão "Iniciar Tour" disponível no header
3. Usuário pode refazer o tour quando quiser

---

## Customização Visual

```css
/* Cores do tooltip */
--tour-bg: hsl(210, 10%, 9%)        /* Card background */
--tour-text: hsl(210, 40%, 98%)     /* Foreground */
--tour-primary: hsl(213, 94%, 68%)  /* Primary blue */
--tour-overlay: rgba(0, 0, 0, 0.85) /* Overlay escuro */
```

### Animações
- Fade-in suave no tooltip
- Pulse no spotlight
- Transições de 300ms entre steps

---

## Arquivos a Serem Criados/Modificados

| Arquivo | Ação |
|---------|------|
| `src/components/guide/GuidedTour.tsx` | Criar |
| `src/components/guide/tourSteps.ts` | Criar |
| `src/pages/Guia.tsx` | Modificar |
| `src/index.css` | Modificar (adicionar estilos do tour) |
| `package.json` | Adicionar react-joyride |

---

## Detalhes Técnicos

### Hook de Controle
```typescript
const [runTour, setRunTour] = useState(false);
const [hasSeenTour, setHasSeenTour] = useState(() => {
  return localStorage.getItem('hubTourCompleted') === 'true';
});

useEffect(() => {
  if (!hasSeenTour) {
    // Pequeno delay para elementos renderizarem
    setTimeout(() => setRunTour(true), 500);
  }
}, [hasSeenTour]);
```

### Callback de Finalização
```typescript
const handleTourFinish = (data: CallBackProps) => {
  const { status } = data;
  if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
    setRunTour(false);
    localStorage.setItem('hubTourCompleted', 'true');
    setHasSeenTour(true);
  }
};
```

### Configuração do Joyride
```typescript
<Joyride
  steps={tourSteps}
  run={runTour}
  continuous
  showProgress
  showSkipButton
  spotlightClicks
  disableOverlayClose
  locale={{
    back: 'Voltar',
    close: 'Fechar',
    last: 'Finalizar',
    next: 'Próximo',
    skip: 'Pular Tour'
  }}
  styles={{
    options: {
      backgroundColor: 'hsl(210, 10%, 9%)',
      textColor: 'hsl(210, 40%, 98%)',
      primaryColor: 'hsl(213, 94%, 68%)',
      overlayColor: 'rgba(0, 0, 0, 0.85)',
      zIndex: 10000,
    }
  }}
/>
```

---

## Resultado Esperado

- Tour guiado profissional com visual premium
- Experiência de onboarding clara e intuitiva
- Usuário aprende a navegar pelo sistema interativamente
- Integração perfeita com o design "Focus Inteligente"
- Opção de refazer o tour a qualquer momento
