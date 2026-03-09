import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Pin, Plus, Trash2, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Note {
  id: string;
  content: string;
  author: string;
  date: string;
  isPinned?: boolean;
}

const sb = supabase as any;

export function BulletinBoard() {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({ content: "", author: "", isPinned: false });

  const fetchNotes = useCallback(async () => {
    try {
      const { data, error } = await sb
        .from("bulletin_notes")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setNotes(
        (data || []).map((d: any) => ({
          id: d.id,
          content: d.content,
          author: d.author,
          date: new Date(d.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
          isPinned: d.is_pinned,
        }))
      );
    } catch (err) {
      console.error("Error fetching bulletin:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleAdd = async () => {
    if (!newNote.content || !newNote.author) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await sb.from("bulletin_notes").insert({
        user_id: user.id,
        content: newNote.content,
        author: newNote.author,
        is_pinned: newNote.isPinned,
      });
      if (error) throw error;
      setNewNote({ content: "", author: "", isPinned: false });
      setOpen(false);
      fetchNotes();
      toast({ title: "Recado publicado!" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!editingNote) return;
    try {
      const { error } = await sb
        .from("bulletin_notes")
        .update({
          content: editingNote.content,
          author: editingNote.author,
          is_pinned: editingNote.isPinned,
        })
        .eq("id", editingNote.id);
      if (error) throw error;
      setEditingNote(null);
      fetchNotes();
    } catch (err: any) {
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await sb.from("bulletin_notes").delete().eq("id", id);
      if (error) throw error;
      setEditingNote(null);
      fetchNotes();
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-premium">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Mural de Recados</h3>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Recado
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Novo Recado</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="author">Autor</Label>
                <Input
                  id="author"
                  value={newNote.author}
                  onChange={(e) => setNewNote({ ...newNote, author: e.target.value })}
                  placeholder="Ex: RH, Financeiro, Admin"
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Mensagem</Label>
                <Textarea
                  id="content"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Digite o recado..."
                  className="bg-muted border-border min-h-[100px]"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pinned"
                  checked={newNote.isPinned}
                  onCheckedChange={(checked) => setNewNote({ ...newNote, isPinned: checked === true })}
                />
                <Label htmlFor="pinned" className="text-sm font-normal cursor-pointer">
                  Fixar no topo do mural
                </Label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleAdd}>Publicar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum recado no mural</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              onClick={() => setEditingNote(note)}
              className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-2">
                {note.isPinned && <Pin className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />}
                <div className="flex-1">
                  <p className="text-sm text-foreground">{note.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span className="font-medium">{note.author}</span>
                    <span>•</span>
                    <span>{note.date}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Recado</DialogTitle>
          </DialogHeader>
          {editingNote && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Autor</Label>
                <Input
                  value={editingNote.author}
                  onChange={(e) => setEditingNote({ ...editingNote, author: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  value={editingNote.content}
                  onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                  className="bg-muted border-border min-h-[100px]"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-pinned"
                  checked={editingNote.isPinned || false}
                  onCheckedChange={(checked) => setEditingNote({ ...editingNote, isPinned: checked === true })}
                />
                <Label htmlFor="edit-pinned" className="text-sm font-normal cursor-pointer">
                  Fixar no topo do mural
                </Label>
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="destructive" onClick={() => editingNote && handleDelete(editingNote.id)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setEditingNote(null)}>Cancelar</Button>
              <Button onClick={handleUpdate}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
