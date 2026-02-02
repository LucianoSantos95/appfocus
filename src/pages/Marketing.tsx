import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Megaphone,
  Lightbulb,
  Plus,
  Search,
  ArrowLeft,
  Target,
  Eye,
  MousePointerClick,
  Edit,
  Trash2,
  FileSpreadsheet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ImportDialog } from "@/components/import/ImportDialog";
import { importConfigs } from "@/lib/import-configs";
import { useToast } from "@/hooks/use-toast";

interface Campanha {
  id: string;
  name: string;
  objective: string;
  platforms: string[];
  budget: number;
  startDate: string;
  endDate: string;
  status: "ativa" | "planejada" | "recusada" | "finalizada";
  expectedResult: string;
  achievedResult?: string;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  responsible?: string;
}

interface Conteudo {
  id: string;
  title: string;
  format: string;
  theme: string;
  priority: "alta" | "media" | "baixa";
  status: "ideia" | "producao" | "revisao" | "publicado";
  dueDate: string;
  description?: string;
  mediaUrl?: string;
}

interface FunnelItem {
  id: string;
  name: string;
  description: string;
  level: "topo" | "meio" | "fundo";
}

const initialCampanhas: Campanha[] = [
  {
    id: "1",
    name: "Lançamento Produto X",
    objective: "Gerar leads qualificados",
    platforms: ["Instagram", "Facebook", "Google Ads"],
    budget: 5000,
    startDate: "2025-01-15",
    endDate: "2025-02-15",
    status: "ativa",
    expectedResult: "500 leads",
    achievedResult: "320 leads",
    impressions: 150000,
    clicks: 4500,
    conversions: 320,
    responsible: "Maria Santos",
  },
  {
    id: "2",
    name: "Black Friday 2025",
    objective: "Aumentar vendas",
    platforms: ["Instagram", "Email Marketing"],
    budget: 10000,
    startDate: "2025-11-20",
    endDate: "2025-11-30",
    status: "planejada",
    expectedResult: "R$ 100.000 em vendas",
  },
];

const initialConteudos: Conteudo[] = [
  { id: "1", title: "5 dicas para aumentar produtividade", format: "Carrossel", theme: "Produtividade", priority: "alta", status: "producao", dueDate: "2025-01-30", description: "Conteúdo focado em dicas práticas" },
  { id: "2", title: "Case de sucesso: Cliente X", format: "Vídeo", theme: "Cases", priority: "media", status: "ideia", dueDate: "2025-02-05" },
  { id: "3", title: "Tendências de mercado 2025", format: "Artigo", theme: "Tendências", priority: "alta", status: "revisao", dueDate: "2025-01-29" },
  { id: "4", title: "Behind the scenes da equipe", format: "Reels/Stories", theme: "Institucional", priority: "baixa", status: "ideia", dueDate: "2025-02-10" },
];

const initialFunnelItems: FunnelItem[] = [
  { id: "1", name: "Canal YouTube", description: "Vídeos educativos semanais", level: "topo" },
  { id: "2", name: "Blog corporativo", description: "Artigos e conteúdos de valor", level: "topo" },
  { id: "3", name: "Email Marketing", description: "Nutrição de leads", level: "meio" },
  { id: "4", name: "Webinars", description: "Eventos online para qualificação", level: "meio" },
  { id: "5", name: "Consultoria gratuita", description: "Chamadas de diagnóstico", level: "fundo" },
];

const performanceData = [
  { month: "Set", impressoes: 85000, cliques: 2400 },
  { month: "Out", impressoes: 92000, cliques: 2800 },
  { month: "Nov", impressoes: 150000, cliques: 4500 },
  { month: "Dez", impressoes: 180000, cliques: 5200 },
  { month: "Jan", impressoes: 200000, cliques: 6000 },
];

const platformData = [
  { name: "Instagram", value: 45, color: "hsl(var(--primary))" },
  { name: "LinkedIn", value: 25, color: "hsl(var(--success))" },
  { name: "Google Ads", value: 20, color: "hsl(var(--warning))" },
  { name: "Email", value: 10, color: "hsl(var(--destructive))" },
];

