import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { DemoModule } from "@/lib/demo-data";

interface DemoDataContextValue {
  demoModule: DemoModule | null;
  startDemo: (module: DemoModule) => void;
  clearDemo: () => void;
}

const DemoDataContext = createContext<DemoDataContextValue | undefined>(undefined);

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const [demoModule, setDemoModule] = useState<DemoModule | null>(null);

  const startDemo = useCallback((m: DemoModule) => setDemoModule(m), []);
  const clearDemo = useCallback(() => setDemoModule(null), []);

  return (
    <DemoDataContext.Provider value={{ demoModule, startDemo, clearDemo }}>
      {children}
    </DemoDataContext.Provider>
  );
}

export function useDemoData() {
  const ctx = useContext(DemoDataContext);
  if (!ctx) throw new Error("useDemoData must be used within DemoDataProvider");
  return ctx;
}
