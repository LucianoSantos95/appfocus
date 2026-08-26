import { Navigate, Link, useSearchParams } from "react-router-dom";
import { PageMeta } from "@/components/seo/PageMeta";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useOwnerAccess } from "@/hooks/useOwnerAccess";
import { ProdutosPanel } from "@/components/admin/ProdutosPanel";
import { LeadsPanel } from "@/components/admin/LeadsPanel";
import { MetricasPanel } from "@/components/admin/MetricasPanel";
import { EmailPanel } from "@/components/admin/EmailPanel";
import { FeedbacksPanel } from "@/components/admin/FeedbacksPanel";
import { ArrowUpRight, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Painel do Hub Central — só o dono. Não usa MainLayout (a sidebar era do
// Hub Empresarial, que saiu do ar); é uma tela própria e enxuta.

export default function Admin() {
  const { isOwner, isLoading } = useOwnerAccess();
  const { signOut } = useAuth();
  const [params, setParams] = useSearchParams();
  const aba = params.get("aba") ?? "produtos";

  if (isLoading) return null;
  if (!isOwner) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <PageMeta path="/admin" title="Admin" suffix="Hub Central" description="Painel administrativo do Hub Central." />

      <header className="border-b border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl tracking-tight text-foreground">Admin</h1>
            <p className="text-xs text-muted-foreground">Hub Central</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link to="/">Ver catálogo <ArrowUpRight className="w-3.5 h-3.5" /></Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-1.5 text-muted-foreground">
              <LogOut className="w-3.5 h-3.5" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Tabs value={aba} onValueChange={(v) => setParams({ aba: v }, { replace: true })}>
          <TabsList>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="metricas">Métricas</TabsTrigger>
            <TabsTrigger value="email">E-mail</TabsTrigger>
            <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
          </TabsList>

          <TabsContent value="produtos" className="mt-6"><ProdutosPanel /></TabsContent>
          <TabsContent value="leads"    className="mt-6"><LeadsPanel /></TabsContent>
          <TabsContent value="metricas" className="mt-6"><MetricasPanel /></TabsContent>
          <TabsContent value="email"    className="mt-6"><EmailPanel /></TabsContent>
          <TabsContent value="feedbacks" className="mt-6"><FeedbacksPanel /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
