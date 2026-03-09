import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, AlertCircle, Plus, Loader2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AgendaItem {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "meeting" | "deadline" | "event";
  priority?: "high" | "medium" | "low";
}

const priorityStyles = {
  high: "border-l-destructive",
  medium: "border-l-warning",
  low: "border-l-success",
};

const sb = supabase as any;

export function AgendaWidget() {
  const { toast } = useToast();
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);
  const [newItem, setNewItem] = useState({
    title: "",
    date: "",
    time: "",
    type: "meeting" as "meeting" | "deadline" | "event",
    priority: "medium" as "high" | "medium" | "low",
  });

  const fetchItems = useCallback(async () => {
    try {
      const { data, error } = await sb
        .from("agenda_items")
        .select("*")
        .order("date", { ascending: true });
      if (error) throw error;
      setItems(
        (data || []).map((d: any) => ({
          id: d.id,
          title: d.title,
          date: new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
          time: d.time?.substring(0, 5) || "",
          type: d.type as AgendaItem["type"],
          priority: d.priority as AgendaItem["priority"],
          _rawDate: d.date,
        }))
      );
    } catch (err) {
      console.error("Error fetching agenda:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAdd = async () => {
    if (!newItem.title || !newItem.date || !newItem.time) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await sb.from("agenda_items").insert({
        user_id: user.id,
        title: newItem.title,
        date: newItem.date,
        time: newItem.time,
        type: newItem.type,
        priority: newItem.priority,
      });
      if (error) throw error;
      setNewItem({ title: "", date: "", time: "", type: "meeting", priority: "medium" });
      setOpen(false);
      fetchItems();
      toast({ title: "Compromisso adicionado!" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    try {
      const { error } = await sb
        .from("agenda_items")
        .update({
          title: editingItem.title,
          time: editingItem.time,
          type: editingItem.type,
          priority: editingItem.priority,
        })
        .eq("id", editingItem.id);
      if (error) throw error;
      setEditingItem(null);
      fetchItems();
    } catch (err: any) {
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await sb.from("agenda_items").delete().eq("id", id);
      if (error) throw error;
      setEditingItem(null);
      fetchItems();
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    }
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
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
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
                    value={newItem.date}
                    onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
                    className="bg-muted border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Horário</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newItem.time}
                    onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                    className="bg-muted border-border"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={newItem.type}
                    onValueChange={(value: "meeting" | "deadline" | "event") =>
                      setNewItem({ ...newItem, type: value })
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
                    value={newItem.priority}
                    onValueChange={(value: "high" | "medium" | "low") =>
                      setNewItem({ ...newItem, priority: value })
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
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleAdd}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum compromisso agendado</p>
          </div>
        ) : (
          items.map((apt) => (
            <div
              key={apt.id}
              onClick={() => setEditingItem(apt)}
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
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Compromisso</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={editingItem.time}
                    onChange={(e) => setEditingItem({ ...editingItem, time: e.target.value })}
                    className="bg-muted border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={editingItem.type}
                    onValueChange={(value: "meeting" | "deadline" | "event") =>
                      setEditingItem({ ...editingItem, type: value })
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
                  value={editingItem.priority || "medium"}
                  onValueChange={(value: "high" | "medium" | "low") =>
                    setEditingItem({ ...editingItem, priority: value })
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
            <Button variant="destructive" onClick={() => editingItem && handleDelete(editingItem.id)}>
              Excluir
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setEditingItem(null)}>Cancelar</Button>
              <Button onClick={handleUpdate}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
