import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/contexts/PlanContext";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
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
  Plug,
  Bot,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProfileDialog } from "./ProfileDialog";
import { AdminPanel } from "./AdminPanel";
import { SupportDialog } from "./SupportDialog";
import { FeedbackDialog } from "./FeedbackDialog";
import { IntegrationsPanel } from "@/components/settings/IntegrationsPanel";


interface UserMenuProps {
  collapsed: boolean;
}

export function UserMenu({ collapsed }: UserMenuProps) {
  const { user, signOut } = useAuth();
  const { plan } = usePlan();
  const { isAdmin } = useTeamPermissions();
  
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);

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

  return (
    <>
      <div className={collapsed ? "flex justify-center" : "px-2 py-3"}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-sidebar-accent hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 ease-out text-left">
              <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-transparent group-hover:ring-primary/40 transition-all duration-300 group-hover:rotate-6">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold group-hover:bg-primary/20 transition-colors">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                </div>

              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuItem onClick={() => setProfileOpen(true)}>
              <User className="w-4 h-4 mr-2" /> Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAdminOpen(true)}>
              <Shield className="w-4 h-4 mr-2" /> Admin
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFeedbackOpen(true)}>
              <MessageSquare className="w-4 h-4 mr-2" /> Feedback
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSupportOpen(true)}>
              <HelpCircle className="w-4 h-4 mr-2" /> Suporte
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIntegrationsOpen(true)}>
              <Plug className="w-4 h-4 mr-2" /> Integrações
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { navigate("/mcp"); }}>
              <Bot className="w-4 h-4 mr-2" /> Conectar ao ChatGPT/Claude
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

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <AdminPanel open={adminOpen} onOpenChange={setAdminOpen} />
      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <IntegrationsPanel open={integrationsOpen} onOpenChange={setIntegrationsOpen} />
    </>
  );
}
