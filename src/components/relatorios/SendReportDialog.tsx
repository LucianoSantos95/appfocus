import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Mail, MessageSquare, FileText, FileType, Send, Trash2, UserPlus } from "lucide-react";
import { useRelatorioContatos } from "@/hooks/useRelatorioContatos";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ReportSection {
  title: string;
  kpis?: { label: string; value: string }[];
  rows?: { columns: string[]; data: string[][] };
  notes?: string;
}

export interface ReportPayloadBase {
  modulo: string;
  secao: string;
  titulo: string;
  subtitulo?: string;
  periodo?: string;
  empresa?: string;
  sections: ReportSection[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: ReportPayloadBase;
}

type Canal = "email" | "whatsapp";
type FormatoEmail = "pdf" | "html";
type FormatoWhats = "pdf" | "texto";

async function extractSendErrorMessage(err: unknown): Promise<string> {
  const fallback = err instanceof Error ? err.message : "Falha ao enviar.";

  if (typeof err === "object" && err !== null && "context" in err) {
    const context = (err as { context?: unknown }).context;
    if (context instanceof Response) {
      try {
        const data = await context.clone().json();
        if (typeof data?.error === "string" && data.error.trim()) return data.error;
        if (typeof data?.message === "string" && data.message.trim()) return data.message;
      } catch {
        try {
          const text = await context.clone().text();
          if (text.trim()) return text;
        } catch {
          return fallback;
        }
      }
    }
  }

  return fallback;
}

export function SendReportDialog({ open, onOpenChange, payload }: Props) {
  const { toast } = useToast();
  const { contatos, addContato, deleteContato } = useRelatorioContatos();
  const [tab, setTab] = useState<"contatos" | "manual">("contatos");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const canal: Canal = "email";
  const [formatoEmail, setFormatoEmail] = useState<FormatoEmail>("pdf");
  const [formatoWhats] = useState<FormatoWhats>("pdf");
  const [manualNome, setManualNome] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualTel, setManualTel] = useState("");
  const [salvarContato, setSalvarContato] = useState(true);
  const [sending, setSending] = useState(false);
  const [contactMenuId, setContactMenuId] = useState<string | null>(null);

  const formato = canal === "email" ? formatoEmail : formatoWhats;

