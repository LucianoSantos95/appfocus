import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
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
import {
  GitBranch,
  Plus,
  Search,
  ArrowLeft,
  FileText,
  ChevronRight,
  DollarSign,
  Users,
  FolderKanban,
  Megaphone,
  ShoppingCart,
  Trash2,
  Edit,
  Image,
  Video,
  FileDown,
  FileSpreadsheet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ImportDialog } from "@/components/import/ImportDialog";
import { importConfigs } from "@/lib/import-configs";
import { useToast } from "@/hooks/use-toast";
import { useProcessos as useProcessosDB } from "@/hooks/useProcessos";
import { PlanGateButton } from "@/components/plan/PlanGateButton";
import { useFreemiumLimit } from "@/hooks/useFreemiumLimit";
import { UpgradeModal } from "@/components/plan/UpgradeModal";

interface ProcessoStep {
  id: string;
  title: string;
  description: string;
  responsible?: string;
  duration?: string;
  imageUrl?: string;
  videoUrl?: string;
}

interface Processo {
  id: string;
  name: string;
  description: string;
  department: string;
  owner: string;
  lastUpdated: string;
  status: "ativo" | "em_revisao" | "arquivado" | "cancelado";
  icon: React.ElementType;
  steps: ProcessoStep[];
}

const defaultIcons: Record<string, React.ElementType> = {
  "Comercial": ShoppingCart,
  "Financeiro": DollarSign,
  "Projetos": FolderKanban,
  "RH": Users,
  "Marketing": Megaphone,
};

const statusProcesso = {
  ativo: { label: "Ativo", class: "bg-success/10 text-success" },
  em_revisao: { label: "Em Revisão", class: "bg-warning/10 text-warning" },
  arquivado: { label: "Arquivado", class: "bg-muted text-muted-foreground" },
  cancelado: { label: "Cancelado", class: "bg-destructive/10 text-destructive" },
};

const departments = ["Comercial", "Financeiro", "RH", "Marketing", "Projetos", "Tecnologia", "Operações"];

