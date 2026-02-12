import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const Index = lazy(() => import("./pages/Index"));
const Financas = lazy(() => import("./pages/Financas"));
const RH = lazy(() => import("./pages/RH"));
const Marketing = lazy(() => import("./pages/Marketing"));
const Projetos = lazy(() => import("./pages/Projetos"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Tarefas = lazy(() => import("./pages/Tarefas"));
const Processos = lazy(() => import("./pages/Processos"));
const Guia = lazy(() => import("./pages/Guia"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/financas" element={<Financas />} />
            <Route path="/rh" element={<RH />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/projetos" element={<Projetos />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/atividades" element={<Tarefas />} />
            <Route path="/processos" element={<Processos />} />
            <Route path="/guia" element={<Guia />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
