import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useSidebar } from "./SidebarContext";
import { CustomizeCTA } from "@/components/customize/CustomizeCTA";
import { AIChatWidget } from "@/components/chat/AIChatWidget";
import { WowMomentCard } from "@/components/onboarding/WowMomentCard";
import { useDemoData } from "@/contexts/DemoDataContext";
import { useLocation } from "react-router-dom";
import { useSessionHeartbeat } from "@/hooks/useSessionHeartbeat";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { collapsed } = useSidebar();
  const location = useLocation();
  const { pendingWow, clearWow } = useDemoData();
  const isOnboardingRoute = location.pathname === "/onboarding";
  useSessionHeartbeat();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className={`${collapsed ? "ml-16" : "ml-64"} transition-all duration-300`}>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
      {!isOnboardingRoute && <AIChatWidget />}
      {!isOnboardingRoute && <CustomizeCTA />}
      {/* WowMomentCard fires automatically after demo seeding — bottom-right */}
      <WowMomentCard moment={pendingWow} onDismiss={clearWow} />
    </div>
  );
}