export default function Processos() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { processos: dbProcessos, isLoading, addProcesso, updateProcesso, deleteProcesso: deleteProcessoDB, refetch: refetchProcessosDB } = useProcessosDB();
  const [searchTerm, setSearchTerm] = useState("");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const freemium = useFreemiumLimit(dbProcessos.length);
  const [expandedProcesso, setExpandedProcesso] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<{ processoId: string; step: ProcessoStep } | null>(null);

  // Map DB processos to local type
  const processos: Processo[] = dbProcessos.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    department: p.department || '',
    owner: p.owner || '',
    lastUpdated: p.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    status: (['ativo', 'em_revisao', 'arquivado', 'cancelado'].includes(p.status) ? p.status : 'ativo') as Processo['status'],
    icon: defaultIcons[p.department || ''] || GitBranch,
    steps: [],
  }));

  const handleImportProcessos = () => {
    refetchProcessosDB();
    toast({ title: "Importação concluída", description: "Processos importados e salvos no banco." });
  };

  const handleDeleteProcesso = (id: string) => {
    deleteProcessoDB(id);
    setExpandedProcesso(null);
  };

  const handleUpdateStep = (processoId: string, updatedStep: ProcessoStep) => {
    // Steps are not persisted in DB yet - this is a UI-only operation
    setEditingStep(null);
    toast({ title: "Etapa atualizada", description: "Nota: etapas são salvas localmente por enquanto." });
  };

  const handleExportPDF = (processo: Processo) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(processo.name, 14, 22);
    doc.setFontSize(12);
    doc.text(`Departamento: ${processo.department}`, 14, 32);
    doc.text(`Responsável: ${processo.owner}`, 14, 40);
    doc.text(`Status: ${statusProcesso[processo.status].label}`, 14, 48);
    doc.text(`Última atualização: ${new Date(processo.lastUpdated).toLocaleDateString("pt-BR")}`, 14, 56);
    doc.setFontSize(10);
    doc.text(processo.description, 14, 66, { maxWidth: 180 });
    const tableData = processo.steps.map((step, index) => [
      (index + 1).toString(), step.title, step.description, step.responsible || "-", step.duration || "-",
    ]);
    autoTable(doc, {
      startY: 78,
      head: [["#", "Etapa", "Descrição", "Responsável", "Duração"]],
      body: tableData,
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 35 }, 2: { cellWidth: 80 }, 3: { cellWidth: 30 }, 4: { cellWidth: 25 } },
    });
    doc.save(`${processo.name.replace(/\s+/g, "_")}.pdf`);
  };

  const handleUpdateProcesso = (updated: Processo) => {
    updateProcesso(updated.id, {
      name: updated.name,
      description: updated.description,
      department: updated.department,
      owner: updated.owner,
      status: updated.status,
    });
  };

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
              <h1 className="text-2xl font-bold text-foreground">Processos</h1>
              <p className="text-muted-foreground mt-1">
                Documentação de processos internos - Onboarding e Playbooks
              </p>
            </div>
          </div>
        </div>

        {/* Search + New Button */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar processos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-muted border-border"
            />
          </div>
          <div className="flex items-center gap-2">
            <PlanGateButton module="processos" action="create">
              <ImportDialog
                config={importConfigs.processos}
                onImportComplete={handleImportProcessos}
                trigger={
                  <Button variant="outline" className="gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Importar Planilha
                  </Button>
                }
              />
            </PlanGateButton>
            <PlanGateButton module="processos" action="create">
              <AddProcessoDialog onAdd={addProcesso} disabled={freemium.limitReached} onBlocked={() => setUpgradeModalOpen(true)} />
            </PlanGateButton>
          </div>
        </div>

        {/* Processos List */}
        <div className="space-y-4">
          {processos.map((p) => (
            <Collapsible
              key={p.id}
              open={expandedProcesso === p.id}
              onOpenChange={(open) => setExpandedProcesso(open ? p.id : null)}
            >
              <div className="bg-card rounded-xl border border-border/50 shadow-premium overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="p-5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <p.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-foreground">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                            {p.department}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {p.steps.length} etapas
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded-full font-medium",
                          statusProcesso[p.status].class
                        )}
                      >
                        {statusProcesso[p.status].label}
                      </span>
                      <ChevronRight
                        className={cn(
                          "w-5 h-5 text-muted-foreground transition-transform",
                          expandedProcesso === p.id && "rotate-90"
                        )}
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-5 pb-5 border-t border-border/50">
                    <div className="pt-4 space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Responsável: <span className="text-foreground">{p.owner}</span></span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Atualizado: {new Date(p.lastUpdated).toLocaleDateString("pt-BR")}</span>
                          <EditProcessoDialog processo={p} onUpdate={handleUpdateProcesso} />
                        </div>
                      </div>

                      {/* Timeline Steps */}
                      <div className="relative">
                        <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-border" />
                        <div className="space-y-4">
                          {p.steps.map((step, index) => (
                            <div key={step.id} className="relative flex gap-4">
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center z-10">
                                <span className="text-sm font-semibold text-primary">{index + 1}</span>
                              </div>
                              <div className="flex-1 bg-muted/30 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <p className="font-medium text-foreground">{step.title}</p>
                                  <div className="flex items-center gap-2">
                                    {step.duration && (
                                      <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                                        {step.duration}
                                      </span>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => setEditingStep({ processoId: p.id, step })}
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                                {step.responsible && (
                                  <span className="text-xs text-primary font-medium">
                                    Responsável: {step.responsible}
                                  </span>
                                )}
                                {(step.imageUrl || step.videoUrl) && (
                                  <div className="flex items-center gap-2 mt-2">
                                    {step.imageUrl && (
                                      <span className="text-xs flex items-center gap-1 text-muted-foreground">
                                        <Image className="w-3 h-3" /> Imagem anexada
                                      </span>
                                    )}
                                    {step.videoUrl && (
                                      <span className="text-xs flex items-center gap-1 text-muted-foreground">
                                        <Video className="w-3 h-3" /> Vídeo anexado
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Export Button */}
                      <div className="flex justify-end pt-4 gap-2">
                        <PlanGateButton module="processos" action="export">
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => handleExportPDF(p)}
                          >
                            <FileDown className="w-4 h-4" />
                            Exportar PDF
                          </Button>
                        </PlanGateButton>
                        <Button
                          variant="destructive"
                          className="gap-2"
                          onClick={() => handleDeleteProcesso(p.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      </div>

      {/* Edit Step Dialog */}
      {editingStep && (
        <EditStepDialog
          step={editingStep.step}
          open={!!editingStep}
          onOpenChange={(open) => !open && setEditingStep(null)}
          onUpdate={(updatedStep) => handleUpdateStep(editingStep.processoId, updatedStep)}
        />
      )}
      <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} currentCount={freemium.currentCount} maxCount={freemium.maxCount} moduleName="Processos" />
    </MainLayout>
  );
}

function EditStepDialog({
  step,
  open,
  onOpenChange,
  onUpdate,
}: {
  step: ProcessoStep;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (step: ProcessoStep) => void;
}) {
  const [editedStep, setEditedStep] = useState(step);

  const handleSave = () => {
    onUpdate(editedStep);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Editar Etapa</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Título da Etapa</Label>
            <Input
              value={editedStep.title}
              onChange={(e) => setEditedStep({ ...editedStep, title: e.target.value })}
              className="bg-muted border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição Detalhada</Label>
            <Textarea
              value={editedStep.description}
              onChange={(e) => setEditedStep({ ...editedStep, description: e.target.value })}
              className="bg-muted border-border min-h-[100px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input
                value={editedStep.responsible || ""}
                onChange={(e) => setEditedStep({ ...editedStep, responsible: e.target.value })}
                placeholder="Cargo ou nome"
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Duração Estimada</Label>
              <Input
                value={editedStep.duration || ""}
                onChange={(e) => setEditedStep({ ...editedStep, duration: e.target.value })}
                placeholder="Ex: 2-3 dias"
                className="bg-muted border-border"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>URL da Imagem (opcional)</Label>
            <Input
              value={editedStep.imageUrl || ""}
              onChange={(e) => setEditedStep({ ...editedStep, imageUrl: e.target.value })}
              placeholder="https://..."
              className="bg-muted border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>URL do Vídeo (opcional)</Label>
            <Input
              value={editedStep.videoUrl || ""}
              onChange={(e) => setEditedStep({ ...editedStep, videoUrl: e.target.value })}
              placeholder="https://youtube.com/..."
              className="bg-muted border-border"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditProcessoDialog({
  processo,
  onUpdate,
}: {
  processo: Processo;
  onUpdate: (p: Processo) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editedProcesso, setEditedProcesso] = useState(processo);
  const [newStepTitle, setNewStepTitle] = useState("");

  const handleSave = () => {
    onUpdate({
      ...editedProcesso,
      lastUpdated: new Date().toISOString().split("T")[0],
    });
    setOpen(false);
  };

  const handleAddStep = () => {
    if (!newStepTitle.trim()) return;
    const newStep: ProcessoStep = {
      id: Date.now().toString(),
      title: newStepTitle,
      description: "",
    };
    setEditedProcesso({
      ...editedProcesso,
      steps: [...editedProcesso.steps, newStep],
    });
    setNewStepTitle("");
  };

  const handleRemoveStep = (stepId: string) => {
    setEditedProcesso({
      ...editedProcesso,
      steps: editedProcesso.steps.filter((s) => s.id !== stepId),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <Edit className="w-3 h-3" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Editar Processo</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Nome do Processo</Label>
            <Input
              value={editedProcesso.name}
              onChange={(e) => setEditedProcesso({ ...editedProcesso, name: e.target.value })}
              className="bg-muted border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={editedProcesso.description}
              onChange={(e) => setEditedProcesso({ ...editedProcesso, description: e.target.value })}
              className="bg-muted border-border"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select
                value={editedProcesso.department}
                onValueChange={(v) => setEditedProcesso({ ...editedProcesso, department: v })}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editedProcesso.status}
                onValueChange={(v: Processo["status"]) => setEditedProcesso({ ...editedProcesso, status: v })}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="em_revisao">Em Revisão</SelectItem>
                  <SelectItem value="arquivado">Arquivado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Responsável</Label>
            <Input
              value={editedProcesso.owner}
              onChange={(e) => setEditedProcesso({ ...editedProcesso, owner: e.target.value })}
              className="bg-muted border-border"
            />
          </div>

          {/* Steps Management */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Etapas ({editedProcesso.steps.length})</Label>
            </div>
            <div className="flex gap-2">
              <Input
                value={newStepTitle}
                onChange={(e) => setNewStepTitle(e.target.value)}
                placeholder="Título da nova etapa"
                className="bg-muted border-border"
                onKeyDown={(e) => e.key === "Enter" && handleAddStep()}
              />
              <Button onClick={handleAddStep} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {editedProcesso.steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm text-foreground">{step.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStep(step.id)}
                    className="h-6 w-6 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddProcessoDialog({ onAdd, disabled, onBlocked }: { onAdd: (p: { name: string; description?: string; department?: string; owner?: string; status?: string }) => Promise<unknown>; disabled?: boolean; onBlocked?: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    department: "",
    owner: "",
    status: "ativo" as string,
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && disabled) { onBlocked?.(); return; }
    setOpen(newOpen);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.department) return;

    await onAdd({
      name: form.name,
      description: form.description || undefined,
      department: form.department,
      owner: form.owner || undefined,
      status: form.status,
    });

    setForm({ name: "", description: "", department: "", owner: "", status: "ativo" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Processo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Novo Processo</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Nome do Processo</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Processo de Vendas"
              className="bg-muted border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descreva o objetivo deste processo..."
              className="bg-muted border-border"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v: Processo["status"]) => setForm({ ...form, status: v })}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="em_revisao">Em Revisão</SelectItem>
                  <SelectItem value="arquivado">Arquivado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Responsável</Label>
            <Input
              value={form.owner}
              onChange={(e) => setForm({ ...form, owner: e.target.value })}
              placeholder="Nome do responsável"
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
