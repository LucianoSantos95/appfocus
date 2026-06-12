import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { ArrowRight } from "lucide-react";

export default function AuthHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
      <Link to="/" className="flex items-center gap-2">
        <img src={logo} alt="Hub Empresarial — Logotipo Focus Inteligente" className="h-8 w-auto />
        <span className="text-sm font-semibold text-foreground hidden sm:inline">Hub Empresarial</span>
      </Link>
      <Link
        to="/planos"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        Ver Preços
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </header>
  );
}
