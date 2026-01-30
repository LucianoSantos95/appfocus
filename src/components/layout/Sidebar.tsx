import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

const modules = [
  { name: "Painel", path: "/", icon: LayoutDashboard },
  { name: "Finanças", path: "/financas", icon: DollarSign },
  { name: "RH", path: "/rh", icon: Users },
  { name: "Marketing", path: "/marketing", icon: Megaphone },
  { name: "Projetos", path: "/projetos", icon: FolderKanban },
  { name: "Clientes", path: "/clientes", icon: UserCheck },
  { name: "Atividades", path: "/atividades", icon: ListTodo },
  { name: "Processos", path: "/processos", icon: GitBranch },
  { name: "Guia de Uso", path: "/guia", icon: BookOpen },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

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
            <img src={logo} alt="Hub Empresarial" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-semibold text-foreground">Hub Empresarial</span>
          </div>
        )}
        {collapsed && (
          <img src={logo} alt="Hub Empresarial" className="w-8 h-8 rounded-lg object-cover" />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
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
            return (
              <li key={module.path}>
                <NavLink
                  to={module.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    "text-sm font-medium",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <module.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
                  {!collapsed && <span>{module.name}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-muted-foreground">
            <p>Hub Empresarial v1.0</p>
            <p className="mt-1">Focus Inteligente</p>
          </div>
        </div>
      )}
    </aside>
  );
}
