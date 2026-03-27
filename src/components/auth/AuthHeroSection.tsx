import { Sparkles } from "lucide-react";

const avatarColors = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
];

interface Props {
  compact?: boolean;
}

export default function AuthHeroSection({ compact }: Props) {
  if (compact) {
    return (
      <div className="px-6 pt-8 pb-4 text-center">
        <span className="badge-primary inline-block mb-3 text-xs">Hub Empresarial</span>
        <h1 className="text-2xl font-extrabold leading-tight mb-2">
          <span className="text-foreground">O sistema de gestão feito para </span>
          <span className="gradient-text text-glow">agências e consultorias</span>
          <span className="text-foreground"> que querem escalar.</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-3">
          Finanças · Projetos · Clientes · RH · Marketing · Processos
        </p>
        <p className="text-sm font-semibold text-primary">
          Grátis para começar. Planos a partir de R$69/mês.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center max-w-3xl mx-auto px-6 pt-12 pb-6">
      {/* Badge */}
      <span className="badge-primary inline-flex items-center gap-1.5 mb-6 text-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        AO VIVO — Hub Empresarial
      </span>

      {/* Headline */}
      <h1 className="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-tight mb-5">
        <span className="text-foreground">O sistema de gestão feito para </span>
        <br className="hidden md:block" />
        <span className="gradient-text text-glow">agências e consultorias</span>
        <br className="hidden md:block" />
        <span className="text-foreground"> que querem escalar.</span>
      </h1>

      {/* Social proof avatars */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <div className="flex -space-x-2">
          {avatarColors.map((color, i) => (
            <div
              key={i}
              className={`w-7 h-7 rounded-full ${color} border-2 border-background flex items-center justify-center text-[10px] font-bold text-white`}
            >
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">43 empresas</span> já utilizam
        </span>
      </div>

      {/* Subtitle */}
      <p className="text-base md:text-lg text-muted-foreground mb-4 max-w-xl mx-auto">
        Finanças · Projetos · Clientes · RH · Marketing · Atividades · Processos — tudo com IA integrada.
      </p>

      {/* Price highlight */}
      <p className="text-base font-semibold text-primary mb-5">
        Grátis para começar. Planos a partir de R$69/mês.
      </p>

      {/* Urgency badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary/90">
        <Sparkles className="w-4 h-4" />
        Primeiros 100 usuários ganham acesso antecipado a recursos premium
      </div>
    </div>
  );
}
