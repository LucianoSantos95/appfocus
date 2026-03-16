import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, Link2, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MeetingNotesEditorProps {
  initialContent: string;
  onSave: (content: string) => Promise<void>;
}

export function MeetingNotesEditor({ initialContent, onSave }: MeetingNotesEditorProps) {
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!editorRef.current) return;
    setSaving(true);
    try {
      await onSave(editorRef.current.innerHTML);
      setHasChanges(false);
    } finally {
      setSaving(false);
    }
  }, [onSave]);

  const handleInsertLink = useCallback(() => {
    const url = prompt("Insira o URL:");
    if (url) {
      execCommand("createLink", url);
    }
  }, [execCommand]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Anotações de Reunião</p>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Salvar
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg border border-border/50">
        <button
          onClick={() => execCommand("bold")}
          className="p-1.5 rounded hover:bg-muted transition-colors"
          title="Negrito"
        >
          <Bold className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={() => execCommand("italic")}
          className="p-1.5 rounded hover:bg-muted transition-colors"
          title="Itálico"
        >
          <Italic className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={() => execCommand("insertUnorderedList")}
          className="p-1.5 rounded hover:bg-muted transition-colors"
          title="Lista"
        >
          <List className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={handleInsertLink}
          className="p-1.5 rounded hover:bg-muted transition-colors"
          title="Inserir link"
        >
          <Link2 className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => setHasChanges(true)}
        dangerouslySetInnerHTML={{ __html: initialContent }}
        className={cn(
          "min-h-[150px] max-h-[300px] overflow-y-auto p-3 rounded-lg border border-border/50 bg-muted/20",
          "text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "prose prose-sm prose-invert max-w-none",
          "[&_a]:text-primary [&_a]:underline",
          "[&_ul]:list-disc [&_ul]:pl-5",
          "[&_ol]:list-decimal [&_ol]:pl-5"
        )}
      />

      {hasChanges && (
        <p className="text-xs text-warning">Alterações não salvas</p>
      )}
    </div>
  );
}
