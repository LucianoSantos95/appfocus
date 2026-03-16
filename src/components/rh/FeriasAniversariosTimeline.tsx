import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Cake, Palmtree } from "lucide-react";
import { cn } from "@/lib/utils";

interface Colaborador {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  department: string | null;
}

interface FeriasAniversariosTimelineProps {
  colaboradores: Colaborador[];
}

const platformColors: Record<string, string> = {
  Tecnologia: "bg-primary/80",
  Marketing: "bg-success/80",
  Projetos: "bg-warning/80",
  Financeiro: "bg-destructive/80",
  RH: "bg-accent-foreground/60",
  Comercial: "bg-primary/60",
};

export function FeriasAniversariosTimeline({ colaboradores }: FeriasAniversariosTimelineProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const events = useMemo(() => {
    const items: { day: number; name: string; type: "aniversario" | "ferias"; department: string }[] = [];
    colaboradores.forEach((c) => {
      if (c.start_date) {
        const startDate = new Date(c.start_date);
        if (startDate.getMonth() === currentMonth) {
          items.push({ day: startDate.getDate(), name: c.name, type: "aniversario", department: c.department || "" });
        }
      }
      if (c.status === "ferias") {
        items.push({ day: 0, name: c.name, type: "ferias", department: c.department || "" });
      }
    });
    return items;
  }, [colaboradores, currentMonth]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    // Fill trailing nulls to complete the grid
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [firstDayOfWeek, daysInMonth]);

  const getEventsForDay = (day: number) => events.filter((e) => e.day === day);
  const feriasColaboradores = events.filter((e) => e.type === "ferias");

  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  const weekDays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
  const today = new Date();

  return (
    <div className="space-y-4">
      {/* Vacation Banner */}
      {feriasColaboradores.length > 0 && (
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Palmtree className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium text-foreground">Em férias neste mês</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {feriasColaboradores.map((c, i) => (
              <span key={i} className="text-xs bg-warning/10 text-warning px-3 py-1.5 rounded-full font-medium">
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Google Calendar Style */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="text-xs">
              Hoje
            </Button>
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {monthNames[currentMonth]} {currentYear}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <Cake className="w-3.5 h-3.5 text-primary" />
              <span className="text-muted-foreground">Aniversário de empresa</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Palmtree className="w-3.5 h-3.5 text-warning" />
              <span className="text-muted-foreground">Em férias</span>
            </div>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border/30">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-2.5 tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const isWeekend = idx % 7 === 0 || idx % 7 === 6;

            return (
              <div
                key={idx}
                className={cn(
                  "min-h-[100px] border-b border-r border-border/20 p-1.5 transition-colors",
                  day && "hover:bg-muted/30",
                  isWeekend && day && "bg-muted/10",
                  !day && "bg-muted/5"
                )}
              >
                {day && (
                  <>
                    <div className="flex justify-end mb-1">
                      <span className={cn(
                        "text-xs w-6 h-6 flex items-center justify-center rounded-full",
                        isToday 
                          ? "bg-primary text-primary-foreground font-bold" 
                          : "text-foreground"
                      )}>
                        {day}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.map((e, i) => (
                        <div
                          key={i}
                          className={cn(
                            "text-[10px] px-2 py-1 rounded-md text-primary-foreground font-medium truncate",
                            platformColors[e.department] || "bg-primary/70"
                          )}
                          title={`${e.name} - Aniversário de empresa${e.department ? ` (${e.department})` : ""}`}
                        >
                          <span className="flex items-center gap-1">
                            <Cake className="w-2.5 h-2.5 flex-shrink-0" />
                            {e.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Anniversary List */}
      {events.filter((e) => e.type === "aniversario").length > 0 && (
        <div className="bg-card rounded-xl border border-border/50 p-5">
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Cake className="w-4 h-4 text-primary" />
            Aniversários de empresa — {monthNames[currentMonth]}
          </h4>
          <div className="space-y-2">
            {events
              .filter((e) => e.type === "aniversario")
              .sort((a, b) => a.day - b.day)
              .map((e, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-1 h-8 rounded-full", platformColors[e.department] || "bg-primary/70")} />
                    <div>
                      <span className="text-sm font-medium text-foreground">{e.name}</span>
                      {e.department && (
                        <p className="text-xs text-muted-foreground">{e.department}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{e.day} de {monthNames[currentMonth].toLowerCase()}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
