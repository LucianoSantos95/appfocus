import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlanProvider } from "@/contexts/PlanContext";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DemoDataProvider } from "@/contexts/DemoDataContext";


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
const Assinantes = lazy(() => import("./pages/Assinantes"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OnboardingPage = lazy(() => import("./pages/Onboarding"));

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
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/termos" element={<Termos />} />
                    <Route path="/privacidade" element={<Privacidade />} />
                    <Route path="/planos" element={<Planos />} />
                    <Route path="/glossario" element={<Glossario />} />
                    <Route path="/comparar" element={<Comparar />} />
                    <Route path="/" element={<ProtectedRoute><ErrorBoundary><Index /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/financas" element={<ProtectedRoute><ErrorBoundary><Financas /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/rh" element={<ProtectedRoute><ErrorBoundary><RH /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/marketing" element={<ProtectedRoute><ErrorBoundary><Marketing /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/projetos" element={<ProtectedRoute><ErrorBoundary><Projetos /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/clientes" element={<ProtectedRoute><ErrorBoundary><Clientes /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/atividades" element={<ProtectedRoute><ErrorBoundary><Tarefas /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/processos" element={<ProtectedRoute><ErrorBoundary><Processos /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/guia" element={<ProtectedRoute><ErrorBoundary><Guia /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/onboarding" element={<ProtectedRoute><ErrorBoundary><OnboardingPage /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/assinantes" element={<ProtectedRoute><ErrorBoundary><Assinantes /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
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
