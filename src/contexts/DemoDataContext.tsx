import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import type { DemoModule } from "@/lib/demo-data";
import type { WowMoment } from "@/components/onboarding/WowMomentCard";

interface DemoDataContextValue {
  demoModule: DemoModule | null;
  startDemo: (module: DemoModule) => void;
  clearDemo: () => void;
  // WowMomentCard — fires on first arrival at the demo module
  pendingWow: WowMoment | null;
  triggerWow: (moment: WowMoment) => void;
  clearWow: () => void;
  // Coupon spotlight — activates 45s after demo starts, once user has seen value
  couponSpotlightActive: boolean;
  dismissCouponSpotlight: () => void;
}

const DemoDataContext = createContext<DemoDataContextValue | undefined>(undefined);

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const [demoModule, setDemoModule] = useState<DemoModule | null>(null);
  const [pendingWow, setPendingWow] = useState<WowMoment | null>(null);
  const [couponSpotlightActive, setCouponSpotlightActive] = useState(false);
  const spotlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startDemo = useCallback((m: DemoModule) => {
    setDemoModule(m);
    // Activate the coupon spotlight after 45s — user has had time to see value first
    if (spotlightTimerRef.current) clearTimeout(spotlightTimerRef.current);
    spotlightTimerRef.current = setTimeout(() => setCouponSpotlightActive(true), 45_000);
  }, []);

  const clearDemo = useCallback(() => {
    setDemoModule(null);
    setPendingWow(null);
    setCouponSpotlightActive(false);
    if (spotlightTimerRef.current) clearTimeout(spotlightTimerRef.current);
  }, []);

  const triggerWow = useCallback((moment: WowMoment) => {
    // Small delay so the destination page is fully rendered before confetti fires
    setTimeout(() => setPendingWow(moment), 1_200);
  }, []);

  const clearWow = useCallback(() => setPendingWow(null), []);

  const dismissCouponSpotlight = useCallback(() => setCouponSpotlightActive(false), []);

  return (
    <DemoDataContext.Provider value={{
      demoModule, startDemo, clearDemo,
      pendingWow, triggerWow, clearWow,
      couponSpotlightActive, dismissCouponSpotlight,
    }}>
      {children}
    </DemoDataContext.Provider>
  );
}

export function useDemoData() {
  const ctx = useContext(DemoDataContext);
  if (!ctx) throw new Error("useDemoData must be used within DemoDataProvider");
  return ctx;
}
