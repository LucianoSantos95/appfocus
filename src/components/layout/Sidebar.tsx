import { useAuth } from "@/contexts/AuthContext";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";
import { UserMenu } from "@/components/user/UserMenu";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";
import {
  LayoutDashboard,
  DollarSign,
  Users,
  Megaphone,
  FolderKanban,
  UserCheck,
  ListTodo,
  GitBranch,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Lock as LockIcon,
  BarChart2,
} from "lucide-react";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePlan } from "@/contexts/PlanContext";
import { useClientes } from "@/hooks/useClientes";
import { useProjetos } from "@/hooks/useProjetos";
import { useColaboradores } from "@/hooks/useColaboradores";

const modules = [
  { name: "Painel", path: "/", slug: "", icon: LayoutDashboard },
  { name: "Finanças", path: "/financas", slug: "financas", icon: DollarSign },
  { name: "RH", path: "/rh", slug: "rh", icon: Users },
  { name: "Marketing", path: "/marketing", slug: "marketing", icon: Megaphone },
  { name: "Projetos", path: "/projetos", slug: "projetos", icon: FolderKanban },
  { name: "Clientes", path: "/clientes", slug: "clientes", icon: UserCheck },
  { name: "Atividades", path: "/atividades", slug: "atividades", icon: ListTodo },
  { name: "Processos", path: "/processos", slug: "processos", icon: GitBranch },
  { name: "Guia de Uso", path: "/guia", slug: "guia", icon: BookOpen },
];


export function Sidebar() {
  const { collapsed, toggle } = useSidebar();
  const location = useLocation();
  const { isAdmin, isTeamMember, allowedPages, isLoading } = useTeamPermissions();
  const { user } = useAuth();

  const hasAccess = (slug: string) => {
    if (slug === "" || slug === "guia") return true; // Painel and Guia always accessible
    if (isAdmin) return true;
    if (isTeamMember) return allowedPages.includes(slug);
    return true; // Non-team users (direct owners) have access
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-50",
        "flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src={logo} alt="Hub Empresarial" className="w-8 h-8 rounded-lg object-cover" width={32} height={32} />
            <span className="font-semibold text-foreground">Hub Empresarial</span>
          </div>
        )}
        {collapsed && (
          <img src={logo} alt="Hub Empresarial" className="w-8 h-8 rounded-lg object-cover mx-auto" width={32} height={32} />
        )}
        <button
          onClick={toggle}
          aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          className="p-1.5 rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {modules.map((module) => {
            const isActive = location.pathname === module.path;
            const locked = !isLoading && !hasAccess(module.slug);

            if (locked) {
              return (
                <li key={module.path}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-not-allowed opacity-50",
                          "text-sm font-medium text-muted-foreground"
                        )}
                      >
                        <module.icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && (
                          <span className="flex-1">{module.name}</span>
                        )}
                        {!collapsed && <LockIcon className="w-3.5 h-3.5" />}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Você não tem acesso a este módulo. Fale com o administrador.</p>
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            }

            return (
              <li key={module.path}>
                <NavLink
                  to={module.path}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200",
                    "text-sm font-medium",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 rounded-lg bg-primary/10"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <module.icon className={cn("relative w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
                  {!collapsed && <span className="relative">{module.name}</span>}
                </NavLink>
              </li>
            );
          })}

        </ul>
      </nav>

      {/* Notification Bell + User Menu */}
      <div className={cn(
        "border-t border-sidebar-border px-3 py-2",
        collapsed ? "flex flex-col items-center gap-2" : "flex items-center gap-1"
      )}>
        <NotificationBell />
        <ThemeToggle />
        <div className={collapsed ? "" : "ml-auto"}>
          <UserMenu collapsed={collapsed} />
        </div>
      </div>

      {/* Footer */}
      <div className={cn(
        "border-t border-sidebar-border",
        collapsed ? "px-2 py-3 flex flex-col items-center gap-2" : "p-4"
      )}>
        {!collapsed && (
          <div className="text-xs text-muted-foreground mt-2">
            <p>Hub Empresarial v1.0</p>
            <p className="mt-1">Focus Inteligente</p>
          </div>
        )}
      </div>
    </aside>
  );
}
