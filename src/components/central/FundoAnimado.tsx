// Fundo animado do Hub Central — "aurora" em movimento lento sobre a grade.
// Puro CSS (sem canvas/JS por frame): custo próximo de zero e respeita
// prefers-reduced-motion. Fica atrás de todo o conteúdo (z-index negativo).
export function FundoAnimado() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Camadas de luz que derivam devagar, criando profundidade */}
      <div className="aurora-blob aurora-a" />
      <div className="aurora-blob aurora-b" />
      <div className="aurora-blob aurora-c" />

      {/* Brilho superior fixo: ancora o olhar no topo da página */}
      <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,hsl(var(--primary)/0.16),transparent_70%)]" />

      {/* Vinheta inferior: dá peso e evita que a aurora "vaze" no rodapé */}
      <div className="absolute inset-x-0 bottom-0 h-[280px] bg-[linear-gradient(to_top,hsl(var(--background)),transparent)]" />
    </div>
  );
}
