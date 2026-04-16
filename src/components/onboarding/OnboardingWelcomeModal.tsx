import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, Building2, Briefcase, User, TrendingUp } from "lucide-react";

interface Props {
  open: boolean;
  onComplete: (segment: string, pain: string) => void;
}

const segments = [
  { id: "agencia", label: "Agência", icon: Building2, desc: "Gestão de entregas e equipe criativa" },
  { id: "consultoria", label: "Consultoria", icon: Briefcase, desc: "Projetos e relacionamento com clientes" },
  { id: "freelancer", label: "Freelancer", icon: User, desc: "Organização pessoal e finanças" },
  { id: "pme", label: "PME / Outro", icon: TrendingUp, desc: "Gestão geral da operação" },
];

const pains = [
  { id: "financas", label: "Finanças", desc: "Controlar receitas e despesas" },
  { id: "clientes", label: "Clientes", desc: "Organizar carteira e prospecção" },
  { id: "projetos", label: "Projetos", desc: "Acompanhar entregas e prazos" },
  { id: "tarefas", label: "Atividades", desc: "Gerenciar tarefas do dia a dia" },
];

export function OnboardingWelcomeModal({ open, onComplete }: Props) {
  const [step, setStep] = useState<"segment" | "pain">("segment");
  const [selectedSegment, setSelectedSegment] = useState("");

  const handleSegment = (id: string) => {
    setSelectedSegment(id);
    setStep("pain");
  };

  const handlePain = (id: string) => {
    onComplete(selectedSegment, id);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-border/50 [&>button]:hidden">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-full bg-primary/20 p-3">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Bem-vindo ao Hub Empresarial! 🚀</h2>
              <p className="text-sm text-muted-foreground">
                {step === "segment"
                  ? "Qual o perfil da sua operação?"
                  : "Qual é sua maior necessidade hoje?"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {step === "segment"
              ? segments.map((s) => (
                  <Button
                    key={s.id}
                    variant="outline"
                    className="h-auto flex-col gap-2 p-4 hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={() => handleSegment(s.id)}
                  >
                    <s.icon className="h-6 w-6 text-primary" />
                    <span className="font-semibold text-sm">{s.label}</span>
                    <span className="text-xs text-muted-foreground text-center">{s.desc}</span>
                  </Button>
                ))
              : pains.map((p) => (
                  <Button
                    key={p.id}
                    variant="outline"
                    className="h-auto flex-col gap-2 p-4 hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={() => handlePain(p.id)}
                  >
                    <span className="font-semibold text-sm">{p.label}</span>
                    <span className="text-xs text-muted-foreground text-center">{p.desc}</span>
                  </Button>
                ))}
          </div>

          {step === "pain" && (
            <Button variant="ghost" size="sm" className="mt-4" onClick={() => setStep("segment")}>
              ← Voltar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
