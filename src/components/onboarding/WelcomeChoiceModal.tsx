import { useState } from "react";
import { DollarSign, Users, FolderKanban, Rocket, Loader2 } from "lucide-react";
import hubLogo from "@/assets/logo.png";
import type { DemoModule } from "@/lib/demo-data";

interface Props {
  firstName: string;
  onChoose: (module: DemoModule, segment: string) => void;
  isLoading?: boolean;
}

const SEGMENTS = [
  { id: "agencia",     emoji: "📣", label: "Agência",      desc: "Marketing, comunicação ou publicidade" },
  { id: "consultoria", emoji: "🧠", label: "Consultoria",  desc: "Serviços estratégicos ou especializados" },
  { id: "freelancer",  emoji: "💻", label: "Freelancer",   desc: "Trabalho autônomo ou serviços avulsos" },
  { id: "pme",         emoji: "🏬", label: "PME / Outro",  desc: "Pequena empresa ou outro tipo de negócio" },
];

const CHOICES: Array<{
  module: DemoModule;
  icon: typeof DollarSign;
  emoji: string;
  title: string;
  desc: string;
}> = [
  { module: "financeiro", icon: DollarSign,   emoji: "💰", title: "Financeiro",    desc: "Controle receitas, despesas e fluxo" },
  { module: "clientes",   icon: Users,        emoji: "👥", title: "Clientes & CRM",desc: "Gerencie sua carteira e pipeline de vendas" },
  { module: "projetos",   icon: FolderKanban, emoji: "📋", title: "Projetos",      desc: "Acompanhe entregas e prazos dos clientes" },
  { module: "painel",     icon: Rocket,       emoji: "🚀", title: "Ver tudo",      desc: "Me mostre como o Hub funciona todo" },
];

function CardButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group text-left p-6 rounded-[14px] border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)" }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = "rgba(79,126,255,0.40)";
          e.currentTarget.style.background = "rgba(79,126,255,0.06)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
      }}
    >
      {children}
    </button>
  );
}

export function WelcomeChoiceModal({ firstName, onChoose, isLoading = false }: Props) {
  const [segment, setSegment] = useState<string | null>(null);

  const subtitle = segment
    ? "O que você quer resolver primeiro na sua operação?"
    : "Como você descreveria sua operação?";

  const footer = segment
    ? "Você pode explorar todas as áreas depois — isso é só o começo."
    : "Isso nos ajuda a personalizar sua experiência no Hub.";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.82)" }}
    >
      <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <img src={hubLogo} alt="Hub Empresarial" className="h-16 w-16 rounded-2xl mb-5 ring-2 ring-primary/30" />
          <h1 className="text-3xl font-bold text-foreground">
            Olá, {firstName} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-2 text-base text-muted-foreground">{subtitle}</p>

          {/* Progress dots */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full transition-colors ${!segment ? "bg-primary" : "bg-primary/40"}`} />
              <span className={`text-xs transition-colors ${!segment ? "text-foreground" : "text-muted-foreground"}`}>
                Perfil
              </span>
            </div>
            <div className="h-px w-8" style={{ background: "rgba(255,255,255,0.15)" }} />
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full transition-colors ${segment ? "bg-primary" : "bg-muted-foreground/30"}`} />
              <span className={`text-xs transition-colors ${segment ? "text-foreground" : "text-muted-foreground"}`}>
                Início
              </span>
            </div>
          </div>
        </div>

        {/* Step 1 — segment */}
        {!segment && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SEGMENTS.map((s) => (
              <CardButton key={s.id} onClick={() => setSegment(s.id)}>
                <span className="text-3xl leading-none mb-3 block">{s.emoji}</span>
                <h3 className="text-base font-semibold text-foreground mb-1">{s.label}</h3>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.50)" }}>{s.desc}</p>
              </CardButton>
            ))}
          </div>
        )}

        {/* Step 2 — module choice */}
        {segment && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CHOICES.map((c) => {
              const Icon = c.icon;
              return (
                <CardButton
                  key={c.module}
                  onClick={() => onChoose(c.module, segment)}
                  disabled={isLoading}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl leading-none">{c.emoji}</span>
                    <Icon className="h-6 w-6 text-primary/70 group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">{c.title}</h3>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.50)" }}>{c.desc}</p>
                </CardButton>
              );
            })}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Preparando seu Hub…</span>
          </div>
        )}

        {!isLoading && (
          <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.45)" }}>
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}
