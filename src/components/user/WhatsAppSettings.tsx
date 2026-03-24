import { useState, useEffect } from "react";
import { useWhatsAppPreferences, WhatsAppPreferences } from "@/hooks/useWhatsAppPreferences";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function WhatsAppSettings() {
  const { prefs, loading, saving, savePrefs } = useWhatsAppPreferences();
  const [local, setLocal] = useState<WhatsAppPreferences>(prefs);

  useEffect(() => {
    setLocal(prefs);
  }, [prefs]);

  const handleSave = () => {
    savePrefs(local);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-green-500" />
        <p className="text-sm font-medium text-foreground">Notificações via WhatsApp</p>
      </div>

      <div className="space-y-2">
        <Label>Número do WhatsApp</Label>
        <Input
          value={local.whatsapp_number}
          onChange={(e) => setLocal({ ...local, whatsapp_number: e.target.value })}
          placeholder="5511999999999"
          maxLength={20}
        />
        <p className="text-xs text-muted-foreground">
          Formato: código do país + DDD + número (sem espaços ou símbolos)
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="wpp-enabled">Ativar notificações</Label>
        <Switch
          id="wpp-enabled"
          checked={local.enabled}
          onCheckedChange={(v) => setLocal({ ...local, enabled: v })}
        />
      </div>

      <Separator />

      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        Tipos de alerta
      </p>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">📋 Tarefas</p>
            <p className="text-xs text-muted-foreground">Tarefas vencendo nas próximas 24h</p>
          </div>
          <Switch
            checked={local.notify_tarefas}
            onCheckedChange={(v) => setLocal({ ...local, notify_tarefas: v })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">👥 Clientes</p>
            <p className="text-xs text-muted-foreground">Clientes sem interação há 30+ dias</p>
          </div>
          <Switch
            checked={local.notify_clientes}
            onCheckedChange={(v) => setLocal({ ...local, notify_clientes: v })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">💰 Financeiro</p>
            <p className="text-xs text-muted-foreground">Transações pendentes próximas do vencimento</p>
          </div>
          <Switch
            checked={local.notify_financeiro}
            onCheckedChange={(v) => setLocal({ ...local, notify_financeiro: v })}
          />
        </div>
      </div>

      <Button onClick={handleSave} className="w-full" disabled={saving}>
        {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        Salvar preferências
      </Button>
    </div>
  );
}
