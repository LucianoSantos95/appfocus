import focusTextLogo from "@/assets/focus-text-logo.png";
import {
  DollarSign,
  Users,
  FolderKanban,
  UserCog,
  Megaphone,
  ListChecks,
  GitBranch,
} from "lucide-react";

const modules = [
  { icon: DollarSign, label: "Finanças" },
  { icon: Users, label: "CRM & Clientes" },
  { icon: FolderKanban, label: "Projetos" },
  { icon: UserCog, label: "Recursos Humanos" },
  { icon: Megaphone, label: "Marketing" },
  { icon: ListChecks, label: "Atividades" },
  { icon: GitBranch, label: "Processos" },
];

interface Props {
  compact?: boolean;
}

export default function AuthBrandingPanel({ compact }: Props) {
  if (compact) {
    return (
      <div className="relative px-6 pt-8 pb-6 text-center overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-primary/5 blur-2xl" />

        <img src={focusTextLogo} alt="Focus" className="h-20 w-auto mx-auto mb-3" />
        <h1 className="text-xl font-bold gradient-text mb-1">
          Gestão Completa para PMEs
        </h1>
        <p className="text-sm text-muted-foreground">
          7 módulos integrados em uma única plataforma
        </p>
      </div>
    );
  }

  return (
    <div className="relative hidden lg:flex w-1/2 flex-col justify-center px-12 xl:px-20 py-16 gradient-dark overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-primary/[0.07] blur-2xl" />

      <div className="relative z-10">
        <img src={focusTextLogo} alt="Focus" className="h-32 w-auto mb-8" />

        <span className="badge-primary inline-block mb-6">Hub Empresarial</span>

        <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight mb-4">
          <span className="gradient-text text-glow">Gestão Completa</span>
          <br />
          <span className="text-foreground">para PMEs</span>
        </h1>

        <p className="text-muted-foreground text-lg mb-10 max-w-md">
          Sistema inteligente com IA integrada para simplificar a administração do seu negócio.
        </p>

        <ul className="space-y-3">
          {modules.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-foreground/80">
              <div className="icon-container w-8 h-8">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium">{label}</span>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-xs text-muted-foreground">
          +4.000 empresas já utilizam o AppFocus
        </p>
      </div>

      {/* Bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </div>
  );
}
