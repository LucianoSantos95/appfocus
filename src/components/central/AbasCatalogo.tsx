import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

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
      <nav className="mx-auto max-w-5xl px-6 py-3 flex items-center gap-2" aria-label="Seções do catálogo">
        <div className="flex gap-2 overflow-x-auto">
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
        </div>

        <div className="ml-auto pl-2">
          <BotaoTema />
        </div>
      </nav>
    </div>
  );
}

// Luzinha de tema: mesma linha das abas, encostada na direita.
function BotaoTema() {
  const { theme, toggleTheme } = useTheme();
  const claro = theme === "light";
  return (
    <button
      onClick={toggleTheme}
      aria-label={claro ? "Ativar modo escuro" : "Ativar modo claro"}
      title={claro ? "Modo escuro" : "Modo claro"}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {claro ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
    </button>
  );
}
