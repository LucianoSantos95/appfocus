import { useState } from "react";
import { Calendar, Clock, AlertCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "meeting" | "deadline" | "event";
  priority?: "high" | "medium" | "low";
}

const initialAppointments: Appointment[] = [
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
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [open, setOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [newAppointment, setNewAppointment] = useState<{
    title: string;
    date: string;
    time: string;
    type: "meeting" | "deadline" | "event";
    priority: "high" | "medium" | "low";
  }>({
    title: "",
    date: "",
    time: "",
    type: "meeting",
    priority: "medium",
  });

  const handleAddAppointment = () => {
    if (!newAppointment.title || !newAppointment.date || !newAppointment.time) return;
    
    const appointment: Appointment = {
      id: Date.now().toString(),
      title: newAppointment.title,
      date: new Date(newAppointment.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      time: newAppointment.time,
      type: newAppointment.type,
      priority: newAppointment.priority,
    };
    
    setAppointments([appointment, ...appointments]);
    setNewAppointment({ title: "", date: "", time: "", type: "meeting", priority: "medium" });
    setOpen(false);
  };

  const handleUpdateAppointment = () => {
    if (!editingAppointment) return;
    setAppointments(appointments.map((apt) => 
      apt.id === editingAppointment.id ? editingAppointment : apt
    ));
    setEditingAppointment(null);
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments(appointments.filter((apt) => apt.id !== id));
    setEditingAppointment(null);
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-premium">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Agenda</h3>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Compromisso
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Novo Compromisso</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={newAppointment.title}
                  onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                  placeholder="Ex: Reunião com cliente"
                  className="bg-muted border-border"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                    className="bg-muted border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Horário</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                    className="bg-muted border-border"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={newAppointment.type}
                    onValueChange={(value: "meeting" | "deadline" | "event") =>
                      setNewAppointment({ ...newAppointment, type: value })
                    }
                  >
                    <SelectTrigger className="bg-muted border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="meeting">Reunião</SelectItem>
                      <SelectItem value="deadline">Prazo</SelectItem>
                      <SelectItem value="event">Evento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={newAppointment.priority}
                    onValueChange={(value: "high" | "medium" | "low") =>
                      setNewAppointment({ ...newAppointment, priority: value })
                    }
                  >
                    <SelectTrigger className="bg-muted border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddAppointment}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {appointments.map((apt) => (
          <div
            key={apt.id}
            onClick={() => setEditingAppointment(apt)}
            className={cn(
              "p-3 rounded-lg bg-muted/30 border-l-2 cursor-pointer hover:bg-muted/50 transition-colors",
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

      {/* Edit Appointment Dialog */}
      <Dialog open={!!editingAppointment} onOpenChange={() => setEditingAppointment(null)}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Compromisso</DialogTitle>
          </DialogHeader>
          {editingAppointment && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={editingAppointment.title}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, title: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={editingAppointment.time}
                    onChange={(e) => setEditingAppointment({ ...editingAppointment, time: e.target.value })}
                    className="bg-muted border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={editingAppointment.type}
                    onValueChange={(value: "meeting" | "deadline" | "event") =>
                      setEditingAppointment({ ...editingAppointment, type: value })
                    }
                  >
                    <SelectTrigger className="bg-muted border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="meeting">Reunião</SelectItem>
                      <SelectItem value="deadline">Prazo</SelectItem>
                      <SelectItem value="event">Evento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={editingAppointment.priority || "medium"}
                  onValueChange={(value: "high" | "medium" | "low") =>
                    setEditingAppointment({ ...editingAppointment, priority: value })
                  }
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="destructive" onClick={() => editingAppointment && handleDeleteAppointment(editingAppointment.id)}>
              Excluir
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setEditingAppointment(null)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateAppointment}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
