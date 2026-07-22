export default function SocialProofBar() {
  const segments = ["Agências", "Consultorias", "Freelancers", "PMEs"];
  return (
    <section className="border-y border-border/60 bg-background-secondary/30">
      <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col sm:flex-row items-center justify-center gap-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          <span className="text-foreground font-semibold">+100 operações</span> já rodam no Hub Empresarial
        </p>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {segments.map((s) => (
            <span
              key={s}
              className="px-3 py-1.5 rounded-full border border-border bg-background text-xs text-foreground/80 transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent cursor-default"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
