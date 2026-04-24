import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, Building2, Briefcase, User, TrendingUp } from "lucide-react";

interface Props {
  open: boolean;
  onComplete: (segment: string, pain: string) => void;
  onSkip?: () => void;
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

export function OnboardingWelcomeModal({ open, onComplete, onSkip }: Props) {
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
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={step === "segment" ? "default" : "secondary"}>1. Perfil</Badge>
            <Badge variant={step === "pain" ? "default" : "secondary"}>2. Prioridade</Badge>
            <Badge variant="outline">3. Hub pronto</Badge>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-full bg-primary/20 p-3">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Bem-vindo ao Hub Empresarial! 🚀</h2>
              <p className="text-sm text-muted-foreground">
                {step === "segment"
                  ? "Escolha o perfil da sua operação para eu montar um caminho único de configuração."
                  : "Agora escolha sua prioridade para eu te levar ao primeiro resultado mais rápido."}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border/60 bg-card/50 px-4 py-3 mb-5">
            <p className="text-sm font-medium text-foreground">Você vai sair daqui com 3 coisas prontas:</p>
            <div className="mt-2 grid gap-1.5 text-xs text-muted-foreground">
              <span>• um fluxo inicial configurado para o seu perfil</span>
              <span>• seu primeiro dado real lançado no Hub</span>
              <span>• uma visão clara do próximo passo operacional</span>
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

          <div className="mt-4 flex items-center justify-between">
            {step === "pain" ? (
              <Button variant="ghost" size="sm" onClick={() => setStep("segment")}>
                ← Voltar
              </Button>
            ) : <span />}
            {onSkip && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={onSkip}
              >
                Pular por enquanto
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
