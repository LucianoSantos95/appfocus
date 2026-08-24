import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TeamPermissionsProvider } from "@/contexts/TeamPermissionsContext";
import { PlanProvider } from "@/contexts/PlanContext";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DemoDataProvider } from "@/contexts/DemoDataContext";
import { WorldCupOverlay } from "@/components/dashboard/WorldCupOverlay";
import { PageTransition } from "@/components/motion";




const Index = lazy(() => import("./pages/Index"));
const Financas = lazy(() => import("./pages/Financas"));
const RH = lazy(() => import("./pages/RH"));
const Marketing = lazy(() => import("./pages/Marketing"));
const Projetos = lazy(() => import("./pages/Projetos"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Tarefas = lazy(() => import("./pages/Tarefas"));
const Processos = lazy(() => import("./pages/Processos"));
const Guia = lazy(() => import("./pages/Guia"));
const Auth = lazy(() => import("./pages/Auth"));
const Planos = lazy(() => import("./pages/Planos"));
const Termos = lazy(() => import("./pages/Termos"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const Glossario = lazy(() => import("./pages/Glossario"));
const Comparar = lazy(() => import("./pages/Comparar"));
const Mcp = lazy(() => import("./pages/Mcp"));
const OQueEHubEmpresarial = lazy(() => import("./pages/OQueEHubEmpresarial"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OnboardingPage = lazy(() => import("./pages/Onboarding"));
const Central = lazy(() => import("./pages/Central"));
const Admin = lazy(() => import("./pages/Admin"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const DemoEntry = lazy(() => import("./pages/DemoEntry"));
import DemoBanner from "@/components/demo/DemoBanner";

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
          <TeamPermissionsProvider>
          <PlanProvider>
            <SidebarProvider>
              <DemoDataProvider>
              <ErrorBoundary>
                <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                  <DemoBanner />
                  {/* Decoração da Copa isolada em ErrorBoundary próprio:
                      qualquer erro nela é silenciado e nunca derruba o app */}
                  <ErrorBoundary fallback={<></>}>
                    <WorldCupOverlay />
                  </ErrorBoundary>
                  <PageTransition>
                  <Routes>
                    {/* HUB CENTRAL — o catálogo é a página principal.
                        O Hub Empresarial (SaaS de 6 módulos) saiu do ar; tudo o que
                        era dele redireciona pro catálogo. Só sobrevivem: acesso do
                        dono (auth + admin), páginas legais e o consent do Lovable. */}
                    <Route path="/" element={<Central />} />
                    <Route path="/central" element={<Navigate to="/" replace />} />

                    {/* Acesso do dono — necessário pro painel admin */}
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/admin" element={<ProtectedRoute><ErrorBoundary><Admin /></ErrorBoundary></ProtectedRoute>} />
                    {/* Consolidadas no /admin */}
                    <Route path="/leads" element={<Navigate to="/admin?aba=leads" replace />} />
                    <Route path="/usuarios" element={<Navigate to="/admin" replace />} />

                    {/* Legais — o catálogo coleta nome e e-mail (LGPD) */}
                    <Route path="/termos" element={<Termos />} />
                    <Route path="/privacidade" element={<Privacidade />} />

                    {/* Infra do Lovable/MCP */}
                    <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />

                    {/* Aposentadas: páginas de SEO e todos os módulos do Hub.
                        Redirecionam pro catálogo para aproveitar o tráfego. */}
                    {["/mcp", "/comparar", "/glossario", "/blog/o-que-e-hub-empresarial",
                      "/planos", "/demo", "/onboarding", "/guia",
                      "/financas", "/rh", "/marketing", "/projetos",
                      "/clientes", "/atividades", "/processos",
                    ].map((rota) => (
                      <Route key={rota} path={rota} element={<Navigate to="/" replace />} />
                    ))}

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </PageTransition>
                </Suspense>

              </ErrorBoundary>
              </DemoDataProvider>
            </SidebarProvider>
          </PlanProvider>
          </TeamPermissionsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
