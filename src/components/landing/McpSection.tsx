import { Link } from "react-router-dom";
import { useState } from "react";
import { Copy, Check, ArrowRight, Sparkles } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { useToast } from "@/hooks/use-toast";

const MCP_URL = "https://hnextembswhejumvxbzd.supabase.co/functions/v1/mcp";

const steps = [
  { n: "01", title: "Copie o endereço", desc: "URL do servidor MCP oficial do Hub." },
  { n: "02", title: "Cole no conector", desc: "ChatGPT, Claude, Cursor ou Codex — todos suportam MCP." },
  { n: "03", title: "Autorize com sua conta", desc: "Login seguro via OAuth. A IA acessa só o que você libera." },
];

export default function McpSection() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(MCP_URL);
      setCopied(true);
      toast({ title: "Endereço copiado" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  return (
    <section className="py-20 md:py-28 border-t border-border/60 bg-background-secondary/30">
      <div className="mx-auto max-w-5xl px-6">
        <FadeIn>
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/30 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] font-semibold text-accent">
              <Sparkles className="w-3 h-3" />
              Novo · Servidor MCP oficial
            </span>
            <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]">
              O que é o MCP — e como conectar o Hub à sua{" "}
              <span className="font-display italic font-normal text-accent">IA</span>.
            </h2>
            <p className="mt-5 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              MCP (Model Context Protocol) é o padrão aberto que dá à IA acesso seguro aos dados do
              seu Hub. Sem plugin, sem workaround: você conecta uma vez e conversa com sua operação
              direto do ChatGPT, Claude ou Cursor.
            </p>
          </div>
        </FadeIn>

        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-accent/40"
            >
              <span className="font-mono text-xs text-accent font-semibold tracking-wider">{s.n}</span>
              <h3 className="mt-2 font-semibold text-foreground">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-slate-950 p-4 flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-slate-500 pl-2 shrink-0 hidden sm:inline">
            Endpoint
          </span>
          <code className="flex-1 font-mono text-xs sm:text-sm text-emerald-300 truncate">
            {MCP_URL}
          </code>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 transition-colors shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {["ChatGPT", "Claude", "Cursor", "Codex"].map((t) => (
            <span
              key={t}
              className="px-3 py-1 rounded-full border border-border bg-background text-xs font-medium text-foreground/80 transition-all hover:-translate-y-0.5 hover:border-accent"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/mcp"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            Ver página completa do MCP
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
