import { DollarSign, Users, FolderKanban, Rocket } from "lucide-react";
import hubLogo from "@/assets/logo.png";
import type { DemoModule } from "@/lib/demo-data";

interface Props {
  firstName: string;
  onChoose: (module: DemoModule) => void;
}

const CHOICES: Array<{
  module: DemoModule;
  icon: typeof DollarSign;
  emoji: string;
  title: string;
  desc: string;
}> = [
  { module: "financeiro", icon: DollarSign, emoji: "💰", title: "Financeiro", desc: "Controle receitas, despesas e fluxo" },
  { module: "clientes", icon: Users, emoji: "👥", title: "Clientes & CRM", desc: "Gerencie sua carteira e pipeline de vendas" },
  { module: "projetos", icon: FolderKanban, emoji: "📋", title: "Projetos", desc: "Acompanhe entregas e prazos dos clientes" },
  { module: "painel", icon: Rocket, emoji: "🚀", title: "Ver tudo", desc: "Me mostre como o Hub funciona todo" },
];

export function WelcomeChoiceModal({ firstName, onChoose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.82)" }}
    >
      <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center mb-8">
          <img src={hubLogo} alt="Hub Empresarial" className="h-16 w-16 rounded-2xl mb-5 ring-2 ring-primary/30" />
          <h1 className="text-3xl font-bold text-foreground">
            Olá, {firstName} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            O que você quer resolver primeiro na sua operação?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHOICES.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.module}
                onClick={() => onChoose(c.module)}
                className="group text-left p-6 rounded-[14px] border transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.10)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(79,126,255,0.40)";
                  e.currentTarget.style.background = "rgba(79,126,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-3xl leading-none">{c.emoji}</span>
                  <Icon className="h-6 w-6 text-primary/70 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">{c.title}</h3>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.50)" }}>
                  {c.desc}
                </p>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.45)" }}>
          Você pode explorar todas as áreas depois — isso é só o começo.
        </p>
      </div>
    </div>
  );
}