const statusCampanha = {
  ativa: { label: "Ativa", class: "bg-success/10 text-success" },
  planejada: { label: "Planejada", class: "bg-primary/10 text-primary" },
  recusada: { label: "Recusada", class: "bg-destructive/10 text-destructive" },
  finalizada: { label: "Finalizada", class: "bg-muted text-muted-foreground" },
};

const statusConteudo = {
  ideia: { label: "Ideia", class: "bg-muted text-muted-foreground" },
  producao: { label: "Em Produção", class: "bg-primary/10 text-primary" },
  revisao: { label: "Em Revisão", class: "bg-warning/10 text-warning" },
  publicado: { label: "Publicado", class: "bg-success/10 text-success" },
};

const priorityStyles = {
  alta: "bg-destructive/10 text-destructive border-destructive/30",
  media: "bg-warning/10 text-warning border-warning/30",
  baixa: "bg-success/10 text-success border-success/30",
};

const platforms = ["Instagram", "Facebook", "LinkedIn", "YouTube", "Google Ads", "TikTok", "Email Marketing", "Twitter/X"];

export default function Marketing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campanhas, setCampanhas] = useState<Campanha[]>(initialCampanhas);
  const [conteudos, setConteudos] = useState<Conteudo[]>(initialConteudos);
  const [funnelItems, setFunnelItems] = useState<FunnelItem[]>(initialFunnelItems);
  const [selectedCampanha, setSelectedCampanha] = useState<Campanha | null>(null);
  const [selectedConteudo, setSelectedConteudo] = useState<Conteudo | null>(null);
  const [funnelDialogOpen, setFunnelDialogOpen] = useState(false);
  const [funnelLevel, setFunnelLevel] = useState<"topo" | "meio" | "fundo">("topo");

  const handleImportCampanhas = (records: Record<string, unknown>[]) => {
    const newCampanhas: Campanha[] = records.map((record, index) => ({
      id: `imported-${Date.now()}-${index}`,
      name: String(record.name || ''),
      objective: String(record.objective || ''),
      platforms: String(record.platforms || '').split(',').map(p => p.trim()).filter(Boolean),
      budget: Number(record.budget) || 0,
      startDate: String(record.startDate || new Date().toISOString().split('T')[0]),
      endDate: String(record.endDate || new Date().toISOString().split('T')[0]),
      status: 'planejada' as const,
      expectedResult: '',
      responsible: String(record.responsible || ''),
    }));
    setCampanhas([...newCampanhas, ...campanhas]);
    toast({
      title: "Importação concluída",
      description: `${newCampanhas.length} campanhas importadas com sucesso.`,
    });
  };

  const handleImportConteudos = (records: Record<string, unknown>[]) => {
    const newConteudos: Conteudo[] = records.map((record, index) => ({
      id: `imported-${Date.now()}-${index}`,
      title: String(record.title || ''),
      format: String(record.format || ''),
      theme: String(record.theme || ''),
      priority: (record.priority === 'alta' ? 'alta' : record.priority === 'baixa' ? 'baixa' : 'media') as 'alta' | 'media' | 'baixa',
      status: 'ideia' as const,
      dueDate: String(record.dueDate || new Date().toISOString().split('T')[0]),
      description: String(record.description || ''),
    }));
    setConteudos([...newConteudos, ...conteudos]);
    toast({
      title: "Importação concluída",
      description: `${newConteudos.length} conteúdos importados com sucesso.`,
    });
  };

  const campanhasAtivas = campanhas.filter((c) => c.status === "ativa").length;
  const conteudosProducao = conteudos.filter((i) => i.status === "producao" || i.status === "revisao").length;
  const totalImpressions = campanhas.reduce((sum, c) => sum + (c.impressions || 0), 0);
  const totalClicks = campanhas.reduce((sum, c) => sum + (c.clicks || 0), 0);

  const handleUpdateCampanha = () => {
    if (!selectedCampanha) return;
    setCampanhas(campanhas.map((c) => c.id === selectedCampanha.id ? selectedCampanha : c));
    setSelectedCampanha(null);
  };

  const handleDeleteCampanha = (id: string) => {
    setCampanhas(campanhas.filter((c) => c.id !== id));
    setSelectedCampanha(null);
  };

  const handleUpdateConteudo = () => {
    if (!selectedConteudo) return;
    setConteudos(conteudos.map((c) => c.id === selectedConteudo.id ? selectedConteudo : c));
    setSelectedConteudo(null);
  };

  const handleDeleteConteudo = (id: string) => {
    setConteudos(conteudos.filter((c) => c.id !== id));
    setSelectedConteudo(null);
  };

  const handleDeleteFunnelItem = (id: string) => {
    setFunnelItems(funnelItems.filter((f) => f.id !== id));
  };

  const handleUpdateFunnelItem = (id: string, name: string, description: string) => {
    setFunnelItems(funnelItems.map((f) => f.id === id ? { ...f, name, description } : f));
  };

  const getConteudosByPriority = (priority: "alta" | "media" | "baixa") => 
    conteudos.filter((c) => c.priority === priority && c.status !== "publicado");

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-9 w-9">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Marketing</h1>
            <p className="text-muted-foreground mt-1">Campanhas, conteúdos e performance digital</p>
          </div>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Target} label="Campanhas Ativas" value={campanhasAtivas.toString()} variant="success" />
          <StatCard icon={Lightbulb} label="Conteúdos em Produção" value={conteudosProducao.toString()} variant="default" />
          <StatCard icon={Eye} label="Impressões (mês)" value={`${(totalImpressions / 1000).toFixed(0)}K`} trend={{ value: 15, isPositive: true }} variant="default" />
          <StatCard icon={MousePointerClick} label="Cliques (mês)" value={totalClicks.toLocaleString("pt-BR")} trend={{ value: 8, isPositive: true }} variant="default" />
        </div>

        {/* Charts - Modern Style */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border/50 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.1)] p-6 transition-all duration-300 hover:shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.15)]">
            <h3 className="font-semibold text-foreground mb-6">Performance de Marketing</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorImpressoesM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="colorCliquesM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border)/0.5)" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--popover))", 
                    border: "1px solid hsl(var(--border))", 
                    borderRadius: "12px",
                    boxShadow: "0 8px 32px -4px hsl(var(--primary)/0.15)",
                  }} 
                />
                <Area type="monotone" dataKey="impressoes" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorImpressoesM)" name="Impressões" />
                <Area type="monotone" dataKey="cliques" stroke="hsl(var(--success))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCliquesM)" name="Cliques" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border/50 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.1)] p-6 transition-all duration-300 hover:shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.15)]">
            <h3 className="font-semibold text-foreground mb-6">Por Plataforma</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <defs>
                  <filter id="pieGlowM">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <Pie 
                  data={platformData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={55} 
                  outerRadius={78} 
                  paddingAngle={4} 
                  dataKey="value"
                  strokeWidth={0}
                  filter="url(#pieGlowM)"
                >
                  {platformData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--popover))", 
                    border: "1px solid hsl(var(--border))", 
                    borderRadius: "12px",
                    boxShadow: "0 8px 32px -4px hsl(var(--primary)/0.15)",
                  }} 
                  formatter={(value: number) => [`${value}%`, ""]} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-5 space-y-2.5">
              {platformData.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}50` }} />
                    <span className="text-muted-foreground">{p.name}</span>
                  </div>
                  <span className="text-foreground font-medium">{p.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SEÇÃO 1: Campanhas */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Campanhas</h2>
            <div className="flex items-center gap-2">
              <ImportDialog
                config={importConfigs.marketing_campanhas}
                onImportComplete={handleImportCampanhas}
                trigger={
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Importar
                  </Button>
                }
              />
              <AddCampanhaDialog onAdd={(c) => setCampanhas([c, ...campanhas])} />
            </div>
          </div>
          
          <Tabs defaultValue="ativa" className="space-y-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="ativa">Ativas</TabsTrigger>
              <TabsTrigger value="planejada">Planejadas</TabsTrigger>
              <TabsTrigger value="recusada">Recusadas</TabsTrigger>
              <TabsTrigger value="finalizada">Finalizadas</TabsTrigger>
            </TabsList>

            {["ativa", "planejada", "recusada", "finalizada"].map((status) => (
              <TabsContent key={status} value={status} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {campanhas.filter((c) => c.status === status).map((c) => (
                    <div key={c.id} onClick={() => setSelectedCampanha(c)} className="bg-card rounded-xl border border-border/50 shadow-premium p-5 hover:border-primary/30 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-foreground">{c.name}</p>
                          <p className="text-sm text-muted-foreground">{c.objective}</p>
                        </div>
                        <span className={cn("text-xs px-2 py-1 rounded-full font-medium", statusCampanha[c.status].class)}>{statusCampanha[c.status].label}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {c.platforms.map((p) => (<span key={p} className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{p}</span>))}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div><p className="text-muted-foreground text-xs">Orçamento</p><p className="text-foreground font-medium">R$ {c.budget.toLocaleString("pt-BR")}</p></div>
                        <div><p className="text-muted-foreground text-xs">Impressões</p><p className="text-foreground font-medium">{c.impressions ? `${(c.impressions / 1000).toFixed(0)}K` : "-"}</p></div>
                        <div><p className="text-muted-foreground text-xs">Conversões</p><p className="text-foreground font-medium">{c.conversions || "-"}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </section>

        {/* SEÇÃO 2: Planejamento de Conteúdo */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Planejamento de Conteúdo</h2>
            <div className="flex items-center gap-2">
              <ImportDialog
                config={importConfigs.marketing_conteudos}
                onImportComplete={handleImportConteudos}
                trigger={
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Importar
                  </Button>
                }
              />
              <AddConteudoDialog onAdd={(c) => setConteudos([c, ...conteudos])} />
            </div>
          </div>
          
          <Tabs defaultValue="lista" className="space-y-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="lista">Lista</TabsTrigger>
              <TabsTrigger value="kanban">Kanban por Prioridade</TabsTrigger>
            </TabsList>

            <TabsContent value="lista" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {conteudos.map((c) => (
                  <div key={c.id} onClick={() => setSelectedConteudo(c)} className="bg-card rounded-xl border border-border/50 shadow-premium p-5 hover:border-primary/30 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{c.format}</span>
                      <span className={cn("text-xs px-2 py-1 rounded-full font-medium capitalize", priorityStyles[c.priority])}>{c.priority}</span>
                    </div>
                    <p className="font-semibold text-foreground mb-1">{c.title}</p>
                    <p className="text-sm text-muted-foreground mb-3">{c.theme}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <span className={cn("text-xs px-2 py-1 rounded-full font-medium", statusConteudo[c.status].class)}>{statusConteudo[c.status].label}</span>
                      <span className="text-xs text-muted-foreground">{new Date(c.dueDate).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="kanban" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["baixa", "media", "alta"] as const).map((priority) => (
                  <div key={priority} className={cn("bg-card rounded-xl border-2 p-4", priorityStyles[priority])}>
                    <h3 className="font-semibold mb-4 capitalize">Prioridade {priority}</h3>
                    <div className="space-y-3">
                      {getConteudosByPriority(priority).map((c) => (
                        <div key={c.id} onClick={() => setSelectedConteudo(c)} className="bg-background rounded-lg p-3 border border-border/50 cursor-pointer hover:shadow-md transition-shadow">
                          <p className="font-medium text-foreground text-sm">{c.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{c.format} • {c.theme}</p>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium mt-2 inline-block", statusConteudo[c.status].class)}>{statusConteudo[c.status].label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* SEÇÃO 3: Funil de Marketing Visual */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Funil de Marketing</h2>
          
          <div className="bg-card rounded-xl border border-border/50 shadow-premium p-6">
            <div className="flex flex-col items-center space-y-4">
              {/* Topo do Funil */}
              <div className="w-full max-w-3xl">
                <div className="relative bg-gradient-to-r from-primary/20 to-primary/30 rounded-t-3xl p-6 border-2 border-primary/40">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-primary text-lg">🎯 TOPO DO FUNIL - Atração</h3>
                    <Button size="sm" variant="outline" onClick={() => { setFunnelLevel("topo"); setFunnelDialogOpen(true); }}>
                      <Plus className="w-4 h-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {funnelItems.filter((f) => f.level === "topo").map((item) => (
                      <FunnelItemCard 
                        key={item.id} 
                        item={item} 
                        onDelete={handleDeleteFunnelItem}
                        onUpdate={handleUpdateFunnelItem}
                        borderColor="border-primary/30"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Meio do Funil */}
              <div className="w-full max-w-2xl">
                <div className="relative bg-gradient-to-r from-warning/20 to-warning/30 p-6 border-2 border-warning/40">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-warning text-lg">💡 MEIO DO FUNIL - Consideração</h3>
                    <Button size="sm" variant="outline" onClick={() => { setFunnelLevel("meio"); setFunnelDialogOpen(true); }}>
                      <Plus className="w-4 h-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {funnelItems.filter((f) => f.level === "meio").map((item) => (
                      <FunnelItemCard 
                        key={item.id} 
                        item={item} 
                        onDelete={handleDeleteFunnelItem}
                        onUpdate={handleUpdateFunnelItem}
                        borderColor="border-warning/30"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Fundo do Funil */}
              <div className="w-full max-w-xl">
                <div className="relative bg-gradient-to-r from-success/20 to-success/30 rounded-b-3xl p-6 border-2 border-success/40">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-success text-lg">🏆 FUNDO DO FUNIL - Conversão</h3>
                    <Button size="sm" variant="outline" onClick={() => { setFunnelLevel("fundo"); setFunnelDialogOpen(true); }}>
                      <Plus className="w-4 h-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {funnelItems.filter((f) => f.level === "fundo").map((item) => (
                      <FunnelItemCard 
                        key={item.id} 
                        item={item} 
                        onDelete={handleDeleteFunnelItem}
                        onUpdate={handleUpdateFunnelItem}
                        borderColor="border-success/30"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dialog para editar Campanha */}
        <Dialog open={!!selectedCampanha} onOpenChange={() => setSelectedCampanha(null)}>
          <DialogContent className="sm:max-w-[600px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Detalhes da Campanha</DialogTitle>
            </DialogHeader>
            {selectedCampanha && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome da Campanha</Label>
                  <Input value={selectedCampanha.name} onChange={(e) => setSelectedCampanha({ ...selectedCampanha, name: e.target.value })} className="bg-muted border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Objetivo</Label>
                  <Textarea value={selectedCampanha.objective} onChange={(e) => setSelectedCampanha({ ...selectedCampanha, objective: e.target.value })} className="bg-muted border-border" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Orçamento</Label>
                    <Input type="number" value={selectedCampanha.budget} onChange={(e) => setSelectedCampanha({ ...selectedCampanha, budget: parseFloat(e.target.value) || 0 })} className="bg-muted border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={selectedCampanha.status} onValueChange={(v: Campanha["status"]) => setSelectedCampanha({ ...selectedCampanha, status: v })}>
                      <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="ativa">Ativa</SelectItem>
                        <SelectItem value="planejada">Planejada</SelectItem>
                        <SelectItem value="recusada">Recusada</SelectItem>
                        <SelectItem value="finalizada">Finalizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Início</Label>
                    <Input type="date" value={selectedCampanha.startDate} onChange={(e) => setSelectedCampanha({ ...selectedCampanha, startDate: e.target.value })} className="bg-muted border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Fim</Label>
                    <Input type="date" value={selectedCampanha.endDate} onChange={(e) => setSelectedCampanha({ ...selectedCampanha, endDate: e.target.value })} className="bg-muted border-border" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Impressões</Label>
                    <Input type="number" value={selectedCampanha.impressions || ""} onChange={(e) => setSelectedCampanha({ ...selectedCampanha, impressions: parseInt(e.target.value) || 0 })} placeholder="0" className="bg-muted border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cliques</Label>
                    <Input type="number" value={selectedCampanha.clicks || ""} onChange={(e) => setSelectedCampanha({ ...selectedCampanha, clicks: parseInt(e.target.value) || 0 })} placeholder="0" className="bg-muted border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label>Conversões</Label>
                    <Input type="number" value={selectedCampanha.conversions || ""} onChange={(e) => setSelectedCampanha({ ...selectedCampanha, conversions: parseInt(e.target.value) || 0 })} placeholder="0" className="bg-muted border-border" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Input value={selectedCampanha.responsible || ""} onChange={(e) => setSelectedCampanha({ ...selectedCampanha, responsible: e.target.value })} placeholder="Nome do responsável" className="bg-muted border-border" />
                </div>
              </div>
            )}
            <div className="flex justify-between pt-4 border-t border-border/50">
              <Button variant="destructive" onClick={() => selectedCampanha && handleDeleteCampanha(selectedCampanha.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSelectedCampanha(null)}>Cancelar</Button>
                <Button onClick={handleUpdateCampanha}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para editar Conteúdo */}
        <Dialog open={!!selectedConteudo} onOpenChange={() => setSelectedConteudo(null)}>
          <DialogContent className="sm:max-w-[500px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Conteúdo</DialogTitle>
            </DialogHeader>
            {selectedConteudo && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={selectedConteudo.title} onChange={(e) => setSelectedConteudo({ ...selectedConteudo, title: e.target.value })} className="bg-muted border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea value={selectedConteudo.description || ""} onChange={(e) => setSelectedConteudo({ ...selectedConteudo, description: e.target.value })} className="bg-muted border-border" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select value={selectedConteudo.priority} onValueChange={(v: Conteudo["priority"]) => setSelectedConteudo({ ...selectedConteudo, priority: v })}>
                      <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="baixa">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={selectedConteudo.status} onValueChange={(v: Conteudo["status"]) => setSelectedConteudo({ ...selectedConteudo, status: v })}>
                      <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="ideia">Ideia</SelectItem>
                        <SelectItem value="producao">Em Produção</SelectItem>
                        <SelectItem value="revisao">Em Revisão</SelectItem>
                        <SelectItem value="publicado">Publicado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>URL da Mídia (imagem, vídeo, artigo)</Label>
                  <Input value={selectedConteudo.mediaUrl || ""} onChange={(e) => setSelectedConteudo({ ...selectedConteudo, mediaUrl: e.target.value })} placeholder="https://exemplo.com/imagem.jpg" className="bg-muted border-border" />
                </div>
              </div>
            )}
            <div className="flex justify-between pt-4 border-t border-border/50">
              <Button variant="destructive" onClick={() => selectedConteudo && handleDeleteConteudo(selectedConteudo.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSelectedConteudo(null)}>Cancelar</Button>
                <Button onClick={handleUpdateConteudo}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para adicionar item no Funil */}
        <AddFunnelItemDialog 
          open={funnelDialogOpen} 
          onOpenChange={setFunnelDialogOpen} 
          level={funnelLevel} 
          onAdd={(item) => setFunnelItems([...funnelItems, item])} 
        />
      </div>
    </MainLayout>
  );
}

function AddCampanhaDialog({ onAdd }: { onAdd: (c: Campanha) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", objective: "", budget: "", startDate: "", endDate: "", responsible: "", impressions: "", clicks: "", conversions: "" });

  const handleSubmit = () => {
    if (!form.name) return;
    const campanha: Campanha = {
      id: Date.now().toString(), name: form.name, objective: form.objective, platforms: ["Instagram"],
      budget: parseFloat(form.budget) || 0, startDate: form.startDate, endDate: form.endDate,
      status: "planejada", expectedResult: "", responsible: form.responsible,
      impressions: parseInt(form.impressions) || 0,
      clicks: parseInt(form.clicks) || 0,
      conversions: parseInt(form.conversions) || 0,
    };
    onAdd(campanha);
    setForm({ name: "", objective: "", budget: "", startDate: "", endDate: "", responsible: "", impressions: "", clicks: "", conversions: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="w-4 h-4" />Nova Campanha</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader><DialogTitle className="text-foreground">Nova Campanha</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Nome da Campanha</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Black Friday 2025" className="bg-muted border-border" />
          </div>
          <div className="space-y-2">
            <Label>Objetivo</Label>
            <Textarea value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} placeholder="Descreva o objetivo..." className="bg-muted border-border" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Orçamento</Label>
              <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0,00" className="bg-muted border-border" />
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} placeholder="Nome" className="bg-muted border-border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="bg-muted border-border" />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="bg-muted border-border" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Impressões</Label>
              <Input type="number" value={form.impressions} onChange={(e) => setForm({ ...form, impressions: e.target.value })} placeholder="0" className="bg-muted border-border" />
            </div>
            <div className="space-y-2">
              <Label>Cliques</Label>
              <Input type="number" value={form.clicks} onChange={(e) => setForm({ ...form, clicks: e.target.value })} placeholder="0" className="bg-muted border-border" />
            </div>
            <div className="space-y-2">
              <Label>Conversões</Label>
              <Input type="number" value={form.conversions} onChange={(e) => setForm({ ...form, conversions: e.target.value })} placeholder="0" className="bg-muted border-border" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={handleSubmit}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddConteudoDialog({ onAdd }: { onAdd: (c: Conteudo) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", format: "Carrossel", theme: "", priority: "media" as "alta" | "media" | "baixa", dueDate: "", description: "", mediaUrl: "" });

  const handleSubmit = () => {
    if (!form.title) return;
    const conteudo: Conteudo = {
      id: Date.now().toString(), title: form.title, format: form.format, theme: form.theme,
      priority: form.priority, status: "ideia", dueDate: form.dueDate, description: form.description,
      mediaUrl: form.mediaUrl,
    };
    onAdd(conteudo);
    setForm({ title: "", format: "Carrossel", theme: "", priority: "media", dueDate: "", description: "", mediaUrl: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="w-4 h-4" />Novo Conteúdo</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader><DialogTitle className="text-foreground">Novo Conteúdo</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título do conteúdo" className="bg-muted border-border" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Formato</Label>
              <Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v })}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Carrossel">Carrossel</SelectItem>
                  <SelectItem value="Vídeo">Vídeo</SelectItem>
                  <SelectItem value="Reels/Stories">Reels/Stories</SelectItem>
                  <SelectItem value="Artigo">Artigo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(v: "alta" | "media" | "baixa") => setForm({ ...form, priority: v })}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>URL da Mídia (imagem, vídeo, artigo)</Label>
            <Input value={form.mediaUrl} onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })} placeholder="https://exemplo.com/imagem.jpg" className="bg-muted border-border" />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={handleSubmit}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddFunnelItemDialog({ open, onOpenChange, level, onAdd }: { open: boolean; onOpenChange: (v: boolean) => void; level: "topo" | "meio" | "fundo"; onAdd: (item: FunnelItem) => void }) {
  const [form, setForm] = useState({ name: "", description: "" });

  const levelLabels = { topo: "Topo do Funil", meio: "Meio do Funil", fundo: "Fundo do Funil" };

  const handleSubmit = () => {
    if (!form.name) return;
    const item: FunnelItem = { id: Date.now().toString(), name: form.name, description: form.description, level };
    onAdd(item);
    setForm({ name: "", description: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border">
        <DialogHeader><DialogTitle className="text-foreground">Adicionar ao {levelLabels[level]}</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Nome do Canal/Processo</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Blog, Webinar, Consultoria" className="bg-muted border-border" />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Breve descrição..." className="bg-muted border-border" />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>Adicionar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FunnelItemCard({ 
  item, 
  onDelete, 
  onUpdate,
  borderColor 
}: { 
  item: FunnelItem; 
  onDelete: (id: string) => void;
  onUpdate: (id: string, name: string, description: string) => void;
  borderColor: string;
}) {
  const [open, setOpen] = useState(false);
  const [editedName, setEditedName] = useState(item.name);
  const [editedDescription, setEditedDescription] = useState(item.description);

  const handleSave = () => {
    onUpdate(item.id, editedName, editedDescription);
    setOpen(false);
  };

  const handleDelete = () => {
    onDelete(item.id);
    setOpen(false);
  };

  return (
    <>
      <div 
        onClick={() => setOpen(true)}
        className={`bg-background rounded-lg px-3 py-2 border ${borderColor} cursor-pointer hover:shadow-md transition-shadow`}
      >
        <p className="text-sm font-medium text-foreground">{item.name}</p>
        <p className="text-xs text-muted-foreground">{item.description}</p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Item do Funil</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input 
                value={editedName} 
                onChange={(e) => setEditedName(e.target.value)} 
                className="bg-muted border-border" 
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea 
                value={editedDescription} 
                onChange={(e) => setEditedDescription(e.target.value)} 
                className="bg-muted border-border" 
              />
            </div>
          </div>
          <div className="flex justify-between pt-4 border-t border-border/50">
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
