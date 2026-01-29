import { Calendar, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "meeting" | "deadline" | "event";
  priority?: "high" | "medium" | "low";
}

const mockAppointments: Appointment[] = [
  {
    id: "1",
    title: "Reunião com investidores",
    date: "Hoje",
    time: "14:00",
    type: "meeting",
    priority: "high",
  },
  {
    id: "2",
    title: "Prazo: Entrega relatório financeiro",
    date: "Amanhã",
    time: "18:00",
    type: "deadline",
    priority: "high",
  },
  {
    id: "3",
    title: "Call com equipe de marketing",
    date: "28 Jan",
    time: "10:00",
    type: "meeting",
  },
  {
    id: "4",
    title: "Revisão de contratos",
    date: "30 Jan",
    time: "09:00",
    type: "event",
  },
];

const priorityStyles = {
  high: "border-l-destructive",
  medium: "border-l-warning",
  low: "border-l-success",
};

export function AgendaWidget() {
  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-premium">
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Agenda</h3>
      </div>
      <div className="p-4 space-y-3">
        {mockAppointments.map((apt) => (
          <div
            key={apt.id}
            className={cn(
              "p-3 rounded-lg bg-muted/30 border-l-2",
              apt.priority ? priorityStyles[apt.priority] : "border-l-primary"
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{apt.title}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{apt.date}</span>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  <span>{apt.time}</span>
                </div>
              </div>
              {apt.priority === "high" && (
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-border/50">
        <button className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
          Ver agenda completa →
        </button>
      </div>
    </div>
  );
}
