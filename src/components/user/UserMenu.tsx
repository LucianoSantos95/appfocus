import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/contexts/PlanContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Shield,
  CreditCard,
  MessageSquare,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface UserMenuProps {
  collapsed: boolean;
}

export function UserMenu({ collapsed }: UserMenuProps) {
  const { user, signOut } = useAuth();
  const { plan } = usePlan();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!user) return null;

  const initials = (user.user_metadata?.full_name || user.email || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const planLabel: Record<string, string> = {
    gratuito: "Gratuito",
    plus: "Plus",
    pro: "Pro",
    enterprise: "Enterprise",
  };

  return (
    <div className="px-2 py-3 border-t border-sidebar-border">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-left">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.user_metadata?.full_name || user.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  Plano {planLabel[plan] || plan}
                </p>
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-56">
          <DropdownMenuItem onClick={() => toast({ title: "Em breve", description: "Perfil será implementado em breve." })}>
            <User className="w-4 h-4 mr-2" /> Perfil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast({ title: "Em breve", description: "Painel admin será implementado em breve." })}>
            <Shield className="w-4 h-4 mr-2" /> Admin
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/planos")}>
            <CreditCard className="w-4 h-4 mr-2" /> Faturamento
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast({ title: "Em breve", description: "Feedback será implementado em breve." })}>
            <MessageSquare className="w-4 h-4 mr-2" /> Feedback
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast({ title: "Em breve", description: "Suporte será implementado em breve." })}>
            <HelpCircle className="w-4 h-4 mr-2" /> Suporte
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            comercial@focusinteligente.com.br
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
