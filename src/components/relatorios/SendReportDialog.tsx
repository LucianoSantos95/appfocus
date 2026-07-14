import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Mail, Chrome, FileText, FileType, Send, Trash2, UserPlus } from "lucide-react";
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

type Canal = "email" | "gmail";
type FormatoEmail = "pdf" | "html";

// Minimal, inline-styled HTML body for sending a report through the user's own Gmail.
function buildReportHtml(p: ReportPayloadBase): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const sections = p.sections
    .map((sec) => {
      const kpis = sec.kpis?.length
        ? `<table style="width:100%;border-collapse:collapse;margin:8px 0">${sec.kpis
            .map(
              (k) =>
                `<tr><td style="padding:4px 8px;color:#555">${esc(k.label)}</td><td style="padding:4px 8px;font-weight:600;text-align:right">${esc(k.value)}</td></tr>`
            )
            .join("")}</table>`
        : "";
      const rows = sec.rows?.data?.length
        ? `<table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:13px"><thead><tr>${sec.rows.columns
            .map((c) => `<th style="text-align:left;padding:4px 8px;border-bottom:1px solid #ddd">${esc(c)}</th>`)
            .join("")}</tr></thead><tbody>${sec.rows.data
            .map(
              (r) =>
                `<tr>${r.map((cell) => `<td style="padding:4px 8px;border-bottom:1px solid #f0f0f0">${esc(cell)}</td>`).join("")}</tr>`
            )
            .join("")}</tbody></table>`
        : "";
      const notes = sec.notes ? `<p style="color:#777;font-size:13px;margin:4px 0">${esc(sec.notes)}</p>` : "";
      return `<div style="margin:16px 0"><h3 style="font-size:15px;margin:0 0 4px">${esc(sec.title)}</h3>${kpis}${rows}${notes}</div>`;
    })
    .join("");
  const meta = [p.subtitulo, p.periodo, p.empresa].filter(Boolean).map(esc).join(" • ");
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#1a1a2e">
    <h2 style="margin:0 0 4px">${esc(p.titulo)}</h2>
    ${meta ? `<p style="color:#666;margin:0 0 12px;font-size:13px">${meta}</p>` : ""}
    ${sections}
    <p style="color:#999;font-size:12px;margin-top:24px;border-top:1px solid #eee;padding-top:8px">Enviado via Hub Empresarial — Focus Gestão Inteligente</p>
  </div>`;
}

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
  const [canal, setCanal] = useState<Canal>("email");
  const [formatoEmail, setFormatoEmail] = useState<FormatoEmail>("pdf");
  const [manualNome, setManualNome] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualTel, setManualTel] = useState("");
  const [salvarContato, setSalvarContato] = useState(true);
  const [sending, setSending] = useState(false);
  const [contactMenuId, setContactMenuId] = useState<string | null>(null);

  const formato = formatoEmail;

  const toggleId = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const handleSend = async () => {
    // Both "email" (system/Resend) and "gmail" (user's own Gmail) send to e-mail recipients.
    let destinatarios: { destinatario: string; nome: string }[] = [];

    if (tab === "contatos") {
      const selecionados = contatos.filter(c => selectedIds.has(c.id));
      if (selecionados.length === 0) {
        toast({ title: "Selecione ao menos um contato", variant: "destructive" });
        return;
      }
      destinatarios = selecionados
        .map(c => ({ destinatario: c.email || "", nome: c.nome }))
        .filter(d => d.destinatario);
      if (destinatarios.length === 0) {
        toast({
          title: "Contatos sem e-mail",
          description: "Nenhum dos selecionados possui e-mail cadastrado.",
          variant: "destructive",
        });
        return;
      }
    } else {
      const valor = manualEmail.trim();
      if (!valor) {
        toast({ title: "Informe o e-mail", variant: "destructive" });
        return;
      }
      destinatarios = [{ destinatario: valor, nome: manualNome || "Destinatário" }];
      if (salvarContato && manualNome) {
        await addContato({
          nome: manualNome,
          email: manualEmail || undefined,
          telefone: manualTel || undefined,
          canais_preferidos: ["email"],
        });
      }
    }

    setSending(true);
    let okCount = 0;
    let errCount = 0;
    const errorMessages: string[] = [];
    for (const d of destinatarios) {
      try {
        if (canal === "gmail") {
          // Send through the user's own Gmail (per-tenant OAuth) — replies land in their inbox.
          const { data, error } = await supabase.functions.invoke("google-integration", {
            body: {
              action: "send_email",
              to: d.destinatario,
              subject: payload.titulo,
              body: buildReportHtml(payload),
            },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
        } else {
          const { data, error } = await supabase.functions.invoke("send-bi-report", {
            body: {
              ...payload,
              formato,
              canal: "email",
              destinatario: d.destinatario,
              destinatario_nome: d.nome,
            },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
        }
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
          {/* Canal de envio */}
          <div className="space-y-2">
            <Label>Canal de envio</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCanal("email")}
                className={`flex items-center gap-2 border rounded-lg p-3 text-left transition-colors ${
                  canal === "email" ? "border-primary bg-primary/5" : "hover:bg-accent"
                }`}
              >
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">E-mail do sistema</span>
              </button>
              <button
                type="button"
                onClick={() => setCanal("gmail")}
                className={`flex items-center gap-2 border rounded-lg p-3 text-left transition-colors ${
                  canal === "gmail" ? "border-primary bg-primary/5" : "hover:bg-accent"
                }`}
              >
                <Chrome className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Meu Gmail</span>
              </button>
            </div>
          </div>

          {canal === "gmail" ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground flex items-start gap-3">
              <Chrome className="w-4 h-4 mt-0.5 text-primary shrink-0" />
              <span>
                O relatório será enviado pelo <span className="font-medium text-foreground">seu próprio Gmail</span>{" "}
                (conectado em Integrações) — as respostas chegam na sua caixa de entrada. Enviado como resumo HTML.
              </span>
            </div>
          ) : (
            /* Formato (apenas e-mail do sistema) */
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
          )}

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
                  const valor = c.email;
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
                              {valor || "Sem e-mail cadastrado"}
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
              <div className="space-y-1">
                <Label>E-mail</Label>
                <Input type="email" value={manualEmail} onChange={e => setManualEmail(e.target.value)} placeholder="contato@exemplo.com" />
              </div>
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
