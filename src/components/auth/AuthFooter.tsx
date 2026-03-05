import { Link } from "react-router-dom";

export default function AuthFooter() {
  return (
    <footer className="flex items-center justify-center gap-4 px-6 py-4 border-t border-border/50 text-xs text-muted-foreground">
      <Link to="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link>
      <span>·</span>
      <Link to="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link>
      <span>·</span>
      <Link to="/planos" className="hover:text-foreground transition-colors">Preços</Link>
    </footer>
  );
}
