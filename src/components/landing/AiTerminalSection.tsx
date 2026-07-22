import { FadeIn } from "@/components/motion";

const lines: { q: string; a: string }[] = [
  {
    q: "quanto faturei em julho?",
    a: "R$ 48.200 · 12% acima de junho · Mar Azul = 28% da receita.",
  },
  {
    q: "quais clientes estão em risco?",
    a: "3 clientes: Nubank (60d sem contato), Petshop Lua (fatura em atraso), Studio W (churn provável).",
  },
  {
    q: "gere o relatório de outubro",
    a: "Relatório pronto · R$ 57.600 · +24% · 5 novos contratos · enviando por email…",
  },
];

export default function AiTerminalSection() {
  return (
    <section id="ia-mcp" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 grid lg:grid-cols-[1fr_1.1fr] gap-12 items-center">
        <FadeIn>
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent font-medium">
              IA nativa · Não é chatbot genérico
            </span>
            <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]">
              Converse com a sua{" "}
              <span className="font-display italic font-normal text-accent">operação</span>.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              O assistente do Hub lê seus dados reais — não inventa. Pergunte sobre receita,
              projetos em atraso, clientes em risco. Ele responde com números, não com "posso ajudar?".
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-foreground/80">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Enriquecimento automático de empresas (site, setor, funcionários)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Classificação de leads e sugestão de próximos passos
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Relatórios em segundos, enviados pelo seu Gmail
              </li>
            </ul>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="rounded-2xl bg-slate-950 border border-slate-800 shadow-elegant overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-800 bg-slate-900/50">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              <span className="ml-3 font-mono text-[11px] text-slate-500">hub-assistant · você</span>
            </div>
            <div className="p-5 font-mono text-[13px] leading-relaxed space-y-4 min-h-[340px]">
              {lines.map((l, i) => (
                <div key={i}>
                  <p className="text-emerald-400">
                    <span className="text-slate-500">$</span> {l.q}
                  </p>
                  <p className="mt-1 text-slate-300 pl-3 border-l border-slate-700">{l.a}</p>
                </div>
              ))}
              <p className="text-emerald-400">
                <span className="text-slate-500">$</span>{" "}
                <span className="inline-block w-2 h-4 bg-emerald-400 align-middle animate-pulse" />
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
