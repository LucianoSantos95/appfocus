import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, CheckCircle2, Clock, AlertCircle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { supportTicketSchema, getZodErrorMessage } from "@/lib/schemas";
import { stripHtml } from "@/lib/sanitize";

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Ticket {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  mensagem: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; class: string }> = {
  aberto: { label: "Aberto", icon: Clock, class: "bg-warning/10 text-warning" },
  em_andamento: { label: "Em Andamento", icon: AlertCircle, class: "bg-primary/10 text-primary" },
  resolvido: { label: "Resolvido", icon: CheckCircle2, class: "bg-success/10 text-success" },
};

export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState(user?.user_metadata?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchTickets();
    }
  }, [open, user]);

  const fetchTickets = async () => {
    if (!user) return;
    setLoadingTickets(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = supportTicketSchema.safeParse({ nome, email, telefone, mensagem });
    if (!parsed.success) {
      toast({ title: getZodErrorMessage(parsed.error), variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        nome: stripHtml(nome.trim()),
        email: email.trim(),
        telefone: telefone.trim() || null,
        mensagem: stripHtml(mensagem.trim()),
      });
      if (error) throw error;
      toast({ title: "Ticket enviado!", description: "Responderemos em breve." });
      setMensagem("");
      setTelefone("");
      fetchTickets();
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openTickets = tickets.filter(t => t.status !== 'resolvido');
  const resolvedTickets = tickets.filter(t => t.status === 'resolvido');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Suporte</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="tickets" className="mt-2">
          <TabsList className="bg-muted w-full">
            <TabsTrigger value="tickets" className="flex-1 gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Meus Tickets
              {openTickets.length > 0 && (
                <span className="ml-1 text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded-full">{openTickets.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="novo" className="flex-1 gap-1.5">
              <Send className="w-3.5 h-3.5" />
              Novo Ticket
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-3 mt-4">
            {loadingTickets ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum ticket de suporte</p>
                <p className="text-xs mt-1">Abra um novo ticket na aba ao lado</p>
              </div>
            ) : (
              <>
                {openTickets.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Em aberto</p>
                    {openTickets.map(ticket => (
                      <TicketCard key={ticket.id} ticket={ticket} />
                    ))}
                  </div>
                )}
                {resolvedTickets.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resolvidos</p>
                    {resolvedTickets.map(ticket => (
                      <TicketCard key={ticket.id} ticket={ticket} />
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="novo" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" maxLength={20} />
              </div>
              <div className="space-y-2">
                <Label>Mensagem *</Label>
                <Textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={4} maxLength={2000} placeholder="Descreva como podemos ajudar..." />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Enviar Ticket
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  const config = statusConfig[ticket.status] || statusConfig.aberto;
  const StatusIcon = config.icon;
  const recentlyResolved =
    ticket.status === "resolvido" &&
    Date.now() - new Date(ticket.updated_at).getTime() < 1000 * 60 * 60 * 24 * 3;

  return (
    <div
      className={cn(
        "rounded-lg p-4 border transition-colors",
        recentlyResolved
          ? "bg-success/10 border-success/40 ring-1 ring-success/30"
          : "bg-muted/30 border-border/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground line-clamp-2">{ticket.mensagem}</p>
          <p className="text-xs text-muted-foreground mt-1.5">
            {new Date(ticket.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <span className={cn("flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap", config.class)}>
          <StatusIcon className="w-3 h-3" />
          {config.label}
        </span>
      </div>
    </div>
  );
}
