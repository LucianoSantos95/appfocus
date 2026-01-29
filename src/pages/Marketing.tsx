import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Megaphone,
  Lightbulb,
  Plus,
  Search,
  ArrowLeft,
  Target,
  TrendingUp,
  Eye,
  MousePointerClick,
  DollarSign,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Campanha {
  id: string;
  name: string;
  objective: string;
  platforms: string[];
  budget: number;
  startDate: string;
  endDate: string;
  status: "ativa" | "pausada" | "finalizada" | "planejada";
  expectedResult: string;
  achievedResult?: string;
  impressions?: number;
  clicks?: number;
  conversions?: number;
}

interface IdeiaConteudo {
  id: string;
  title: string;
  format: string;
  theme: string;
  priority: "alta" | "media" | "baixa";
  status: "ideia" | "producao" | "revisao" | "publicado";
  dueDate: string;
  description?: string;
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
  {
    id: "3",
    name: "Branding Institucional",
    objective: "Aumentar awareness",
    platforms: ["LinkedIn", "YouTube"],
    budget: 3000,
    startDate: "2025-01-01",
    endDate: "2025-03-31",
    status: "ativa",
    expectedResult: "1M impressões",
    achievedResult: "650K impressões",
    impressions: 650000,
    clicks: 12000,
    conversions: 85,
  },
];

const initialIdeias: IdeiaConteudo[] = [
  {
    id: "1",
    title: "5 dicas para aumentar produtividade",
    format: "Carrossel",
    theme: "Produtividade",
    priority: "alta",
    status: "producao",
    dueDate: "2025-01-30",
    description: "Conteúdo focado em dicas práticas para o dia a dia",
  },
  {
    id: "2",
    title: "Case de sucesso: Cliente X",
    format: "Vídeo",
    theme: "Cases",
    priority: "media",
    status: "ideia",
    dueDate: "2025-02-05",
  },
  {
    id: "3",
    title: "Tendências de mercado 2025",
    format: "Artigo",
    theme: "Tendências",
    priority: "alta",
    status: "revisao",
    dueDate: "2025-01-29",
  },
  {
    id: "4",
    title: "Behind the scenes da equipe",
    format: "Reels/Stories",
    theme: "Institucional",
    priority: "baixa",
    status: "ideia",
    dueDate: "2025-02-10",
  },
];

const performanceData = [
  { month: "Set", impressoes: 85000, cliques: 2400, conversoes: 120 },
  { month: "Out", impressoes: 92000, cliques: 2800, conversoes: 145 },
  { month: "Nov", impressoes: 150000, cliques: 4500, conversoes: 280 },
  { month: "Dez", impressoes: 180000, cliques: 5200, conversoes: 350 },
  { month: "Jan", impressoes: 200000, cliques: 6000, conversoes: 405 },
];

const platformData = [
  { name: "Instagram", value: 45, color: "hsl(var(--primary))" },
  { name: "LinkedIn", value: 25, color: "hsl(var(--success))" },
  { name: "Google Ads", value: 20, color: "hsl(var(--warning))" },
  { name: "Email", value: 10, color: "hsl(var(--destructive))" },
];

const statusCampanha = {
  ativa: { label: "Ativa", class: "bg-success/10 text-success" },
  pausada: { label: "Pausada", class: "bg-warning/10 text-warning" },
  finalizada: { label: "Finalizada", class: "bg-muted text-muted-foreground" },
  planejada: { label: "Planejada", class: "bg-primary/10 text-primary" },
};

const statusConteudo = {
  ideia: { label: "Ideia", class: "bg-muted text-muted-foreground" },
  producao: { label: "Em Produção", class: "bg-primary/10 text-primary" },
  revisao: { label: "Em Revisão", class: "bg-warning/10 text-warning" },
  publicado: { label: "Publicado", class: "bg-success/10 text-success" },
};

const priorityStyles = {
  alta: "bg-destructive/10 text-destructive",
  media: "bg-warning/10 text-warning",
  baixa: "bg-success/10 text-success",
};

