import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Cake, Palmtree, Briefcase } from "lucide-react";
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

export function FeriasAniversariosTimeline({ colaboradores }: FeriasAniversariosTimelineProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const events = useMemo(() => {
    const items: { day: number; name: string; type: "aniversario" | "ferias"; department: string }[] = [];

    colaboradores.forEach((c) => {
      // Company anniversary (start_date month matches current month)
      if (c.start_date) {
        const startDate = new Date(c.start_date);
        if (startDate.getMonth() === currentMonth) {
          items.push({
            day: startDate.getDate(),
            name: c.name,
            type: "aniversario",
            department: c.department || "",
          });
        }
      }

      // On vacation
      if (c.status === "ferias") {
        // Show across all days as a banner
        items.push({
          day: 0, // special: full month
          name: c.name,
          type: "ferias",
          department: c.department || "",
        });
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
    return days;
  }, [firstDayOfWeek, daysInMonth]);

  const getEventsForDay = (day: number) => events.filter((e) => e.day === day);
  const feriasColaboradores = events.filter((e) => e.type === "ferias");

  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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
              <span key={i} className="text-xs bg-warning/10 text-warning px-2 py-1 rounded-full">
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-card rounded-xl border border-border/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="font-semibold text-foreground">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
              {d}
            </div>
          ))}

          {calendarDays.map((day, idx) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();

            return (
              <div
                key={idx}
                className={cn(
                  "min-h-[48px] p-1 rounded-lg text-center relative",
                  day && "hover:bg-muted/30 transition-colors",
                  isToday && "bg-primary/10 border border-primary/30"
                )}
              >
                {day && (
                  <>
                    <span className={cn("text-xs", isToday ? "text-primary font-bold" : "text-foreground")}>{day}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex flex-col items-center gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 2).map((e, i) => (
                          <div key={i} className="flex items-center gap-0.5" title={`${e.name} - Aniversário de empresa`}>
                            <Cake className="w-3 h-3 text-primary" />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Anniversary List */}
      {events.filter((e) => e.type === "aniversario").length > 0 && (
        <div className="bg-card rounded-xl border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Aniversários de empresa neste mês</span>
          </div>
          <div className="space-y-2">
            {events
              .filter((e) => e.type === "aniversario")
              .sort((a, b) => a.day - b.day)
              .map((e, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Cake className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">{e.name}</span>
                    {e.department && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{e.department}</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">Dia {e.day}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
