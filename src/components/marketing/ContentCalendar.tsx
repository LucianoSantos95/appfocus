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
import { ChevronLeft, ChevronRight, Plus, GripVertical, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useConteudos, type Conteudo, type ConteudoInput } from "@/hooks/useConteudos";
import { useToast } from "@/hooks/use-toast";
import { CompetitorAnalyzer } from "@/components/marketing/CompetitorAnalyzer";

const statusStyles: Record<string, { bg: string; dot: string; label: string }> = {
  rascunho: { bg: "bg-muted/80 text-muted-foreground", dot: "bg-muted-foreground", label: "Rascunho" },
  agendado: { bg: "bg-primary/15 text-primary", dot: "bg-primary", label: "Agendado" },
  publicado: { bg: "bg-success/15 text-success", dot: "bg-success", label: "Publicado" },
};

const platformColors: Record<string, string> = {
  Instagram: "bg-[hsl(330,70%,50%)]/15 text-[hsl(330,70%,50%)] border-[hsl(330,70%,50%)]/30",
  Facebook: "bg-[hsl(220,70%,50%)]/15 text-[hsl(220,70%,50%)] border-[hsl(220,70%,50%)]/30",
  LinkedIn: "bg-[hsl(210,80%,45%)]/15 text-[hsl(210,80%,45%)] border-[hsl(210,80%,45%)]/30",
  YouTube: "bg-destructive/15 text-destructive border-destructive/30",
  TikTok: "bg-foreground/10 text-foreground border-foreground/20",
  Blog: "bg-success/15 text-success border-success/30",
  Email: "bg-warning/15 text-warning border-warning/30",
  "Twitter/X": "bg-primary/15 text-primary border-primary/30",
};

const platformsList = ["Instagram", "Facebook", "LinkedIn", "YouTube", "TikTok", "Blog", "Email", "Twitter/X"];
const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

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

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);
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
      approval_status: editConteudo.approval_status,
      approval_feedback: editConteudo.approval_feedback,
    });
    setEditConteudo(null);
  };

  const setApproval = async (status: "aprovado" | "recusado" | "pendente") => {
    if (!editConteudo) return;
    setEditConteudo({ ...editConteudo, approval_status: status });
  };

  const handleDrop = async (day: number, e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("conteudo-id");
    if (!id) return;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    await updateConteudo(id, { scheduled_date: dateStr });
    toast({ title: "Conteúdo reagendado" });
  };

  const weekDays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
  const todayDate = new Date();

  return (
    <div className="space-y-4">
      {/* Header - Google Calendar style */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="text-xs">
              Hoje
            </Button>
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))} className="h-8 w-8">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))} className="h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {monthNames[currentMonth]} {currentYear}
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <CompetitorAnalyzer />
            <div className="hidden md:flex items-center gap-4">
              {Object.entries(statusStyles).map(([key, style]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={cn("w-2.5 h-2.5 rounded-full", style.dot)} />
                  <span className="text-muted-foreground">{style.label}</span>
                </div>
              ))}
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
            const dayConteudos = day ? getConteudosForDay(day) : [];
            const isToday = day === todayDate.getDate() && currentMonth === todayDate.getMonth() && currentYear === todayDate.getFullYear();
            const isWeekend = idx % 7 === 0 || idx % 7 === 6;

            return (
              <div
                key={idx}
                className={cn(
                  "min-h-[110px] border-b border-r border-border/20 p-1.5 relative group transition-colors",
                  day && "hover:bg-muted/20",
                  isWeekend && day && "bg-muted/10",
                  !day && "bg-muted/5"
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => day && handleDrop(day, e)}
              >
                {day && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-xs w-6 h-6 flex items-center justify-center rounded-full",
                        isToday
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-foreground"
                      )}>
                        {day}
                      </span>
                      <button
                        onClick={() => handleAddClick(day)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-muted"
                      >
                        <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="space-y-0.5">
                      {dayConteudos.slice(0, 3).map((c) => {
                        const style = statusStyles[c.status] || statusStyles.rascunho;
                        const pColor = platformColors[c.platform || ""] || "bg-muted text-muted-foreground border-border/50";
                        return (
                          <div
                            key={c.id}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData("conteudo-id", c.id)}
                            onClick={() => setEditConteudo(c)}
                            className={cn(
                              "text-[10px] px-2 py-1 rounded-md cursor-pointer truncate flex items-center gap-1 border font-medium",
                              pColor
                            )}
                            title={`${c.title} (${c.platform || "sem plataforma"}) — ${style.label}${c.approval_status ? ` • ${c.approval_status}` : ''}`}
                          >
                            <GripVertical className="w-2.5 h-2.5 flex-shrink-0 opacity-40" />
                            <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", style.dot)} />
                            <span className="truncate">{c.title}</span>
                            {c.approval_status === 'aprovado' && <CheckCircle2 className="w-2.5 h-2.5 text-success flex-shrink-0" />}
                            {c.approval_status === 'recusado' && <XCircle className="w-2.5 h-2.5 text-destructive flex-shrink-0" />}
                            {c.approval_status === 'pendente' && <Clock className="w-2.5 h-2.5 text-warning flex-shrink-0" />}
                          </div>
                        );
                      })}
                      {dayConteudos.length > 3 && (
                        <p className="text-[10px] text-primary cursor-pointer hover:underline text-center font-medium">
                          +{dayConteudos.length - 3} mais
                        </p>
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
                    {platformsList.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
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
                      {platformsList.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
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

              {/* Workflow de aprovação */}
              <div className="space-y-2 rounded-lg border border-border/50 bg-muted/30 p-3">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Aprovação</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn(
                    editConteudo.approval_status === 'aprovado' && 'bg-success/10 text-success border-success/30',
                    editConteudo.approval_status === 'recusado' && 'bg-destructive/10 text-destructive border-destructive/30',
                    (!editConteudo.approval_status || editConteudo.approval_status === 'pendente') && 'bg-warning/10 text-warning border-warning/30',
                  )}>
                    {editConteudo.approval_status === 'aprovado' ? 'Aprovado' : editConteudo.approval_status === 'recusado' ? 'Recusado' : 'Pendente'}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => setApproval('aprovado')} className="h-7 gap-1">
                    <CheckCircle2 className="w-3 h-3 text-success" /> Aprovar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setApproval('recusado')} className="h-7 gap-1">
                    <XCircle className="w-3 h-3 text-destructive" /> Recusar
                  </Button>
                </div>
                <Textarea
                  value={editConteudo.approval_feedback || ""}
                  onChange={(e) => setEditConteudo({ ...editConteudo, approval_feedback: e.target.value })}
                  placeholder="Feedback / observações do revisor"
                  className="bg-muted border-border text-xs min-h-[60px]"
                />
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
