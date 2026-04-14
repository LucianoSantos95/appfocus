import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Chrome, Mail, Calendar, RefreshCw, Unplug, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface IntegrationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IntegrationsPanel({ open, onOpenChange }: IntegrationsPanelProps) {
  const { session } = useAuth();
  const { toast } = useToast();
  const [googleStatus, setGoogleStatus] = useState<{
    connected: boolean;
    email: string | null;
    connected_at: string | null;
  }>({ connected: false, email: null, connected_at: null });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const checkGoogleStatus = useCallback(async () => {
    if (!session?.access_token) return;
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
        setGoogleStatus(data);
      }
    } catch (err) {
      console.error("Google status check failed:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (open) {
      setLoading(true);
      checkGoogleStatus();
    }
  }, [open, checkGoogleStatus]);

  // Check URL params for connection result
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google_connected") === "true") {
      toast({ title: "Google conectado com sucesso! 🎉" });
      window.history.replaceState({}, "", window.location.pathname);
      checkGoogleStatus();
    }
    if (params.get("google_error")) {
      toast({
        title: "Erro ao conectar Google",
        description: params.get("google_error") || "Tente novamente",
        variant: "destructive",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleConnect = async () => {
    if (!session?.access_token) return;
    setActionLoading("connect");
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
      } else {
        const err = await res.json();
        toast({ title: "Erro", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao iniciar conexão", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnect = async () => {
    if (!session?.access_token) return;
    setActionLoading("disconnect");
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
          body: JSON.stringify({ action: "disconnect" }),
        }
      );
      if (res.ok) {
        setGoogleStatus({ connected: false, email: null, connected_at: null });
        toast({ title: "Google desconectado" });
      }
    } catch {
      toast({ title: "Erro ao desconectar", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSyncCalendar = async () => {
    if (!session?.access_token) return;
    setActionLoading("sync");
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
          body: JSON.stringify({ action: "sync_events" }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        toast({
          title: "Agenda sincronizada!",
          description: `${data.synced} novo(s) evento(s) importado(s) de ${data.total_found} encontrado(s).`,
        });
      } else {
        const err = await res.json();
        toast({ title: "Erro na sincronização", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao sincronizar", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Integrações</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Google Workspace */}
          <div className="rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Chrome className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">Google Workspace</h4>
                <p className="text-xs text-muted-foreground">Gmail + Google Agenda</p>
              </div>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : googleStatus.connected ? (
                <Badge variant="default" className="bg-success/10 text-success border-success/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Conectado
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="w-3 h-3 mr-1" />
                  Desconectado
                </Badge>
              )}
            </div>

            {googleStatus.connected && googleStatus.email && (
              <p className="text-sm text-muted-foreground mb-3">
                Conta: <span className="font-medium text-foreground">{googleStatus.email}</span>
              </p>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="w-3.5 h-3.5" />
                <span>Ler e enviar e-mails</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>Sincronizar agenda</span>
              </div>
            </div>

            {!googleStatus.connected ? (
              <Button
                onClick={handleConnect}
                disabled={!!actionLoading}
                className="w-full"
              >
                {actionLoading === "connect" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Chrome className="w-4 h-4 mr-2" />
                )}
                Conectar Google
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSyncCalendar}
                  disabled={!!actionLoading}
                  className="flex-1"
                >
                  {actionLoading === "sync" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sincronizar Agenda
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleDisconnect}
                  disabled={!!actionLoading}
                >
                  {actionLoading === "disconnect" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unplug className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-3">
              Requer configuração de credenciais OAuth no Google Cloud Console.
              O administrador deve configurar Client ID e Client Secret nas variáveis de ambiente.
            </p>
          </div>

          {/* WhatsApp (already configured) */}
          <div className="rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-success" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.553 4.12 1.52 5.857L0 24l6.335-1.652A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82c-1.98 0-3.832-.53-5.434-1.456l-.39-.232-3.755.98.996-3.64-.254-.404A9.786 9.786 0 012.18 12C2.18 6.59 6.59 2.18 12 2.18S21.82 6.59 21.82 12 17.41 21.82 12 21.82z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">WhatsApp</h4>
                <p className="text-xs text-muted-foreground">Notificações via Twilio</p>
              </div>
              <Badge variant="default" className="bg-success/10 text-success border-success/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Configurado
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              O Assistente Focus pode enviar mensagens WhatsApp por comando de voz. Configure suas preferências em Perfil → WhatsApp.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
