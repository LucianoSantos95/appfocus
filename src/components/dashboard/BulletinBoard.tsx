import { useState } from "react";
import { MessageSquare, Pin, Plus } from "lucide-react";
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

interface Note {
  id: string;
  content: string;
  author: string;
  date: string;
  isPinned?: boolean;
}

const initialNotes: Note[] = [
  {
    id: "1",
    content: "Lembrete: Atualizar dados bancários até sexta-feira.",
    author: "Admin",
    date: "Hoje, 10:30",
    isPinned: true,
  },
  {
    id: "2",
    content: "Nova política de home office aprovada. Confira as diretrizes no RH.",
    author: "RH",
    date: "Ontem, 15:45",
  },
  {
    id: "3",
    content: "Resultados do mês disponíveis no módulo Finanças.",
    author: "Financeiro",
    date: "26 Jan",
  },
];

export function BulletinBoard() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [open, setOpen] = useState(false);
  const [newNote, setNewNote] = useState({
    content: "",
    author: "",
    isPinned: false,
  });

  const handleAddNote = () => {
    if (!newNote.content || !newNote.author) return;

    const note: Note = {
      id: Date.now().toString(),
      content: newNote.content,
      author: newNote.author,
      date: new Date().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      isPinned: newNote.isPinned,
    };

    // Adiciona notas fixadas no topo
    if (note.isPinned) {
      setNotes([note, ...notes]);
    } else {
      const pinnedNotes = notes.filter((n) => n.isPinned);
      const unpinnedNotes = notes.filter((n) => !n.isPinned);
      setNotes([...pinnedNotes, note, ...unpinnedNotes]);
    }

    setNewNote({ content: "", author: "", isPinned: false });
    setOpen(false);
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
                  onCheckedChange={(checked) =>
                    setNewNote({ ...newNote, isPinned: checked === true })
                  }
                />
                <Label htmlFor="pinned" className="text-sm font-normal cursor-pointer">
                  Fixar no topo do mural
                </Label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddNote}>Publicar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {notes.map((note) => (
          <div
            key={note.id}
            className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start gap-2">
              {note.isPinned && (
                <Pin className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
              )}
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
        ))}
      </div>
    </div>
  );
}
