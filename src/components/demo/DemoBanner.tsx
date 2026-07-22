import { useNavigate } from "react-router-dom";
import { Eye, LogOut } from "lucide-react";
import { isDemoMode } from "@/lib/demo-fixtures";
import { clearAllResources } from "@/lib/sharedResource";

export default function DemoBanner() {
  const navigate = useNavigate();
  if (!isDemoMode()) return null;

  const exitDemo = () => {
    try {
      sessionStorage.removeItem("demo_mode");
    } catch { /* ignore */ }
    clearAllResources();
    // Hard reload garante que AuthProvider/PlanProvider soltem o usuário sintético.
    window.location.assign("/auth");
  };


  return (
    <div className="sticky top-0 z-50 w-full bg-accent text-accent-foreground border-b border-accent/40">
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="w-4 h-4 shrink-0" />
          <span className="truncate">
            <strong>Modo demonstração</strong> · dados fictícios · alterações não são salvas
          </span>
        </div>
        <button
          onClick={exitDemo}
          className="flex items-center gap-1.5 rounded-md bg-accent-foreground/10 hover:bg-accent-foreground/20 px-3 py-1 font-medium transition-colors shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair da demo
        </button>
      </div>
    </div>
  );
}