const platforms = ["Instagram", "Facebook", "LinkedIn", "YouTube", "Google Ads", "TikTok", "Email Marketing", "Twitter/X"];
const formats = ["Carrossel", "Vídeo", "Reels/Stories", "Artigo", "Infográfico", "Podcast", "Webinar", "E-book"];
const themes = ["Produtividade", "Cases", "Tendências", "Institucional", "Produto", "Educacional", "Entretenimento"];

export default function Marketing() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [campanhas, setCampanhas] = useState<Campanha[]>(initialCampanhas);
  const [ideias, setIdeias] = useState<IdeiaConteudo[]>(initialIdeias);

  const campanhasAtivas = campanhas.filter((c) => c.status === "ativa").length;
  const conteudosProducao = ideias.filter(
    (i) => i.status === "producao" || i.status === "revisao"
  ).length;

  const totalImpressions = campanhas.reduce((sum, c) => sum + (c.impressions || 0), 0);
  const totalClicks = campanhas.reduce((sum, c) => sum + (c.clicks || 0), 0);

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="h-9 w-9"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Marketing</h1>
              <p className="text-muted-foreground mt-1">
                Campanhas, conteúdos e performance digital
              </p>
            </div>
          </div>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Target}
            label="Campanhas Ativas"
            value={campanhasAtivas.toString()}
            variant="success"
          />
          <StatCard
            icon={Lightbulb}
            label="Conteúdos em Produção"
            value={conteudosProducao.toString()}
            variant="default"
          />
          <StatCard
            icon={Eye}
            label="Impressões (mês)"
            value={`${(totalImpressions / 1000).toFixed(0)}K`}
            trend={{ value: 15, isPositive: true }}
            variant="default"
          />
          <StatCard
            icon={MousePointerClick}
            label="Cliques (mês)"
            value={totalClicks.toLocaleString("pt-BR")}
            trend={{ value: 8, isPositive: true }}
            variant="default"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 shadow-premium p-6">
            <h3 className="font-semibold text-foreground mb-4">Performance de Marketing</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorImpressoes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="impressoes"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorImpressoes)"
                  name="Impressões"
                />
                <Area
                  type="monotone"
                  dataKey="cliques"
                  stroke="hsl(var(--success))"
                  fillOpacity={0.3}
                  fill="hsl(var(--success))"
                  name="Cliques"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl border border-border/50 shadow-premium p-6">
            <h3 className="font-semibold text-foreground mb-4">Por Plataforma</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value}%`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {platformData.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-muted-foreground">{p.name}</span>
                  </div>
                  <span className="text-foreground font-medium">{p.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="campanhas" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted">
              <TabsTrigger value="campanhas">Campanhas</TabsTrigger>
              <TabsTrigger value="conteudos">Ideias de Conteúdo</TabsTrigger>
              <TabsTrigger value="funil">Funil de Marketing</TabsTrigger>
            </TabsList>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64 bg-muted border-border"
              />
            </div>
          </div>

          <TabsContent value="campanhas" className="space-y-4">
            <div className="flex justify-end">
              <AddCampanhaDialog onAdd={(c) => setCampanhas([c, ...campanhas])} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campanhas.map((c) => (
                <div
                  key={c.id}
                  className="bg-card rounded-xl border border-border/50 shadow-premium p-5 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">{c.name}</p>
                      <p className="text-sm text-muted-foreground">{c.objective}</p>
                    </div>
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        statusCampanha[c.status].class
                      )}
                    >
                      {statusCampanha[c.status].label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {c.platforms.map((p) => (
                      <span key={p} className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                        {p}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Orçamento</p>
                      <p className="text-foreground font-medium">R$ {c.budget.toLocaleString("pt-BR")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Impressões</p>
                      <p className="text-foreground font-medium">{c.impressions ? `${(c.impressions / 1000).toFixed(0)}K` : "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Conversões</p>
                      <p className="text-foreground font-medium">{c.conversions || "-"}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border/50 text-xs text-muted-foreground">
                    {new Date(c.startDate).toLocaleDateString("pt-BR")} - {new Date(c.endDate).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="conteudos" className="space-y-4">
            <div className="flex justify-end">
              <AddIdeiaDialog onAdd={(i) => setIdeias([i, ...ideias])} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ideias.map((i) => (
                <div
                  key={i.id}
                  className="bg-card rounded-xl border border-border/50 shadow-premium p-5 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                      {i.format}
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium capitalize",
                        priorityStyles[i.priority]
                      )}
                    >
                      {i.priority}
                    </span>
                  </div>
                  <p className="font-semibold text-foreground mb-1">{i.title}</p>
                  <p className="text-sm text-muted-foreground mb-3">{i.theme}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        statusConteudo[i.status].class
                      )}
                    >
                      {statusConteudo[i.status].label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(i.dueDate).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="funil" className="space-y-4">
            <div className="bg-card rounded-xl border border-border/50 shadow-premium p-6">
              <h3 className="font-semibold text-foreground mb-6">Funil de Conversão</h3>
              <div className="space-y-4">
                {[
                  { stage: "Visitantes", value: 50000, color: "hsl(var(--primary))", width: "100%" },
                  { stage: "Leads", value: 5000, color: "hsl(var(--success))", width: "60%" },
                  { stage: "MQLs", value: 1500, color: "hsl(var(--warning))", width: "35%" },
                  { stage: "SQLs", value: 500, color: "hsl(var(--destructive))", width: "20%" },
                  { stage: "Clientes", value: 150, color: "hsl(142 76% 36%)", width: "10%" },
                ].map((item) => (
                  <div key={item.stage} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.stage}</span>
                      <span className="text-foreground font-medium">{item.value.toLocaleString("pt-BR")}</span>
                    </div>
                    <div className="h-8 bg-muted rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg transition-all duration-500"
                        style={{ width: item.width, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

function AddCampanhaDialog({ onAdd }: { onAdd: (c: Campanha) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    objective: "",
    platforms: [] as string[],
    budget: "",
    startDate: "",
    endDate: "",
    expectedResult: "",
  });

  const handleSubmit = () => {
    if (!form.name || !form.objective) return;
    
    const campanha: Campanha = {
      id: Date.now().toString(),
      name: form.name,
      objective: form.objective,
      platforms: form.platforms,
      budget: parseFloat(form.budget) || 0,
      startDate: form.startDate,
      endDate: form.endDate,
      status: "planejada",
      expectedResult: form.expectedResult,
    };
    
    onAdd(campanha);
    setForm({ name: "", objective: "", platforms: [], budget: "", startDate: "", endDate: "", expectedResult: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Campanha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Nova Campanha</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Nome da Campanha</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Lançamento Produto X"
              className="bg-muted border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Objetivo</Label>
            <Input
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
              placeholder="Ex: Gerar leads qualificados"
              className="bg-muted border-border"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Orçamento</Label>
              <Input
                type="number"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                placeholder="0,00"
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Meta Esperada</Label>
              <Input
                value={form.expectedResult}
                onChange={(e) => setForm({ ...form, expectedResult: e.target.value })}
                placeholder="Ex: 500 leads"
                className="bg-muted border-border"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="bg-muted border-border"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddIdeiaDialog({ onAdd }: { onAdd: (i: IdeiaConteudo) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    format: "",
    theme: "",
    priority: "media" as "alta" | "media" | "baixa",
    dueDate: "",
    description: "",
  });

  const handleSubmit = () => {
    if (!form.title || !form.format) return;
    
    const ideia: IdeiaConteudo = {
      id: Date.now().toString(),
      title: form.title,
      format: form.format,
      theme: form.theme,
      priority: form.priority,
      status: "ideia",
      dueDate: form.dueDate,
      description: form.description,
    };
    
    onAdd(ideia);
    setForm({ title: "", format: "", theme: "", priority: "media", dueDate: "", description: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Ideia
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Nova Ideia de Conteúdo</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: 5 dicas para..."
              className="bg-muted border-border"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Formato</Label>
              <Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v })}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {formats.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tema</Label>
              <Select value={form.theme} onValueChange={(v) => setForm({ ...form, theme: v })}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {themes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(v: "alta" | "media" | "baixa") => setForm({ ...form, priority: v })}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="bg-muted border-border"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detalhes sobre o conteúdo..."
              className="bg-muted border-border"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
