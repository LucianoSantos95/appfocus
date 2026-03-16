import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, Loader2, Download } from "lucide-react";

interface DocumentItem {
  name: string;
  url: string;
  uploaded_at: string;
}

interface DocumentUploadProps {
  colaboradorId: string;
  documents: DocumentItem[];
  onDocumentsChange: (docs: DocumentItem[]) => void;
}

export function DocumentUpload({ colaboradorId, documents, onDocumentsChange }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Formato não suportado", description: "Aceitos: PDF, JPG, PNG, WebP", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo de 10MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${colaboradorId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("colaborador-docs")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("colaborador-docs")
        .getPublicUrl(path);

      const newDoc: DocumentItem = {
        name: file.name,
        url: publicUrl,
        uploaded_at: new Date().toISOString(),
      };

      const updatedDocs = [...documents, newDoc];
      onDocumentsChange(updatedDocs);
      toast({ title: "Documento enviado!", description: file.name });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Erro ao enviar documento", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [colaboradorId, documents, onDocumentsChange, toast]);

  const handleDelete = useCallback((index: number) => {
    const updated = documents.filter((_, i) => i !== index);
    onDocumentsChange(updated);
    toast({ title: "Documento removido" });
  }, [documents, onDocumentsChange, toast]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Documentos / Contratos</p>
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
          <Button variant="outline" size="sm" className="gap-2" asChild disabled={uploading}>
            <span>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload
            </span>
          </Button>
        </label>
      </div>

      {documents.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum documento adicionado</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(doc.uploaded_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </a>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(i)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
