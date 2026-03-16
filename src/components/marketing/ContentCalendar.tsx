import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Plus, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConteudos, type Conteudo, type ConteudoInput } from "@/hooks/useConteudos";
import { useToast } from "@/hooks/use-toast";

const statusStyles: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  agendado: "bg-primary/10 text-primary",
  publicado: "bg-success/10 text-success",
};

const statusLabels: Record<string, string> = {
  rascunho: "Rascunho",
  agendado: "Agendado",
  publicado: "Publicado",
};

const platforms = ["Instagram", "Facebook", "LinkedIn", "YouTube", "TikTok", "Blog", "Email", "Twitter/X"];

export function ContentCalendar() {
  const { conteudos, addConteudo, updateConteudo, deleteConteudo } = useConteudos();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editConteudo, setEditConteudo] = useState<Conteudo | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [form, setForm] = useState<ConteudoInput>({ title: "", platform: "", scheduled_date: "", status: "rascunho", description: "" });

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [firstDayOfWeek, daysInMonth]);

  const getConteudosForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return conteudos.filter((c) => c.scheduled_date === dateStr);
  };

  const handleAddClick = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    setForm({ title: "", platform: "", scheduled_date: dateStr, status: "rascunho", description: "" });
    setAddDialogOpen(true);
  };

  const handleSubmitAdd = async () => {
    if (!form.title) return;
    await addConteudo({ ...form, scheduled_date: selectedDate || form.scheduled_date });
    setAddDialogOpen(false);
    setForm({ title: "", platform: "", scheduled_date: "", status: "rascunho", description: "" });
  };

  const handleSaveEdit = async () => {
    if (!editConteudo) return;
    await updateConteudo(editConteudo.id, {
      title: editConteudo.title,
      platform: editConteudo.platform,
      scheduled_date: editConteudo.scheduled_date,
      status: editConteudo.status,
      description: editConteudo.description,
    });
    setEditConteudo(null);
  };

  const handleDrop = async (day: number, e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("conteudo-id");
    if (!id) return;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    await updateConteudo(id, { scheduled_date: dateStr });
    toast({ title: "Conteúdo reagendado" });
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))} className="h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="font-semibold text-foreground min-w-[200px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))} className="h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-3 text-xs">
          {Object.entries(statusLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={cn("w-2.5 h-2.5 rounded-full", statusStyles[key])} />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-border/50 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/30">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2 border-b border-border/50">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dayConteudos = day ? getConteudosForDay(day) : [];
            const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();

            return (
              <div
                key={idx}
                className={cn(
                  "min-h-[90px] p-1.5 border-b border-r border-border/30 relative group",
                  day && "hover:bg-muted/20 transition-colors",
                  isToday && "bg-primary/5"
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => day && handleDrop(day, e)}
              >
                {day && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xs", isToday ? "text-primary font-bold" : "text-muted-foreground")}>{day}</span>
                      <button
                        onClick={() => handleAddClick(day)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
                      >
                        <Plus className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="space-y-0.5 mt-0.5">
                      {dayConteudos.slice(0, 3).map((c) => (
                        <div
                          key={c.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData("conteudo-id", c.id)}
                          onClick={() => setEditConteudo(c)}
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded cursor-pointer truncate flex items-center gap-0.5",
                            statusStyles[c.status] || statusStyles.rascunho
                          )}
                          title={c.title}
                        >
                          <GripVertical className="w-2.5 h-2.5 flex-shrink-0 opacity-50" />
                          {c.title}
                        </div>
                      ))}
                      {dayConteudos.length > 3 && (
                        <p className="text-[10px] text-muted-foreground text-center">+{dayConteudos.length - 3}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Novo Conteúdo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título do conteúdo" className="bg-muted border-border" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="publicado">Publicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-muted border-border" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmitAdd}>Adicionar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editConteudo} onOpenChange={() => setEditConteudo(null)}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Conteúdo</DialogTitle>
          </DialogHeader>
          {editConteudo && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={editConteudo.title} onChange={(e) => setEditConteudo({ ...editConteudo, title: e.target.value })} className="bg-muted border-border" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plataforma</Label>
                  <Select value={editConteudo.platform || ""} onValueChange={(v) => setEditConteudo({ ...editConteudo, platform: v })}>
                    <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editConteudo.status} onValueChange={(v) => setEditConteudo({ ...editConteudo, status: v })}>
                    <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="agendado">Agendado</SelectItem>
                      <SelectItem value="publicado">Publicado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={editConteudo.scheduled_date || ""} onChange={(e) => setEditConteudo({ ...editConteudo, scheduled_date: e.target.value })} className="bg-muted border-border" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={editConteudo.description || ""} onChange={(e) => setEditConteudo({ ...editConteudo, description: e.target.value })} className="bg-muted border-border" />
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="destructive" onClick={() => { if (editConteudo) { deleteConteudo(editConteudo.id); setEditConteudo(null); } }}>Excluir</Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setEditConteudo(null)}>Cancelar</Button>
              <Button onClick={handleSaveEdit}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
