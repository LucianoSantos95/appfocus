import { BookOpen, Video, Headphones, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const helpItems = [
  {
    icon: BookOpen,
    title: "Guia Completo",
    description: "Aprenda a usar todos os recursos",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Video,
    title: "Tutoriais em Vídeo",
    description: "Veja como configurar na prática",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    icon: Headphones,
    title: "Suporte",
    description: "Fale com nossa equipe",
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    icon: FileText,
    title: "Templates",
    description: "Modelos prontos para começar",
    color: "text-accent",
    bg: "bg-accent/10",
  },
];

export function HelpSection() {
  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-premium">
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold text-foreground">Como posso te ajudar?</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Recursos para acelerar sua gestão
        </p>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        {helpItems.map((item, index) => (
          <button
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left"
          >
            <div className={cn("p-2 rounded-lg", item.bg)}>
              <item.icon className={cn("w-4 h-4", item.color)} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
