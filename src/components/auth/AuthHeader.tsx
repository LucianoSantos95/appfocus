import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { ArrowRight, Sparkles } from "lucide-react";

export default function AuthHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
      <Link to="/" className="flex items-center gap-2">
        <img src={logo} alt="Hub Empresarial — Logotipo Focus Inteligente" className="h-8 w-auto" />
        <span className="text-sm font-semibold text-foreground hidden sm:inline">Hub Empresarial</span>
      </Link>
      <nav className="flex items-center gap-3 sm:gap-5">
        <Link
          to="/mcp"
          className="group relative inline-flex items-center gap-2 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-foreground bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 border border-primary/40 hover:border-primary/70 hover:from-primary/30 hover:via-accent/30 hover:to-primary/30 shadow-[0_0_20px_-4px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_28px_-2px_hsl(var(--primary)/0.6)] transition-all hover:scale-[1.03]"
        >
          <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 leading-none tracking-wide">
            NOVO
          </span>
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse hidden sm:inline" />
          <span className="hidden sm:inline">Use no ChatGPT e Claude</span>
          <span className="sm:hidden">ChatGPT / Claude</span>
          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          to="/planos"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Ver Preços
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </nav>
    </header>
  );
}
