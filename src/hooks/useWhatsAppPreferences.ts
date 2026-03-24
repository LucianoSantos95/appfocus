import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface WhatsAppPreferences {
  whatsapp_number: string;
  notify_tarefas: boolean;
  notify_clientes: boolean;
  notify_financeiro: boolean;
  enabled: boolean;
}

export function useWhatsAppPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<WhatsAppPreferences>({
    whatsapp_number: "",
    notify_tarefas: true,
    notify_clientes: true,
    notify_financeiro: true,
    enabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("whatsapp_preferences" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setPrefs({
          whatsapp_number: (data as any).whatsapp_number || "",
          notify_tarefas: (data as any).notify_tarefas ?? true,
          notify_clientes: (data as any).notify_clientes ?? true,
          notify_financeiro: (data as any).notify_financeiro ?? true,
          enabled: (data as any).enabled ?? false,
        });
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const savePrefs = async (newPrefs: WhatsAppPreferences) => {
    if (!user) return;
    setSaving(true);
    try {
      // Try update first, then upsert
      const { data: existing } = await supabase
        .from("whatsapp_preferences" as any)
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("whatsapp_preferences" as any)
          .update({
            whatsapp_number: newPrefs.whatsapp_number,
            notify_tarefas: newPrefs.notify_tarefas,
            notify_clientes: newPrefs.notify_clientes,
            notify_financeiro: newPrefs.notify_financeiro,
            enabled: newPrefs.enabled,
          } as any)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("whatsapp_preferences" as any)
          .insert({
            user_id: user.id,
            whatsapp_number: newPrefs.whatsapp_number,
            notify_tarefas: newPrefs.notify_tarefas,
            notify_clientes: newPrefs.notify_clientes,
            notify_financeiro: newPrefs.notify_financeiro,
            enabled: newPrefs.enabled,
          } as any);
        if (error) throw error;
      }

      setPrefs(newPrefs);
      toast({ title: "Preferências de WhatsApp salvas!" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return { prefs, loading, saving, savePrefs };
}
