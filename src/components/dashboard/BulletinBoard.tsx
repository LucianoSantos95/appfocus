import { MessageSquare, Pin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Note {
  id: string;
  content: string;
  author: string;
  date: string;
  isPinned?: boolean;
}

const mockNotes: Note[] = [
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
  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-premium">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Mural de Recados</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-4 space-y-3">
        {mockNotes.map((note) => (
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
