import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export default function LandingFooter() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="Hub Empresarial" className="h-6 w-auto" />
          <span className="text-sm font-semibold text-foreground">Hub Empresarial</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            · © 2026 Focus Gestão Inteligente · São Paulo · BR
          </span>
        </div>
        <div className="flex items-center gap-5 text-xs text-muted-foreground">
          <Link to="/termos" className="hover:text-foreground transition-colors">Termos</Link>
          <Link to="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link>
          <Link to="/mcp" className="hover:text-foreground transition-colors">MCP</Link>
          <Link to="/planos" className="hover:text-foreground transition-colors">Grátis</Link>
        </div>
      </div>
    </footer>
  );
}
