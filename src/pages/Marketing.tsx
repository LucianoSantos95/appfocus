import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageMeta } from "@/components/seo/PageMeta";
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
  BarChart3,
  Filter,
  Users,
  X,
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
import { useCampanhas as useCampanhasDB } from "@/hooks/useCampanhas";
import { useClientes } from "@/hooks/useClientes";
import { useCampanhaClientes } from "@/hooks/useCampanhaClientes";
import { PlanGateButton } from "@/components/plan/PlanGateButton";
import { useFreemiumLimit } from "@/hooks/useFreemiumLimit";
import { UpgradeModal } from "@/components/plan/UpgradeModal";
import { MarketingBIPanel } from "@/components/bi/MarketingBIPanel";
import { ContentCalendar } from "@/components/marketing/ContentCalendar";
import { usePlan } from "@/contexts/PlanContext";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
import { Maximize2 } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const PLATFORM_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(210, 70%, 55%)",
  "hsl(280, 60%, 55%)",
  "hsl(30, 80%, 55%)",
  "hsl(170, 60%, 45%)",
];

const platforms = ["Instagram", "Facebook", "LinkedIn", "YouTube", "Google Ads", "TikTok", "Email Marketing", "Twitter/X"];

export default function Marketing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { campanhas: dbCampanhas, isLoading, addCampanha, updateCampanha, deleteCampanha: deleteCampanhaDB, refetch: refetchCampanhasDB } = useCampanhasDB();
  const { clientes } = useClientes();
  const { links: campanhaClienteLinks, addLink: addCampanhaCliente, removeLink: removeCampanhaCliente, getClientesByCampanha } = useCampanhaClientes();
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [biPanelOpen, setBiPanelOpen] = useState(false);
  const [biUpgradeOpen, setBiUpgradeOpen] = useState(false);
  const { plan } = usePlan();
  const { isAdmin } = useTeamPermissions();
  const freemium = useFreemiumLimit(dbCampanhas.length);
  const [funnelItems, setFunnelItems] = useState<FunnelItem[]>([]);
  const [selectedCampanha, setSelectedCampanha] = useState<Campanha | null>(null);
  const [selectedConteudo, setSelectedConteudo] = useState<Conteudo | null>(null);
  const [funnelDialogOpen, setFunnelDialogOpen] = useState(false);
  const [funnelLevel, setFunnelLevel] = useState<"topo" | "meio" | "fundo">("topo");
  const [dragOverPriority, setDragOverPriority] = useState<string | null>(null);
  const [filterClienteId, setFilterClienteId] = useState<string | null>(null);

  // Map DB campanhas to local type
  const campanhas: Campanha[] = dbCampanhas.map(c => ({
    id: c.id,
    name: c.name,
    objective: c.objective || '',
    platforms: c.platforms ? c.platforms.split(',').map(p => p.trim()) : [],
    budget: c.budget || 0,
    startDate: c.start_date || '',
    endDate: c.end_date || '',
    status: (['ativa', 'planejada', 'recusada', 'finalizada'].includes(c.status) ? c.status : 'planejada') as Campanha['status'],
    expectedResult: '',
    responsible: c.responsible || undefined,
  }));

  // Filtered campanhas by client
  const filteredCampanhas = useMemo(() => {
    if (!filterClienteId) return campanhas;
    const campanhaIds = campanhaClienteLinks
      .filter(l => l.cliente_id === filterClienteId)
      .map(l => l.campanha_id);
    return campanhas.filter(c => campanhaIds.includes(c.id));
  }, [campanhas, filterClienteId, campanhaClienteLinks]);

  const handleImportCampanhas = () => {
    refetchCampanhasDB();
    toast({ title: "Importação concluída", description: "Campanhas importadas e salvas no banco." });
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
    toast({ title: "Importação concluída", description: `${newConteudos.length} conteúdos importados com sucesso.` });
  };

  const campanhasAtivas = campanhas.filter((c) => c.status === "ativa").length;
  const conteudosProducao = conteudos.filter((i) => i.status === "producao" || i.status === "revisao").length;
  const totalImpressions = campanhas.reduce((sum, c) => sum + (c.impressions || 0), 0);
  const totalClicks = campanhas.reduce((sum, c) => sum + (c.clicks || 0), 0);

  // Build performance chart from real data (campanhas by month)
  const performanceData = useMemo(() => {
    if (campanhas.length === 0) return [];
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const now = new Date();
    const months: { month: string; campanhas: number; orcamento: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthCampanhas = campanhas.filter(c => {
        if (!c.startDate) return false;
        const cd = new Date(c.startDate);
        return cd.getMonth() === m && cd.getFullYear() === y;
      });
      months.push({
        month: monthNames[m],
        campanhas: monthCampanhas.length,
        orcamento: monthCampanhas.reduce((s, c) => s + c.budget, 0),
      });
    }
    return months;
  }, [campanhas]);

  // Build platform chart from real data
  const platformData = useMemo(() => {
    const platformCount = new Map<string, number>();
    campanhas.forEach(c => {
      c.platforms.forEach(p => {
        platformCount.set(p, (platformCount.get(p) || 0) + 1);
      });
    });
    const total = Array.from(platformCount.values()).reduce((s, v) => s + v, 0);
    if (total === 0) return [];
    return Array.from(platformCount.entries()).map(([name, count], idx) => ({
      name,
      value: Math.round((count / total) * 100),
      color: PLATFORM_COLORS[idx % PLATFORM_COLORS.length],
    }));
  }, [campanhas]);

  const handleUpdateCampanha = () => {
    if (!selectedCampanha) return;
    updateCampanha(selectedCampanha.id, {
      name: selectedCampanha.name,
      objective: selectedCampanha.objective,
      platforms: selectedCampanha.platforms.join(', '),
      budget: selectedCampanha.budget,
      start_date: selectedCampanha.startDate,
      end_date: selectedCampanha.endDate,
      status: selectedCampanha.status,
      responsible: selectedCampanha.responsible,
    });
    setSelectedCampanha(null);
  };

  const handleDeleteCampanha = (id: string) => {
    deleteCampanhaDB(id);
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
      <PageMeta title="Marketing" description="Gerencie campanhas, conteúdos e ideias de marketing para sua empresa." />
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
          <StatCard icon={Eye} label="Total Campanhas" value={campanhas.length.toString()} variant="default" />
          <StatCard icon={MousePointerClick} label="Orçamento Total" value={`R$ ${campanhas.reduce((s, c) => s + c.budget, 0).toLocaleString("pt-BR")}`} variant="default" />
        </div>

        {/* Charts - Modern Style */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border/50 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.1)] p-6 transition-all duration-300 hover:shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.15)]">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Performance de Marketing</h3>
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => { if (plan === "gratuito" && !isAdmin) setBiUpgradeOpen(true); else setBiPanelOpen(true); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                      <Maximize2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Clique para análise detalhada</TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
            <div className="mt-4" />
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorCampanhasM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="colorOrcamentoM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border)/0.5)" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--popover))", 
                      border: "1px solid hsl(var(--border))", 
                      borderRadius: "12px",
                      boxShadow: "0 8px 32px -4px hsl(var(--primary)/0.15)",
                    }} 
                  />
                  <Area type="monotone" dataKey="campanhas" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCampanhasM)" name="Campanhas" />
                  <Area type="monotone" dataKey="orcamento" stroke="hsl(var(--success))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOrcamentoM)" name="Orçamento (R$)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
                <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Adicione campanhas para visualizar a performance</p>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border/50 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.1)] p-6 transition-all duration-300 hover:shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.15)]">
            <h3 className="font-semibold text-foreground mb-6">Por Plataforma</h3>
            {platformData.length > 0 ? (
              <>
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
                        color: "#ffffff",
                      }} 
                      formatter={(value: number) => [`${value}%`, ""]} 
                      labelStyle={{ color: "#ffffff" }}
                      itemStyle={{ color: "#ffffff" }}
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
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <Target className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm text-center">Adicione campanhas com plataformas para ver o gráfico</p>
              </div>
            )}
          </div>
        </div>

        {/* SEÇÃO 1: Campanhas */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Campanhas</h2>
            <div className="flex items-center gap-2">
              {/* Client Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("gap-2", filterClienteId && "border-primary/50 bg-primary/5")}>
                    <Filter className="w-4 h-4" />
                    {filterClienteId ? clientes.find(c => c.id === filterClienteId)?.nome || "Filtro" : "Filtrar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 bg-card border-border p-3" align="end">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">Filtrar por Cliente</p>
                      {filterClienteId && (
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setFilterClienteId(null)}>
                          <X className="w-3 h-3 mr-1" /> Limpar
                        </Button>
                      )}
                    </div>
                    <ScrollArea className="max-h-[200px]">
                      <div className="space-y-1">
                        {clientes.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2 text-center">Nenhum cliente cadastrado</p>
                        ) : clientes.map(cliente => (
                          <button
                            key={cliente.id}
                            onClick={() => setFilterClienteId(filterClienteId === cliente.id ? null : cliente.id)}
                            className={cn(
                              "w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors",
                              filterClienteId === cliente.id
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            {cliente.nome}
                            {cliente.empresa && cliente.empresa !== cliente.nome && (
                              <span className="text-xs text-muted-foreground ml-1">· {cliente.empresa}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
              <PlanGateButton module="marketing" action="create">
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
              </PlanGateButton>
              <PlanGateButton module="marketing" action="create">
                <AddCampanhaDialog onAdd={addCampanha} disabled={freemium.limitReached} onBlocked={() => setUpgradeModalOpen(true)} clientes={clientes.filter(c => c.status === "ativo")} addCampanhaCliente={addCampanhaCliente} />
              </PlanGateButton>
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
                  {filteredCampanhas.filter((c) => c.status === status).length === 0 ? (
                    <p className="text-muted-foreground text-sm col-span-2 text-center py-8">
                      {filterClienteId ? "Nenhuma campanha vinculada a este cliente" : `Nenhuma campanha ${statusCampanha[status as keyof typeof statusCampanha]?.label.toLowerCase()}`}
                    </p>
                  ) : filteredCampanhas.filter((c) => c.status === status).map((c) => {
                    const linkedClientes = getClientesByCampanha(c.id);
                    const linkedClienteNames = linkedClientes.map(cid => clientes.find(cl => cl.id === cid)?.nome).filter(Boolean);
                    return (
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
                      {linkedClienteNames.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {linkedClienteNames.map((name) => (
                            <Badge key={name} variant="outline" className="text-xs bg-primary/5 border-primary/20 text-primary">
                              <Users className="w-3 h-3 mr-1" />{name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div><p className="text-muted-foreground text-xs">Orçamento</p><p className="text-foreground font-medium">R$ {c.budget.toLocaleString("pt-BR")}</p></div>
                        <div><p className="text-muted-foreground text-xs">Início</p><p className="text-foreground font-medium">{c.startDate ? new Date(c.startDate).toLocaleDateString("pt-BR") : "-"}</p></div>
                        <div><p className="text-muted-foreground text-xs">Responsável</p><p className="text-foreground font-medium">{c.responsible || "-"}</p></div>
                      </div>
                    </div>
                    );
                  })}
                
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
              <PlanGateButton module="marketing" action="create">
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
              </PlanGateButton>
              <PlanGateButton module="marketing" action="create">
                <AddConteudoDialog onAdd={(c) => setConteudos([c, ...conteudos])} />
              </PlanGateButton>
            </div>
          </div>

          {/* Priority Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["alta", "media", "baixa"] as const).map((priority) => (
              <div
                key={priority}
                className={cn(
                  "bg-card rounded-xl border border-border/50 p-4 min-h-[200px] transition-colors",
                  dragOverPriority === priority && "border-primary/50 bg-primary/5"
                )}
                onDragOver={(e) => { e.preventDefault(); setDragOverPriority(priority); }}
                onDragLeave={() => setDragOverPriority(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverPriority(null);
                  const id = e.dataTransfer.getData("text/plain");
                  setConteudos(conteudos.map(c => c.id === id ? { ...c, priority } : c));
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium border", priorityStyles[priority])}>
                    {priority === "alta" ? "Alta Prioridade" : priority === "media" ? "Média Prioridade" : "Baixa Prioridade"}
                  </span>
                  <span className="text-xs text-muted-foreground">{getConteudosByPriority(priority).length}</span>
                </div>
                <div className="space-y-2">
                  {getConteudosByPriority(priority).map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)}
                      onClick={() => setSelectedConteudo(c)}
                      className="bg-muted/30 rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <p className="font-medium text-foreground text-sm">{c.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{c.format}</span>
                        <span className={cn("text-xs px-1.5 py-0.5 rounded", statusConteudo[c.status].class)}>{statusConteudo[c.status].label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SEÇÃO: Calendário de Conteúdo */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Calendário de Conteúdo</h2>
          <ContentCalendar />
        </section>

        {/* SEÇÃO 3: Funil */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Funil de Marketing</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["topo", "meio", "fundo"] as const).map((level) => {
              const levelLabels = { topo: "Topo de Funil", meio: "Meio de Funil", fundo: "Fundo de Funil" };
              const levelColors = { topo: "border-primary/30", meio: "border-warning/30", fundo: "border-success/30" };
              const items = funnelItems.filter((f) => f.level === level);
              return (
                <div key={level} className={cn("bg-card rounded-xl border p-4", levelColors[level])}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground text-sm">{levelLabels[level]}</h3>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setFunnelLevel(level); setFunnelDialogOpen(true); }}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="bg-muted/30 rounded-lg p-3 group">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-foreground text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteFunnelItem(item.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Funnel Item Dialog */}
        <Dialog open={funnelDialogOpen} onOpenChange={setFunnelDialogOpen}>
          <DialogContent className="sm:max-w-[400px] bg-card border-border">
            <DialogHeader><DialogTitle className="text-foreground">Novo Item do Funil</DialogTitle></DialogHeader>
            <FunnelItemForm level={funnelLevel} onAdd={(item) => { setFunnelItems([...funnelItems, item]); setFunnelDialogOpen(false); }} />
          </DialogContent>
        </Dialog>

        {/* Campanha Detail Dialog */}
        <Dialog open={!!selectedCampanha} onOpenChange={() => setSelectedCampanha(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto bg-card border-border">
            <DialogHeader><DialogTitle className="text-foreground">Editar Campanha</DialogTitle></DialogHeader>
            {selectedCampanha && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={selectedCampanha.name} onChange={(e) => setSelectedCampanha({ ...selectedCampanha, name: e.target.value })} className="bg-muted border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Objetivo</Label>
                  <Input value={selectedCampanha.objective} onChange={(e) => setSelectedCampanha({ ...selectedCampanha, objective: e.target.value })} className="bg-muted border-border" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Orçamento</Label>
                    <Input type="number" value={selectedCampanha.budget} onChange={(e) => setSelectedCampanha({ ...selectedCampanha, budget: parseFloat(e.target.value) || 0 })} className="bg-muted border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={selectedCampanha.status} onValueChange={(v: Campanha['status']) => setSelectedCampanha({ ...selectedCampanha, status: v })}>
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
                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Input value={selectedCampanha.responsible || ''} onChange={(e) => setSelectedCampanha({ ...selectedCampanha, responsible: e.target.value })} className="bg-muted border-border" />
                </div>
                {/* Client Selector */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Clientes Vinculados</Label>
                  <ScrollArea className="max-h-[250px] border border-border rounded-md p-2">
                    <div className="space-y-1">
                      {clientes.filter(c => c.status === "ativo").length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">Nenhum cliente ativo cadastrado</p>
                      ) : clientes.filter(c => c.status === "ativo").map(cliente => {
                        const isLinked = getClientesByCampanha(selectedCampanha.id).includes(cliente.id);
                        return (
                          <label key={cliente.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer text-sm">
                            <Checkbox
                              checked={isLinked}
                              onCheckedChange={async (checked) => {
                                if (checked) {
                                  await addCampanhaCliente(selectedCampanha.id, cliente.id);
                                } else {
                                  await removeCampanhaCliente(selectedCampanha.id, cliente.id);
                                }
                              }}
                            />
                            <span className="text-foreground">{cliente.nome}</span>
                            <Badge variant="outline" className="text-[10px] ml-auto bg-success/10 text-success border-success/20">Ativo</Badge>
                          </label>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="destructive" onClick={() => selectedCampanha && handleDeleteCampanha(selectedCampanha.id)}>
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSelectedCampanha(null)}>Cancelar</Button>
                <Button onClick={handleUpdateCampanha}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Conteudo Detail Dialog */}
        <Dialog open={!!selectedConteudo} onOpenChange={() => setSelectedConteudo(null)}>
          <DialogContent className="sm:max-w-[500px] bg-card border-border">
            <DialogHeader><DialogTitle className="text-foreground">Editar Conteúdo</DialogTitle></DialogHeader>
            {selectedConteudo && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={selectedConteudo.title} onChange={(e) => setSelectedConteudo({ ...selectedConteudo, title: e.target.value })} className="bg-muted border-border" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Formato</Label>
                    <Input value={selectedConteudo.format} onChange={(e) => setSelectedConteudo({ ...selectedConteudo, format: e.target.value })} className="bg-muted border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tema</Label>
                    <Input value={selectedConteudo.theme} onChange={(e) => setSelectedConteudo({ ...selectedConteudo, theme: e.target.value })} className="bg-muted border-border" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={selectedConteudo.status} onValueChange={(v: Conteudo['status']) => setSelectedConteudo({ ...selectedConteudo, status: v })}>
                      <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="ideia">Ideia</SelectItem>
                        <SelectItem value="producao">Em Produção</SelectItem>
                        <SelectItem value="revisao">Em Revisão</SelectItem>
                        <SelectItem value="publicado">Publicado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select value={selectedConteudo.priority} onValueChange={(v: Conteudo['priority']) => setSelectedConteudo({ ...selectedConteudo, priority: v })}>
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
                  <Label>Data de Entrega</Label>
                  <Input type="date" value={selectedConteudo.dueDate} onChange={(e) => setSelectedConteudo({ ...selectedConteudo, dueDate: e.target.value })} className="bg-muted border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea value={selectedConteudo.description || ''} onChange={(e) => setSelectedConteudo({ ...selectedConteudo, description: e.target.value })} className="bg-muted border-border" />
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="destructive" onClick={() => selectedConteudo && handleDeleteConteudo(selectedConteudo.id)}>
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSelectedConteudo(null)}>Cancelar</Button>
                <Button onClick={handleUpdateConteudo}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} currentCount={freemium.currentCount} maxCount={freemium.maxCount} moduleName="Marketing" />
      <UpgradeModal open={biUpgradeOpen} onOpenChange={setBiUpgradeOpen} currentCount={0} maxCount={0} moduleName="Dashboards de BI" />
      <MarketingBIPanel open={biPanelOpen} onOpenChange={setBiPanelOpen} campanhas={dbCampanhas.map(c => ({ id: c.id, name: c.name, budget: c.budget, platforms: c.platforms, status: c.status, start_date: c.start_date, end_date: c.end_date }))} />
    </MainLayout>
  );
}

// Sub-components

function AddCampanhaDialog({ onAdd, disabled, onBlocked, clientes, addCampanhaCliente }: { onAdd: (input: { name: string; objective?: string; platforms?: string; budget?: number; start_date?: string; end_date?: string; status?: string; responsible?: string }) => Promise<unknown>; disabled?: boolean; onBlocked?: () => void; clientes: { id: string; nome: string }[]; addCampanhaCliente: (campanhaId: string, clienteId: string) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", objective: "", platforms: [] as string[], budget: "", startDate: "", endDate: "", responsible: "" });
  const [selectedClienteIds, setSelectedClienteIds] = useState<string[]>([]);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && disabled) { onBlocked?.(); return; }
    setOpen(newOpen);
    if (!newOpen) setSelectedClienteIds([]);
  };

  const togglePlatform = (p: string) => {
    setForm(f => ({ ...f, platforms: f.platforms.includes(p) ? f.platforms.filter(x => x !== p) : [...f.platforms, p] }));
  };

  const toggleCliente = (id: string) => {
    setSelectedClienteIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (!form.name) return;
    const result = await onAdd({
      name: form.name,
      objective: form.objective || undefined,
      platforms: form.platforms.join(', ') || undefined,
      budget: parseFloat(form.budget) || 0,
      start_date: form.startDate || undefined,
      end_date: form.endDate || undefined,
      status: 'planejada',
      responsible: form.responsible || undefined,
    });
    // Link selected clients to the new campaign
    if (result && typeof result === 'object' && 'id' in result) {
      for (const clienteId of selectedClienteIds) {
        await addCampanhaCliente((result as { id: string }).id, clienteId);
      }
    }
    setForm({ name: "", objective: "", platforms: [], budget: "", startDate: "", endDate: "", responsible: "" });
    setSelectedClienteIds([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="w-4 h-4" />Nova Campanha</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader><DialogTitle className="text-foreground">Nova Campanha</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Nome da Campanha</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Black Friday 2026" className="bg-muted border-border" />
          </div>
          <div className="space-y-2">
            <Label>Objetivo</Label>
            <Input value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} placeholder="Ex: Aumentar vendas em 30%" className="bg-muted border-border" />
          </div>
          <div className="space-y-2">
            <Label>Plataformas</Label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => (
                <button key={p} onClick={() => togglePlatform(p)} className={cn("text-xs px-2 py-1 rounded-full border transition-colors", form.platforms.includes(p) ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border")}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Orçamento</Label>
              <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0,00" className="bg-muted border-border" />
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} className="bg-muted border-border" />
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
          {/* Client Selector */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Clientes Vinculados</Label>
            <ScrollArea className="max-h-[200px] border border-border rounded-md p-2">
              <div className="space-y-1">
                {clientes.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">Nenhum cliente ativo cadastrado</p>
                ) : clientes.map(cliente => (
                  <label key={cliente.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer text-sm">
                    <Checkbox checked={selectedClienteIds.includes(cliente.id)} onCheckedChange={() => toggleCliente(cliente.id)} />
                    <span className="text-foreground">{cliente.nome}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto bg-success/10 text-success border-success/20">Ativo</Badge>
                  </label>
                ))}
              </div>
            </ScrollArea>
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
  const [form, setForm] = useState({ title: "", format: "", theme: "", priority: "media" as Conteudo['priority'], dueDate: "", description: "" });

  const handleSubmit = () => {
    if (!form.title) return;
    onAdd({
      id: Date.now().toString(),
      title: form.title,
      format: form.format,
      theme: form.theme,
      priority: form.priority,
      status: 'ideia',
      dueDate: form.dueDate || new Date().toISOString().split('T')[0],
      description: form.description,
    });
    setForm({ title: "", format: "", theme: "", priority: "media", dueDate: "", description: "" });
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
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-muted border-border" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Formato</Label>
              <Input value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} placeholder="Vídeo, Post, Blog..." className="bg-muted border-border" />
            </div>
            <div className="space-y-2">
              <Label>Tema</Label>
              <Input value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} className="bg-muted border-border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(v: Conteudo['priority']) => setForm({ ...form, priority: v })}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Entrega</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="bg-muted border-border" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-muted border-border" />
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

function FunnelItemForm({ level, onAdd }: { level: "topo" | "meio" | "fundo"; onAdd: (item: FunnelItem) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-muted border-border" />
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-muted border-border" />
      </div>
      <Button onClick={() => { if (!name) return; onAdd({ id: Date.now().toString(), name, description, level }); }}>Adicionar</Button>
    </div>
  );
}
