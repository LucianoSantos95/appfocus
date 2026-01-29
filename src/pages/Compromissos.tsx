import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  Plus,
  ArrowLeft,
  List,
  Clock,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Compromisso {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  status: "nao_iniciado" | "em_andamento" | "concluido";
  responsibles: string[];
  type: "reuniao" | "prazo" | "evento";
}

const mockCompromissos: Compromisso[] = [
  {
    id: "1",
    title: "Reunião com investidores",
    startDate: new Date(2025, 0, 29, 14, 0),
    endDate: new Date(2025, 0, 29, 16, 0),
    status: "nao_iniciado",
    responsibles: ["Ana Silva", "Carlos Diretor"],
    type: "reuniao",
  },
  {
    id: "2",
    title: "Entrega relatório financeiro",
    startDate: new Date(2025, 0, 30, 9, 0),
    endDate: new Date(2025, 0, 30, 18, 0),
    status: "em_andamento",
    responsibles: ["Diego Santos"],
    type: "prazo",
  },
  {
    id: "3",
    title: "Apresentação trimestral",
    startDate: new Date(2025, 0, 31, 10, 0),
    endDate: new Date(2025, 0, 31, 12, 0),
    status: "nao_iniciado",
    responsibles: ["Ana Silva", "Bruno Costa", "Carla Oliveira"],
    type: "evento",
  },
  {
    id: "4",
    title: "Sprint Review",
    startDate: new Date(2025, 1, 3, 15, 0),
    endDate: new Date(2025, 1, 3, 17, 0),
    status: "nao_iniciado",
    responsibles: ["Bruno Costa"],
    type: "reuniao",
  },
];

const statusStyles = {
  nao_iniciado: { label: "Não Iniciado", class: "bg-muted text-muted-foreground" },
  em_andamento: { label: "Em Andamento", class: "bg-primary/10 text-primary" },
  concluido: { label: "Concluído", class: "bg-success/10 text-success" },
};

const typeStyles = {
  reuniao: { label: "Reunião", class: "border-l-primary" },
  prazo: { label: "Prazo", class: "border-l-destructive" },
  evento: { label: "Evento", class: "border-l-success" },
};

export default function Compromissos() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<"calendar" | "list" | "timeline">("calendar");

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getCompromissosByDate = (date: Date) =>
    mockCompromissos.filter((c) => isSameDay(c.startDate, date));

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="h-9 w-9"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Compromissos</h1>
              <p className="text-muted-foreground mt-1">
                Gerencie prazos e datas importantes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                variant={view === "calendar" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("calendar")}
              >
                <CalendarIcon className="w-4 h-4" />
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("list")}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={view === "timeline" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("timeline")}
              >
                <Clock className="w-4 h-4" />
              </Button>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Compromisso
            </Button>
          </div>
        </div>

        {/* Calendar View */}
        {view === "calendar" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Mini Calendar */}
            <div className="bg-card rounded-xl border border-border/50 shadow-premium p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ptBR}
                className="pointer-events-auto"
              />
            </div>

            {/* Week View */}
            <div className="lg:col-span-3 bg-card rounded-xl border border-border/50 shadow-premium overflow-hidden">
              <div className="p-4 border-b border-border/50">
                <h3 className="font-semibold text-foreground">
                  Semana de {format(weekStart, "d 'de' MMMM", { locale: ptBR })}
                </h3>
              </div>
              <div className="grid grid-cols-7 divide-x divide-border/50">
                {weekDays.map((day) => {
                  const compromissos = getCompromissosByDate(day);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div key={day.toISOString()} className="min-h-[200px]">
                      <div
                        className={cn(
                          "p-3 text-center border-b border-border/50",
                          isToday && "bg-primary/5"
                        )}
                      >
                        <p className="text-xs text-muted-foreground uppercase">
                          {format(day, "EEE", { locale: ptBR })}
                        </p>
                        <p
                          className={cn(
                            "text-lg font-semibold mt-1",
                            isToday ? "text-primary" : "text-foreground"
                          )}
                        >
                          {format(day, "d")}
                        </p>
                      </div>
                      <div className="p-2 space-y-2">
                        {compromissos.map((c) => (
                          <div
                            key={c.id}
                            className={cn(
                              "p-2 rounded-lg bg-muted/50 border-l-2 cursor-pointer hover:bg-muted transition-colors",
                              typeStyles[c.type].class
                            )}
                          >
                            <p className="text-xs font-medium text-foreground truncate">
                              {c.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(c.startDate, "HH:mm")}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* List View */}
        {view === "list" && (
          <div className="bg-card rounded-xl border border-border/50 shadow-premium">
            <div className="divide-y divide-border/50">
              {mockCompromissos.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "p-4 flex items-center justify-between hover:bg-muted/30 transition-colors border-l-4",
                    typeStyles[c.type].class
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-foreground">{c.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>
                          {format(c.startDate, "d MMM, HH:mm", { locale: ptBR })}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {c.responsibles.length}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2 py-1 rounded-full font-medium",
                      statusStyles[c.status].class
                    )}
                  >
                    {statusStyles[c.status].label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline View */}
        {view === "timeline" && (
          <div className="bg-card rounded-xl border border-border/50 shadow-premium p-6">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              <div className="space-y-6">
                {mockCompromissos.map((c, i) => (
                  <div key={c.id} className="relative pl-10">
                    <div
                      className={cn(
                        "absolute left-2.5 w-3 h-3 rounded-full border-2 bg-background",
                        c.status === "concluido"
                          ? "border-success"
                          : c.status === "em_andamento"
                          ? "border-primary"
                          : "border-muted-foreground"
                      )}
                    />
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {format(c.startDate, "d 'de' MMMM, HH:mm", { locale: ptBR })}
                        </span>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded font-medium",
                            statusStyles[c.status].class
                          )}
                        >
                          {statusStyles[c.status].label}
                        </span>
                      </div>
                      <p className="font-medium text-foreground">{c.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {c.responsibles.slice(0, 3).map((r) => (
                          <span
                            key={r}
                            className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
