import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Send } from "lucide-react";
import { OwnerUserRow, formatDate } from "@/hooks/useOwnerUsers";

interface Props {
  users: OwnerUserRow[];
}

type Filter = "todos" | "ativos" | "inativos" | "novos" | "pagos";

export function BroadcastPanel({ users }: Props) {
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>("todos");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Acessar o Hub");
  const [ctaUrl, setCtaUrl] = useState("https://app.focusinteligente.com.br/");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const now = Date.now();
    return users.filter((u) => {
      if (search && !`${u.display_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())) return false;
      const last = u.last_active_at ? new Date(u.last_active_at).getTime() : 0;
      const created = new Date(u.signed_up_at).getTime();
      switch (filter) {
        case "ativos":
          return u.actions_30d > 0;
        case "inativos":
          return !last || now - last > 14 * 86400000;
        case "novos":
          return now - created < 30 * 86400000;
        case "pagos":
          return (u.plan || "gratuito").toLowerCase() !== "gratuito";
        default:
          return true;
      }
    });
  }, [users, filter, search]);

  const toggle = (email: string) =>
    setSelected((prev) => (prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]));

  const toggleAll = () => {
    const emails = filtered.map((u) => u.email);
    const allIn = emails.every((e) => selected.includes(e));
    setSelected(allIn ? selected.filter((e) => !emails.includes(e)) : Array.from(new Set([...selected, ...emails])));
  };

  const introHtml = message
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const handleSend = async () => {
    if (selected.length === 0) return toast({ title: "Selecione ao menos um destinatário", variant: "destructive" });
    if (!subject.trim() || !message.trim()) return toast({ title: "Preencha assunto e mensagem", variant: "destructive" });

    setSending(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("send-subscriber-broadcast", {
        body: {
          action: "send",
          audience: "custom",
          extra_emails: selected,
          subject: subject.trim(),
          intro_html: introHtml,
          blocks_html: "",
          cta_label: ctaLabel,
          cta_url: ctaUrl,
          body_text: message,
        },
      });
      if (error) throw error;
      const r = data as { sent: number; failed: number; total: number };
      setResult(`Enviados: ${r.sent} · Falhas: ${r.failed} · Total: ${r.total}`);
      toast({ title: "Disparo concluído", description: `${r.sent} e-mail(s) enviado(s).` });
    } catch (e) {
      toast({ title: "Erro no disparo", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "ativos", label: "Ativos (30d)" },
    { key: "inativos", label: "Inativos (14d+)" },
    { key: "novos", label: "Novos (30d)" },
    { key: "pagos", label: "Pagantes" },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Destinatários</h3>
          <Badge variant="secondary" className="ml-auto">{selected.length} selecionado(s)</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "default" : "outline"}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        <Input placeholder="Buscar por nome ou e-mail" value={search} onChange={(e) => setSearch(e.target.value)} />

        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Checkbox
            id="select-all-broadcast"
            checked={filtered.length > 0 && filtered.every((u) => selected.includes(u.email))}
            onCheckedChange={toggleAll}
          />
          <label htmlFor="select-all-broadcast" className="text-sm font-medium">
            Selecionar todos os {filtered.length} visíveis
          </label>
        </div>

        <ul className="max-h-[360px] overflow-y-auto space-y-1">
          {filtered.length === 0 && <li className="text-sm text-muted-foreground py-6 text-center">Sem dados</li>}
          {filtered.map((u) => (
            <li key={u.user_id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
              <Checkbox checked={selected.includes(u.email)} onCheckedChange={() => toggle(u.email)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{u.display_name}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(u.last_active_at)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Mensagem</h3>
        <div className="space-y-2">
          <Label>Assunto</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={140} placeholder="Assunto do e-mail" />
        </div>
        <div className="space-y-2">
          <Label>Texto (parágrafos separados por linha em branco)</Label>
          <Textarea rows={8} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Escreva a mensagem..." />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>Texto do botão</Label>
            <Input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Link do botão</Label>
            <Input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} />
          </div>
        </div>

        <div className="rounded-lg border border-border p-3 bg-muted/30">
          <p className="text-xs text-muted-foreground mb-2">Prévia do conteúdo</p>
          <p className="text-sm font-semibold">{subject || "(sem assunto)"}</p>
          <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{message || "(sem texto)"}</div>
        </div>

        <Button onClick={handleSend} disabled={sending} className="w-full gap-2">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Disparar para {selected.length} destinatário(s)
        </Button>
        {result && <p className="text-sm text-muted-foreground text-center">{result}</p>}
      </Card>
    </div>
  );
}
