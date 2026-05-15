import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, Loader2, Download, Paperclip } from "lucide-react";

interface AttachmentItem {
  name: string;
  url: string;
  uploaded_at: string;
  size?: number;
}

interface ProjetoAnexosProps {
  projetoId: string;
  attachments: AttachmentItem[];
  onAttachmentsChange: (attachments: AttachmentItem[]) => void;
}

export function ProjetoAnexos({ projetoId, attachments, onAttachmentsChange }: ProjetoAnexosProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo de 20MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${projetoId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("projeto-anexos")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: signed, error: signedErr } = await supabase.storage
        .from("projeto-anexos")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signedErr || !signed?.signedUrl) throw signedErr || new Error("signed url failed");
      const publicUrl = signed.signedUrl;

      const newAttachment: AttachmentItem = {
        name: file.name,
        url: publicUrl,
        uploaded_at: new Date().toISOString(),
        size: file.size,
      };

      const updated = [...attachments, newAttachment];
      onAttachmentsChange(updated);
      toast({ title: "Anexo adicionado!", description: file.name });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Erro ao enviar anexo", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [projetoId, attachments, onAttachmentsChange, toast]);

  const handleDelete = useCallback((index: number) => {
    const updated = attachments.filter((_, i) => i !== index);
    onAttachmentsChange(updated);
    toast({ title: "Anexo removido" });
  }, [attachments, onAttachmentsChange, toast]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-primary" />
          Anexos do Projeto
        </p>
        <label className="cursor-pointer">
          <input
            type="file"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
          <Button variant="outline" size="sm" className="gap-2" asChild disabled={uploading}>
            <span>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Anexar arquivo
            </span>
          </Button>
        </label>
      </div>

      {attachments.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
          <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum anexo adicionado</p>
          <p className="text-xs mt-1">Adicione briefings, contratos ou documentos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((att, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{att.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(att.uploaded_at).toLocaleDateString("pt-BR")}
                    {att.size ? ` • ${formatFileSize(att.size)}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a href={att.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="w-4 h-4" />
                  </Button>
                </a>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(i)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
