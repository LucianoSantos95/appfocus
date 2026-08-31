import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlanProvider } from "@/contexts/PlanContext";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DemoDataProvider } from "@/contexts/DemoDataContext";
import { PageTransition } from "@/components/motion";

const Auth = lazy(() => import("./pages/Auth"));
const Termos = lazy(() => import("./pages/Termos"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Central = lazy(() => import("./pages/Central"));
const TemplatesNotionGratuitos = lazy(() => import("./pages/TemplatesNotionGratuitos"));
const Admin = lazy(() => import("./pages/Admin"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PlanProvider>
            <SidebarProvider>
              <DemoDataProvider>
              <ErrorBoundary>
                <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                  <PageTransition>
                  <Routes>
                    {/* HUB CENTRAL — o catálogo é a única página pública.
                        O Hub Empresarial (SaaS de 6 módulos) saiu do ar: as
                        páginas foram removidas do projeto, então qualquer URL
                        antiga cai no 404. Sobrevivem: acesso do dono
                        (auth + admin), páginas legais e o consent do Lovable. */}
                    <Route path="/" element={<Central />} />
                    <Route path="/central" element={<Navigate to="/" replace />} />

                    {/* Acesso do dono — necessário pro painel admin */}
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/admin" element={<ProtectedRoute><ErrorBoundary><Admin /></ErrorBoundary></ProtectedRoute>} />

                    {/* Legais — o catálogo coleta nome e e-mail (LGPD) */}
                    <Route path="/termos" element={<Termos />} />
                    <Route path="/privacidade" element={<Privacidade />} />

                    {/* Infra do Lovable/MCP */}
                    <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </PageTransition>
                </Suspense>

              </ErrorBoundary>
              </DemoDataProvider>
            </SidebarProvider>
          </PlanProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
