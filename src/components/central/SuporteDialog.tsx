import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LifeBuoy, Send } from "lucide-react";
import { stripHtml } from "@/lib/sanitize";

const suporteSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(100, "Nome muito longo"),
  email: z.string().trim().email("E-mail inválido").max(255),
  telefone: z.string().trim().min(8, "Informe um telefone válido").max(30, "Telefone muito longo"),
  mensagem: z.string().trim().min(5, "Conte o que está acontecendo").max(2000, "Mensagem muito longa"),
});

function SuporteForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = suporteSchema.safeParse({ nome, email, telefone, mensagem });
    if (!parsed.success) {
      const campos: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        const campo = String(i.path[0] ?? "");
        if (campo && !campos[campo]) campos[campo] = i.message;
      });
      setErros(campos);
      return;
    }
    setErros({});
    setLoading(true);
    try {
      const { error } = await supabase.from("suporte_publico").insert({
        nome: parsed.data.nome,
        email: parsed.data.email.toLowerCase(),
        telefone: parsed.data.telefone,
        mensagem: stripHtml(parsed.data.mensagem),
        pagina: typeof window !== "undefined" ? window.location.pathname : null,
      });
      if (error) throw error;

      toast({ title: "Mensagem enviada!", description: "Nossa equipe responde no e-mail informado." });
      onSubmitted();
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const erro = (campo: string) =>
    erros[campo] ? <p className="text-xs text-destructive">{erros[campo]}</p> : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nome *</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={100} placeholder="Seu nome" />
          {erro("nome")}
        </div>
        <div className="space-y-2">
          <Label>Telefone *</Label>
          <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} maxLength={30} placeholder="(11) 99999-9999" />
          {erro("telefone")}
        </div>
      </div>

      <div className="space-y-2">
        <Label>E-mail *</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} placeholder="voce@email.com" />
        {erro("email")}
      </div>

      <div className="space-y-2">
        <Label>Mensagem *</Label>
        <Textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Descreva o que você precisa e a gente te ajuda."
        />
        {erro("mensagem")}
      </div>

      <Button type="submit" className="w-full gap-2" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Enviar para o suporte
      </Button>
    </form>
  );
}

export function SuporteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LifeBuoy className="h-4 w-4 text-primary" /> Falar com o suporte
          </DialogTitle>
          <DialogDescription>
            Conte o que está acontecendo — respondemos no e-mail informado.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <SuporteForm onSubmitted={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Link discreto para o rodapé. */
export function LinkSuporte({ className = "" }: { className?: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className={`focus-label inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground ${className}`}
      >
        <LifeBuoy className="h-3.5 w-3.5" />
        Precisa de suporte?
      </button>
      <SuporteDialog open={aberto} onOpenChange={setAberto} />
    </>
  );
}
