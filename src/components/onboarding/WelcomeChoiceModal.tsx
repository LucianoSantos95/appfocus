import { useMemo, useState } from "react";
import { DollarSign, Users, FolderKanban, Rocket, Loader2, ArrowRight } from "lucide-react";
import hubLogo from "@/assets/logo.png";
import type { DemoModule } from "@/lib/demo-data";

interface Props {
  firstName: string;
  onChoose: (module: DemoModule, segment: string, pain: string, userName: string) => void;
  isLoading?: boolean;
}

const SEGMENTS = [
  { id: "agencia",     emoji: "📣", label: "Agência",      desc: "Marketing, comunicação ou publicidade" },
  { id: "consultoria", emoji: "🧠", label: "Consultoria",  desc: "Serviços estratégicos ou especializados" },
  { id: "freelancer",  emoji: "💻", label: "Freelancer",   desc: "Trabalho autônomo ou serviços avulsos" },
  { id: "pme",         emoji: "🏬", label: "PME / Outro",  desc: "Pequena empresa ou outro tipo de negócio" },
];

const PAINS = [
  { id: "planilha",  label: "Perder tempo com planilha" },
  { id: "lucro",     label: "Não sei se dou lucro" },
  { id: "prazo",     label: "Perco prazo com frequência" },
  { id: "pipeline",  label: "Não tenho pipeline organizado" },
  { id: "outro",     label: "Outro" },
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

type Step = "profile" | "module";

function CardButton({
  onClick,
  disabled,
  children,
  selected,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  selected?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group text-left p-7 rounded-[14px] border shadow-lg shadow-black/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
      style={{
        background: selected ? "rgba(79,126,255,0.14)" : "rgba(255,255,255,0.08)",
        borderColor: selected ? "rgba(79,126,255,0.65)" : "rgba(255,255,255,0.18)",
      }}
      onMouseEnter={(e) => {
        if (!disabled && !selected) {
          e.currentTarget.style.borderColor = "rgba(79,126,255,0.55)";
          e.currentTarget.style.background = "rgba(79,126,255,0.10)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
          e.currentTarget.style.background = "rgba(255,255,255,0.08)";
        }
      }}
    >
      {children}
    </button>
  );
}

/** True if a display name looks like it was derived from the email local-part (e.g. "joao.silva"). */
function looksTruncated(name: string): boolean {
  if (!name) return true;
  if (name.length < 2) return true;
  if (/[._@]/.test(name)) return true;
  if (!/[a-zA-Z]/.test(name)) return true;
  return false;
}

export function WelcomeChoiceModal({ firstName, onChoose, isLoading = false }: Props) {
  const [step, setStep] = useState<Step>("profile");
  const [segment, setSegment] = useState<string | null>(null);
  const [pain, setPain] = useState<string | null>(null);
  const initialName = useMemo(() => (looksTruncated(firstName) ? "" : firstName), [firstName]);
  const [name, setName] = useState<string>(initialName);
  const needsNameConfirm = looksTruncated(firstName);

  const canContinueProfile = !!segment && !!pain && name.trim().length >= 2;

  const subtitles: Record<Step, string> = {
    profile: "Vamos personalizar seu Hub em 2 passos.",
    module:  "O que você quer resolver primeiro na sua operação?",
  };

  const footers: Record<Step, string> = {
    profile: "Isso nos ajuda a personalizar sua experiência no Hub.",
    module:  "Você pode explorar todas as áreas depois — isso é só o começo.",
  };

  const dotSteps: Step[] = ["profile", "module"];
  const dotLabels = ["Perfil", "Início"];

  const displayName = name.trim() || firstName;

  const handleContinueProfile = () => {
    if (!canContinueProfile) return;
    setStep("module");
  };

  const handleModuleClick = (module: DemoModule) => {
    if (!segment || !pain) return;
    onChoose(module, segment, pain, name.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.82)" }}
    >
      <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <img src={hubLogo} alt="Hub Empresarial" className="h-16 w-16 rounded-2xl mb-5 ring-2 ring-primary/30" />
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
            Olá, {displayName} 👋
          </h1>
          <p className="mt-3 text-lg" style={{ color: "rgba(255,255,255,0.90)" }}>{subtitles[step]}</p>

          {/* Progress dots */}
          <div className="flex items-center gap-3 mt-4">
            {dotSteps.map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`h-2 w-2 rounded-full transition-colors ${
                      step === s ? "bg-primary" :
                      dotSteps.indexOf(step) > i ? "bg-primary/40" : "bg-muted-foreground/30"
                    }`}
                  />
                  <span
                    className={`text-xs transition-colors ${
                      step === s ? "text-foreground" : "text-foreground/70"
                    }`}
                  >
                    {dotLabels[i]}
                  </span>
                </div>
                {i < dotSteps.length - 1 && (
                  <div className="h-px w-8" style={{ background: "rgba(255,255,255,0.15)" }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1 — profile (segment + pain + optional name confirm) */}
        {step === "profile" && (
          <div className="space-y-5">
            {needsNameConfirm && (
              <div
                className="rounded-[14px] border shadow-lg shadow-black/40 p-5"
                style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.18)" }}
              >
                <label htmlFor="name-input" className="block text-sm font-medium text-white mb-2">
                  Como devemos te chamar?
                </label>
                <input
                  id="name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu primeiro nome"
                  autoFocus
                  className="w-full rounded-[10px] border bg-transparent px-4 py-3 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                  style={{ borderColor: "rgba(255,255,255,0.30)" }}
                />
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-white/80 mb-3 px-1">Como você descreveria sua operação?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SEGMENTS.map((s) => (
                  <CardButton key={s.id} onClick={() => setSegment(s.id)} selected={segment === s.id}>
                    <span className="text-3xl leading-none mb-3 block">{s.emoji}</span>
                    <h3 className="text-lg font-semibold text-white mb-1">{s.label}</h3>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.80)" }}>{s.desc}</p>
                  </CardButton>
                ))}
              </div>
            </div>

            <div
              className={`rounded-[14px] border shadow-lg shadow-black/40 p-5 transition-opacity ${
                segment ? "opacity-100" : "opacity-50 pointer-events-none"
              }`}
              style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.18)" }}
            >
              <label htmlFor="pain-select" className="block text-sm font-medium text-white mb-2">
                Qual sua principal dor hoje?
              </label>
              <select
                id="pain-select"
                value={pain ?? ""}
                onChange={(e) => setPain(e.target.value || null)}
                className="w-full rounded-[10px] border bg-transparent px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                style={{ borderColor: "rgba(255,255,255,0.30)" }}
              >
                <option value="" className="bg-neutral-900">Selecione…</option>
                {PAINS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-neutral-900">{p.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleContinueProfile}
              disabled={!canContinueProfile}
              className="flex items-center justify-center gap-2 w-full rounded-[10px] bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continuar
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 2 — module choice */}
        {step === "module" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CHOICES.map((c) => {
              const Icon = c.icon;
              return (
                <CardButton
                  key={c.module}
                  onClick={() => handleModuleClick(c.module)}
                  disabled={isLoading}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl leading-none">{c.emoji}</span>
                    <Icon className="h-6 w-6 text-primary/70 group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{c.title}</h3>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.80)" }}>{c.desc}</p>
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
          <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.70)" }}>
            {footers[step]}
          </p>
        )}
      </div>
    </div>
  );
}
