import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Financas from "./pages/Financas";
import RH from "./pages/RH";
import Marketing from "./pages/Marketing";
import Projetos from "./pages/Projetos";
import Compromissos from "./pages/Compromissos";
import Clientes from "./pages/Clientes";
import Atividades from "./pages/Atividades";
import Processos from "./pages/Processos";
import Guia from "./pages/Guia";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/financas" element={<Financas />} />
          <Route path="/rh" element={<RH />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/projetos" element={<Projetos />} />
          <Route path="/compromissos" element={<Compromissos />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/atividades" element={<Atividades />} />
          <Route path="/processos" element={<Processos />} />
          <Route path="/guia" element={<Guia />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
