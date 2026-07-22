import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { clearAllResources } from "@/lib/sharedResource";

/**
 * Rota /demo — ativa o modo demonstração anônimo (read-only, sem login).
 * Desloga qualquer sessão Supabase existente, seta a flag e vai pro dashboard.
 */
export default function DemoEntry() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        clearAllResources();
        await supabase.auth.signOut();
      } catch { /* ignore */ }
      try {
        sessionStorage.setItem("demo_mode", "1");
      } catch { /* ignore */ }
      navigate("/", { replace: true });
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
