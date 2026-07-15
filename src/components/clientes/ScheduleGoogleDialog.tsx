import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Loader2, Chrome } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScheduleGoogleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteNome: string;
  clienteEmail?: string | null;
}

/**
 * Mini-dialog invocado direto do card do cliente para agendar reunião
 * no Google Agenda SEM sair da tela de clientes. Se o Google não estiver
 * conectado, mostra CTA inline (não redireciona para Settings).
 */
export function ScheduleGoogleDialog({
  open,
  onOpenChange,
  clienteNome,
  clienteEmail,
}: ScheduleGoogleDialogProps) {
  const { session } = useAuth();
  const { toast } = useToast();

  const [checking, setChecking] = useState(true);
  const [connected, setConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const [summary, setSummary] = useState(`Reunião com ${clienteNome}`);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split("T")[0];
  });
  const [time, setTime] = useState("14:00");
  const [duration, setDuration] = useState(60);

  // Check Google connection on open
  useEffect(() => {
    if (!open || !session?.access_token) return;
    setChecking(true);
    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-integration`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ action: "status" }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          setConnected(!!data.connected);
        }
      } finally {
        setChecking(false);
      }
    })();
  }, [open, session?.access_token]);

  const handleConnect = async () => {
    if (!session?.access_token) return;
    setConnecting(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-integration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            action: "auth_url",
            redirect_url: window.location.origin + window.location.pathname,
          }),
        }
      );
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch {
      toast({ title: "Erro ao conectar Google", variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  const handleCreate = async () => {
    if (!session?.access_token || !summary || !date || !time) return;
    setSaving(true);

    const startISO = new Date(`${date}T${time}:00`).toISOString();
    const endISO = new Date(new Date(startISO).getTime() + duration * 60000).toISOString();

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-integration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            action: "create_event",
            summary,
            description:
              description || (clienteEmail ? `Contato: ${clienteEmail}` : undefined),
            start: startISO,
            end: endISO,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falha ao criar evento");
      }

      const data = await res.json();

      // Espelhar em agenda_items local
      try {
        await supabase.from("agenda_items").insert({
          user_id: session.user!.id,
          title: summary,
          date,
          time,
          type: "meeting",
          priority: "medium",
          description: description || `Reunião agendada via Google Agenda`,
        });
      } catch (e) {
        console.warn("Espelho local falhou (não crítico):", e);
      }

      toast({
        title: "Reunião agendada! 📅",
        description: data.htmlLink
          ? `Evento criado no Google Agenda. Abra: ${data.htmlLink}`
          : "Evento criado no seu Google Agenda.",
      });
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao agendar";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl">
            <Calendar className="w-5 h-5 text-primary" />
            Agendar reunião
          </DialogTitle>
          <DialogDescription>
            Com <span className="font-medium text-foreground">{clienteNome}</span>
            {clienteEmail && (
              <span className="text-muted-foreground"> · {clienteEmail}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {checking ? (
          <div className="py-10 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !connected ? (
          <div className="py-6 space-y-3 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Chrome className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Conecte o Google Agenda</p>
              <p className="text-sm text-muted-foreground mt-1">
                Para criar eventos automaticamente na sua agenda.
              </p>
            </div>
            <Button onClick={handleConnect} disabled={connecting} className="w-full">
              {connecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Chrome className="w-4 h-4 mr-2" />
              )}
              Conectar Google (30s)
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Reunião com..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2 col-span-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora</Label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Duração</Label>
                <div className="flex gap-2">
                  {[30, 60, 90, 120].map((m) => (
                    <Button
                      key={m}
                      type="button"
                      variant={duration === m ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDuration(m)}
                      className="flex-1"
                    >
                      {m}min
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Pauta, links, contexto..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleCreate} disabled={saving || !summary || !date || !time}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Agendar no Google
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
