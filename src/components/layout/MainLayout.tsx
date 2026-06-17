import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useSidebar } from "./SidebarContext";
import { UpgradeCTA } from "@/components/plan/UpgradeCTA";
import { AIChatWidget } from "@/components/chat/AIChatWidget";
import { DemoCouponBanner } from "@/components/onboarding/DemoCouponBanner";
import { WowMomentCard } from "@/components/onboarding/WowMomentCard";
import { useDemoData } from "@/contexts/DemoDataContext";
import { useLocation } from "react-router-dom";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { collapsed } = useSidebar();
  const location = useLocation();
  const { demoModule, pendingWow, clearWow } = useDemoData();
  const isOnboardingRoute = location.pathname === "/onboarding";

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className={`${collapsed ? "ml-16" : "ml-64"} transition-all duration-300`}>
        {demoModule && !isOnboardingRoute && <DemoCouponBanner />}
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
      {!isOnboardingRoute && <AIChatWidget />}
      {!isOnboardingRoute && <UpgradeCTA />}
      {/* WowMomentCard fires automatically after demo seeding — bottom-right */}
      <WowMomentCard moment={pendingWow} onDismiss={clearWow} />
    </div>
  );
}
