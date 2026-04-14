import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useSidebar } from "./SidebarContext";
import { UpgradeCTA } from "@/components/plan/UpgradeCTA";
import { AIChatWidget } from "@/components/chat/AIChatWidget";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className={`${collapsed ? "ml-16" : "ml-64"} transition-all duration-300`}>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
      <AIChatWidget />
      <UpgradeCTA />
    </div>
  );
}
  );
}
