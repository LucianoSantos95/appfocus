import { useEffect, useState } from "react";

// Abas de navegação do catálogo. Não filtram nada — são atalho de scroll,
// com a aba ativa acompanhando a seção visível (IntersectionObserver).
export interface AbaItem {
  tipo: string;
  rotulo: string;
}

export function AbasCatalogo({ abas }: { abas: AbaItem[] }) {
  const [ativa, setAtiva] = useState(abas[0]?.tipo ?? "");

  useEffect(() => {
    if (abas.length === 0) return;
    const alvos = abas
      .map((a) => document.getElementById(`secao-${a.tipo}`))
      .filter(Boolean) as HTMLElement[];
    if (alvos.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visiveis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visiveis[0]) setAtiva(visiveis[0].target.id.replace("secao-", ""));
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 },
    );
    alvos.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [abas]);

  const ir = (tipo: string) => {
    const el = document.getElementById(`secao-${tipo}`);
    if (!el) return;
    setAtiva(tipo);
    const y = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  if (abas.length < 2) return null;

  return (
    <div className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <nav className="mx-auto max-w-5xl px-6 py-3 flex gap-2 overflow-x-auto" aria-label="Seções do catálogo">
        {abas.map((a) => {
          const on = ativa === a.tipo;
          return (
            <button
              key={a.tipo}
              onClick={() => ir(a.tipo)}
              aria-current={on ? "true" : undefined}
              className={`focus-label shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                on
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/25"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full transition-colors ${on ? "bg-primary" : "bg-foreground/30"}`} />
              {a.rotulo}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