  const toggleId = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const handleSend = async () => {
    let destinatarios: { destinatario: string; nome: string }[] = [];

    if (tab === "contatos") {
      const selecionados = contatos.filter(c => selectedIds.has(c.id));
      if (selecionados.length === 0) {
        toast({ title: "Selecione ao menos um contato", variant: "destructive" });
        return;
      }
      destinatarios = selecionados
        .map(c => ({
          destinatario: canal === "email" ? (c.email || "") : (c.telefone || ""),
          nome: c.nome,
        }))
        .filter(d => d.destinatario);
      if (destinatarios.length === 0) {
        toast({
          title: "Contatos sem dados de contato",
          description: `Nenhum dos selecionados possui ${canal === "email" ? "e-mail" : "telefone"} cadastrado.`,
          variant: "destructive",
        });
        return;
      }
    } else {
      const valor = canal === "email" ? manualEmail.trim() : manualTel.trim();
      if (!valor) {
        toast({ title: `Informe o ${canal === "email" ? "e-mail" : "telefone"}`, variant: "destructive" });
        return;
      }
      destinatarios = [{ destinatario: valor, nome: manualNome || "Destinatário" }];
      if (salvarContato && manualNome) {
        await addContato({
          nome: manualNome,
          email: manualEmail || undefined,
          telefone: manualTel || undefined,
          canais_preferidos: [canal],
        });
      }
    }

    setSending(true);
    let okCount = 0;
    let errCount = 0;
    const errorMessages: string[] = [];
    for (const d of destinatarios) {
      try {
        const { data, error } = await supabase.functions.invoke("send-bi-report", {
          body: {
            ...payload,
            formato,
            canal,
            destinatario: d.destinatario,
            destinatario_nome: d.nome,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        okCount++;
      } catch (err: any) {
        console.error("Send error:", err);
        errCount++;
        const message = await extractSendErrorMessage(err);
        if (!errorMessages.includes(message)) errorMessages.push(message);
      }
    }
    setSending(false);

    if (okCount > 0) {
      toast({
        title: `Relatório enviado para ${okCount} ${okCount === 1 ? "destinatário" : "destinatários"}`,
        description: errCount > 0 ? errorMessages[0] || `${errCount} envio(s) falharam.` : undefined,
      });
      onOpenChange(false);
      setSelectedIds(new Set());
      setManualNome(""); setManualEmail(""); setManualTel("");
    } else {
      toast({
        title: "Falha ao enviar relatório",
        description: errorMessages[0] || "Verifique o destinatário e tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContact = async (id: string) => {
    const deleted = await deleteContato(id);
    if (deleted) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setContactMenuId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Enviar Relatório
          </DialogTitle>
          <DialogDescription>
            {payload.titulo}{payload.periodo ? ` • ${payload.periodo}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Canal: WhatsApp temporariamente desabilitado, somente E-mail */}
          <div className="space-y-2">
            <Label>Canal de envio</Label>
            <div className="flex items-center gap-2 border rounded-lg p-3 border-primary bg-primary/5">
              <Mail className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">E-mail</span>
              <span className="ml-auto text-xs text-muted-foreground">WhatsApp em breve</span>
            </div>
          </div>

          {/* Formato (apenas e-mail) */}
          <div className="space-y-2">
            <Label>Formato</Label>
            <RadioGroup value={formatoEmail} onValueChange={(v) => setFormatoEmail(v as FormatoEmail)} className="grid grid-cols-2 gap-3">
              <Label htmlFor="fmt-pdf" className="flex items-center gap-2 border rounded-lg p-3 cursor-pointer hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value="pdf" id="fmt-pdf" />
                <FileType className="w-4 h-4" /> PDF anexo
              </Label>
              <Label htmlFor="fmt-html" className="flex items-center gap-2 border rounded-lg p-3 cursor-pointer hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value="html" id="fmt-html" />
                <FileText className="w-4 h-4" /> Resumo HTML
              </Label>
            </RadioGroup>
          </div>

          {/* Destinatário */}
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contatos">Meus contatos</TabsTrigger>
              <TabsTrigger value="manual">Digitar manualmente</TabsTrigger>
            </TabsList>

            <TabsContent value="contatos" className="space-y-2 max-h-56 overflow-y-auto">
              {contatos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum contato salvo ainda. Use a aba "Digitar manualmente".
                </p>
              ) : (
                contatos.map(c => {
                  const valor = canal === "email" ? c.email : c.telefone;
                  const disabled = !valor;
                  return (
                    <div
                      key={c.id}
                      className={`flex items-start gap-3 border rounded-lg p-3 ${disabled ? "opacity-50" : "hover:bg-accent"}`}
                    >
                      <Checkbox
                        id={`c-${c.id}`}
                        checked={selectedIds.has(c.id)}
                        onCheckedChange={() => !disabled && toggleId(c.id)}
                        disabled={disabled}
                      />
                      <Popover open={contactMenuId === c.id} onOpenChange={(open) => setContactMenuId(open ? c.id : null)}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="flex-1 min-w-0 text-left"
                          >
                            <div className="font-medium text-sm">{c.nome}{c.cargo ? ` • ${c.cargo}` : ""}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {valor || `Sem ${canal === "email" ? "e-mail" : "telefone"} cadastrado`}
                            </div>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-44 p-1">
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteContact(c.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir contato
                          </Button>
                        </PopoverContent>
                      </Popover>
                    </div>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="manual" className="space-y-3">
              <div className="space-y-1">
                <Label>Nome (opcional)</Label>
                <Input value={manualNome} onChange={e => setManualNome(e.target.value)} placeholder="Ex: Contador João" />
              </div>
              {canal === "email" ? (
                <div className="space-y-1">
                  <Label>E-mail</Label>
                  <Input type="email" value={manualEmail} onChange={e => setManualEmail(e.target.value)} placeholder="contato@exemplo.com" />
                </div>
              ) : (
                <div className="space-y-1">
                  <Label>WhatsApp (com DDD)</Label>
                  <Input value={manualTel} onChange={e => setManualTel(e.target.value)} placeholder="11987654321" />
                </div>
              )}
              <Label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={salvarContato} onCheckedChange={(v) => setSalvarContato(!!v)} />
                <UserPlus className="w-3.5 h-3.5" /> Salvar como contato recorrente
              </Label>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
              Cancelar
            </Button>
            <Button onClick={handleSend} disabled={sending} className="gap-2">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar Relatório
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
