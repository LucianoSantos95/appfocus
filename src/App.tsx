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
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PlanProvider>
            <SidebarProvider>
              <Suspense fallback={<div className="min-h-screen bg-background" />}>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/termos" element={<Termos />} />
                  <Route path="/privacidade" element={<Privacidade />} />
                  <Route path="/planos" element={<Planos />} />
                  <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                  <Route path="/financas" element={<ProtectedRoute><Financas /></ProtectedRoute>} />
                  <Route path="/rh" element={<ProtectedRoute><RH /></ProtectedRoute>} />
                  <Route path="/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
                  <Route path="/projetos" element={<ProtectedRoute><Projetos /></ProtectedRoute>} />
                  <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
                  <Route path="/atividades" element={<ProtectedRoute><Tarefas /></ProtectedRoute>} />
                  <Route path="/processos" element={<ProtectedRoute><Processos /></ProtectedRoute>} />
                  <Route path="/guia" element={<ProtectedRoute><Guia /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </SidebarProvider>
          </PlanProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
