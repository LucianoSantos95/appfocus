import { useState } from "react";
import { DollarSign, Users, FolderKanban, Rocket, Loader2, ArrowRight } from "lucide-react";
import hubLogo from "@/assets/logo.png";
import type { DemoModule } from "@/lib/demo-data";

interface Props {
  firstName: string;
  onChoose: (module: DemoModule, segment: string, phone: string | null) => void;
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

type Step = "segment" | "phone" | "module";

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
  const [step, setStep] = useState<Step>("segment");
  const [segment, setSegment] = useState<string | null>(null);
  const [phone, setPhone] = useState("");

  const subtitles: Record<Step, string> = {
    segment: "Como você descreveria sua operação?",
    phone:   "Quer receber alertas do Hub pelo WhatsApp?",
    module:  "O que você quer resolver primeiro na sua operação?",
  };

  const footers: Record<Step, string> = {
    segment: "Isso nos ajuda a personalizar sua experiência no Hub.",
    phone:   "Só enviamos avisos úteis do seu negócio. Sem spam.",
    module:  "Você pode explorar todas as áreas depois — isso é só o começo.",
  };

  const dotSteps: Step[] = ["segment", "phone", "module"];
  const dotLabels = ["Perfil", "Contato", "Início"];

  const handleSegmentClick = (id: string) => {
    setSegment(id);
    setStep("phone");
  };

  const handlePhoneContinue = (skipPhone = false) => {
    setStep("module");
    if (skipPhone) setPhone("");
  };

  const handleModuleClick = (module: DemoModule) => {
    if (!segment) return;
    const trimmedPhone = phone.replace(/\D/g, "");
    onChoose(module, segment, trimmedPhone.length >= 10 ? trimmedPhone : null);
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
            {step === "phone" ? `Quase lá, ${firstName}!` : `Olá, ${firstName} 👋`}
          </h1>
          <p className="mt-3 text-lg" style={{ color: "rgba(255,255,255,0.75)" }}>{subtitles[step]}</p>

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
                      step === s ? "text-foreground" : "text-muted-foreground"
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

        {/* Step 1 — segment */}
        {step === "segment" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SEGMENTS.map((s) => (
              <CardButton key={s.id} onClick={() => handleSegmentClick(s.id)}>
                <span className="text-3xl leading-none mb-3 block">{s.emoji}</span>
                <h3 className="text-base font-semibold text-white mb-1">{s.label}</h3>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{s.desc}</p>
              </CardButton>
            ))}
          </div>
        )}

        {/* Step 1.5 — phone */}
        {step === "phone" && (
          <div
            className="rounded-[14px] border p-8 flex flex-col gap-5"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)" }}
          >
            <div className="text-4xl text-center">📱</div>
            <div>
              <label
                htmlFor="phone-input"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Número do WhatsApp
              </label>
              <input
                id="phone-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePhoneContinue()}
                placeholder="(11) 99999-9999"
                autoFocus
                className="w-full rounded-[10px] border bg-transparent px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                style={{ borderColor: "rgba(255,255,255,0.15)" }}
              />
            </div>
            <button
              onClick={() => handlePhoneContinue()}
              className="flex items-center justify-center gap-2 w-full rounded-[10px] bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 transition"
            >
              Continuar
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePhoneContinue(true)}
              className="text-xs text-center transition"
              style={{ color: "rgba(255,255,255,0.40)" }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "rgba(255,255,255,0.65)"; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "rgba(255,255,255,0.40)"; }}
            >
              Pular esta etapa →
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
                  <h3 className="text-base font-semibold text-white mb-1">{c.title}</h3>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{c.desc}</p>
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
            {footers[step]}
          </p>
        )}
      </div>
    </div>
  );
}
