import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Loader2, ExternalLink, GripVertical, Upload, X, ArrowLeft, ArrowRight, Sparkles, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// CRUD do catálogo. É o que permite publicar produto novo sem depender de código.
const sb = supabase as any;

// Bucket privado (buckets públicos estão bloqueados na política do workspace):
// guardamos URL assinada de longa duração (10 anos) para a imagem aparecer no
// catálogo público sem expor o bucket inteiro.
const BUCKET = "produtos";
const VALIDADE = 60 * 60 * 24 * 365 * 10;

async function enviarImagem(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const caminho = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(caminho, file, { upsert: false });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from(BUCKET).createSignedUrl(caminho, VALIDADE);
  if (e2 || !data?.signedUrl) throw e2 || new Error("Não gerou o link da imagem");
  return data.signedUrl;
}



interface Produto {
  id?: string;
  slug: string;
  nome: string;
  descricao: string | null;
  tipo: "notion" | "playbook" | "lovable" | "advisor";
  gratuito: boolean;
  preco: number | null;
  link_destino: string | null;
  captura_lead: boolean;
  emoji: string | null;
  ordem: number;
  ativo: boolean;
  destaque: boolean;
  capa: string | null;
  imagens: string[];
  detalhes: string | null;
}

const VAZIO: Produto = {
  slug: "", nome: "", descricao: "", tipo: "notion", gratuito: true, preco: null,
  link_destino: "", captura_lead: true, emoji: "📦", ordem: 0, ativo: true, destaque: false,
  capa: null, imagens: [], detalhes: "",
};

const TIPO_LABEL: Record<string, string> = { notion: "Notion", playbook: "Playbook", lovable: "Sistema", advisor: "Advisor" };

// Mesma ordem do catálogo público (SECOES em Central.tsx).
// Advisor tem aba própria ("Fale comigo") para a copy, mas continua listado
// aqui para o dono controlar ativo, capa, preço e link de destino.
const ORDEM_TIPOS: Produto["tipo"][] = ["notion", "playbook", "lovable", "advisor"];

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function ProdutosPanel() {
  const { toast } = useToast();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [subindo, setSubindo] = useState(false);
  const [linkIA, setLinkIA] = useState("");
  const [extraindo, setExtraindo] = useState(false);
  const [excluindo, setExcluindo] = useState<Produto | null>(null);

  const preencherComIA = async () => {
    const url = linkIA.trim();
    if (!url) return toast({ title: "Cole o link do produto", variant: "destructive" });
    setExtraindo(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-produto-info", { body: { url } });
      if (error) throw error;
      if (!data?.nome && !data?.capa) throw new Error("Nada útil veio desse link");
      setEditando({
        ...VAZIO,
        ordem: produtos.length + 1,
        nome: data.nome || "",
        slug: slugify(data.nome || ""),
        descricao: data.descricao ?? "",
        detalhes: data.detalhes ?? "",
        tipo: data.tipo ?? "notion",
        gratuito: data.gratuito ?? true,
        preco: data.preco ?? null,
        emoji: data.emoji || "📦",
        capa: data.capa ?? null,
        imagens: Array.isArray(data.imagens) ? data.imagens : [],
        link_destino: data.link_destino || url,
      });
      setLinkIA("");
      const extras = Array.isArray(data.imagens) ? data.imagens.length : 0;
      toast({
        title: "Rascunho pronto",
        description: data.capa
          ? extras
            ? `Capa + ${extras} imagem(ns) na galeria. Revise e salve.`
            : "Capa encontrada. Revise e salve."
          : "Sem imagem no link — envie uma manualmente.",
      });
    } catch (e: any) {
      toast({
        title: "Não consegui preencher pela IA",
        description: e?.message || "Cadastre manualmente.",
        variant: "destructive",
      });
    } finally {
      setExtraindo(false);
    }
  };


  const carregar = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from("produtos").select("*").order("ordem", { ascending: true });
    setProdutos(((data as Produto[]) || []).map((p) => ({ ...p, imagens: p.imagens ?? [] })));
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const subir = async (files: FileList | null, alvo: "capa" | "galeria") => {
    if (!files?.length || !editando) return;
    setSubindo(true);
    try {
      const urls = await Promise.all(Array.from(files).map(enviarImagem));
      setEditando((prev) => prev && (
        alvo === "capa"
          ? { ...prev, capa: urls[0] }
          : { ...prev, imagens: [...(prev.imagens ?? []), ...urls] }
      ));
    } catch (e: any) {
      toast({ title: "Não subiu a imagem", description: e?.message, variant: "destructive" });
    } finally {
      setSubindo(false);
    }
  };

  const moverImagem = (i: number, dir: -1 | 1) => {
    setEditando((prev) => {
      if (!prev) return prev;
      const arr = [...(prev.imagens ?? [])];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return prev;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...prev, imagens: arr };
    });
  };

  const salvar = async () => {
    if (!editando) return;
    const p = { ...editando };
    if (!p.nome.trim()) return toast({ title: "Dê um nome ao produto", variant: "destructive" });
    if (!p.slug.trim()) p.slug = slugify(p.nome);
    if (!p.gratuito && (p.preco == null || Number(p.preco) <= 0)) {
      return toast({ title: "Produto pago precisa de preço", variant: "destructive" });
    }

    setSalvando(true);
    const payload = {
      slug: p.slug, nome: p.nome.trim(), descricao: p.descricao?.trim() || null,
      tipo: p.tipo, gratuito: p.gratuito, preco: p.gratuito ? null : Number(p.preco),
      link_destino: p.link_destino?.trim() || null, captura_lead: p.captura_lead,
      emoji: p.emoji || null, ordem: Number(p.ordem) || 0, ativo: p.ativo, destaque: p.destaque,
      capa: p.capa || null, imagens: p.imagens ?? [], detalhes: p.detalhes?.trim() || null,
    };

    const { error } = p.id
      ? await sb.from("produtos").update(payload).eq("id", p.id)
      : await sb.from("produtos").insert(payload);

    setSalvando(false);
    if (error) return toast({ title: "Não salvou", description: error.message, variant: "destructive" });
    toast({ title: p.id ? "Produto atualizado" : "Produto criado" });
    setEditando(null);
    carregar();
  };

  const alternarAtivo = async (p: Produto) => {
    setProdutos((prev) => prev.map((x) => (x.id === p.id ? { ...x, ativo: !x.ativo } : x)));
    await sb.from("produtos").update({ ativo: !p.ativo }).eq("id", p.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          O que aparece no catálogo. Desativar tira do ar na hora, sem apagar.
        </p>
        <Button onClick={() => setEditando({ ...VAZIO, ordem: produtos.length + 1 })} className="gap-2">
          <Plus className="w-4 h-4" /> Novo produto
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-2">
          <Label htmlFor="pr-ia">Colar link do produto</Label>
          <div className="flex gap-2 flex-wrap">
            <Input
              id="pr-ia"
              value={linkIA}
              onChange={(e) => setLinkIA(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !extraindo) preencherComIA(); }}
              placeholder="https://…"
              className="flex-1 min-w-[220px]"
            />
            <Button onClick={preencherComIA} disabled={extraindo} variant="secondary" className="gap-2">
              {extraindo ? <><Loader2 className="w-4 h-4 animate-spin" /> Lendo…</> : <><Sparkles className="w-4 h-4" /> Preencher com IA</>}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            A IA lê a página e monta um rascunho (nome, descrição, detalhes e capa). Nada é salvo sem você confirmar.
          </p>
        </CardContent>
      </Card>



      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : produtos.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">
          Nenhum produto ainda. Crie o primeiro.
        </CardContent></Card>
      ) : (
        <div className="space-y-6">
          {ORDEM_TIPOS.map((tipo) => {
            const grupo = produtos.filter((p) => p.tipo === tipo);
            return (
              <div key={tipo} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{TIPO_LABEL[tipo]}</h3>
                  <span className="text-xs text-muted-foreground">{grupo.length}</span>
                </div>
                {grupo.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum produto nessa categoria.</p>
                ) : grupo.map((p) => (
                  <Card key={p.id} className={p.ativo ? "" : "opacity-60"}>
                    <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                      <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                      <span className="text-2xl leading-none">{p.emoji || "📦"}</span>

                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">{p.nome}</span>
                          <Badge variant="outline" className="text-[10px]">{TIPO_LABEL[p.tipo] || p.tipo}</Badge>
                          {p.destaque && <Badge variant="secondary" className="text-[10px]">Destaque</Badge>}
                          {!p.ativo && <Badge variant="outline" className="text-[10px] text-muted-foreground">Fora do ar</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                          /{p.slug} · {p.gratuito ? "grátis" : `R$ ${Number(p.preco).toLocaleString("pt-BR")}`}
                          {p.captura_lead ? " · captura e-mail" : " · vai direto"}
                        </p>
                      </div>

                      {p.link_destino && (
                        <a href={p.link_destino} target="_blank" rel="noopener noreferrer"
                           className="text-muted-foreground hover:text-primary transition-colors" title="Abrir destino">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <Switch checked={p.ativo} onCheckedChange={() => alternarAtivo(p)} />
                      <Button variant="outline" size="sm" onClick={() => setEditando(p)} className="gap-1.5">
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!editando} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl tracking-tight">
              {editando?.id ? "Editar produto" : "Novo produto"}
            </DialogTitle>
          </DialogHeader>

          {editando && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-[80px_1fr] gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pr-emoji">Ícone</Label>
                  <Input id="pr-emoji" value={editando.emoji ?? ""} maxLength={4}
                    onChange={(e) => setEditando({ ...editando, emoji: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pr-nome">Nome *</Label>
                  <Input id="pr-nome" value={editando.nome}
                    onChange={(e) => setEditando({
                      ...editando, nome: e.target.value,
                      slug: editando.id ? editando.slug : slugify(e.target.value),
                    })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pr-desc">Descrição</Label>
                <Textarea id="pr-desc" rows={2} value={editando.descricao ?? ""}
                  onChange={(e) => setEditando({ ...editando, descricao: e.target.value })}
                  placeholder="Uma frase sobre o que resolve" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pr-detalhes">Descrição completa (aparece ao clicar no card)</Label>
                <Textarea id="pr-detalhes" rows={5} value={editando.detalhes ?? ""}
                  onChange={(e) => setEditando({ ...editando, detalhes: e.target.value })}
                  placeholder="O que é, o que vem dentro, para quem serve, valor…" />
              </div>

              <div className="rounded-xl border border-border p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Imagem de capa</Label>
                  <div className="flex items-center gap-3">
                    {editando.capa && (
                      <div className="relative">
                        <img src={editando.capa} alt="Capa" className="h-16 w-24 rounded-lg border border-border object-cover" />
                        <button type="button" onClick={() => setEditando({ ...editando, capa: null })}
                          className="absolute -top-2 -right-2 rounded-full bg-destructive p-0.5 text-destructive-foreground">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
                      <Upload className="w-4 h-4" /> {editando.capa ? "Trocar capa" : "Enviar capa"}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => { subir(e.target.files, "capa"); e.target.value = ""; }} />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Galeria (aparece no detalhe, na ordem abaixo)</Label>
                  <div className="flex flex-wrap gap-3">
                    {(editando.imagens ?? []).map((src, i) => (
                      <div key={src + i} className="relative">
                        <img src={src} alt={`Imagem ${i + 1}`} className="h-16 w-24 rounded-lg border border-border object-cover" />
                        <button type="button"
                          onClick={() => setEditando({ ...editando, imagens: editando.imagens.filter((_, j) => j !== i) })}
                          className="absolute -top-2 -right-2 rounded-full bg-destructive p-0.5 text-destructive-foreground">
                          <X className="w-3 h-3" />
                        </button>
                        <div className="mt-1 flex justify-center gap-1">
                          <button type="button" onClick={() => moverImagem(i, -1)} className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => moverImagem(i, 1)} className="text-muted-foreground hover:text-foreground">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <label className="inline-flex h-16 w-24 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground hover:bg-muted">
                      {subindo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      <input type="file" accept="image/*" multiple className="hidden"
                        onChange={(e) => { subir(e.target.files, "galeria"); e.target.value = ""; }} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Seção do catálogo</Label>
                  <Select value={editando.tipo} onValueChange={(v: any) => setEditando({ ...editando, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="notion">Templates de Notion</SelectItem>
                      <SelectItem value="playbook">Playbooks</SelectItem>
                      <SelectItem value="lovable">Sistemas</SelectItem>
                      <SelectItem value="advisor">Advisor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pr-ordem">Ordem</Label>
                  <Input id="pr-ordem" type="number" value={editando.ordem}
                    onChange={(e) => setEditando({ ...editando, ordem: Number(e.target.value) })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pr-link">Link de destino</Label>
                <Input id="pr-link" value={editando.link_destino ?? ""}
                  onChange={(e) => setEditando({ ...editando, link_destino: e.target.value })}
                  placeholder="Duplicação do template ou link de pagamento" />
              </div>

              <div className="rounded-xl border border-border p-4 space-y-3">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-sm">
                    <span className="font-medium text-foreground">Gratuito</span>
                    <span className="block text-xs text-muted-foreground">Desligue para cobrar</span>
                  </span>
                  <Switch checked={editando.gratuito}
                    onCheckedChange={(v) => setEditando({ ...editando, gratuito: v, preco: v ? null : editando.preco })} />
                </label>

                {!editando.gratuito && (
                  <div className="space-y-1.5">
                    <Label htmlFor="pr-preco">Preço (R$)</Label>
                    <Input id="pr-preco" type="number" step="0.01" value={editando.preco ?? ""}
                      onChange={(e) => setEditando({ ...editando, preco: Number(e.target.value) })} />
                  </div>
                )}

                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-sm">
                    <span className="font-medium text-foreground">Pedir nome e e-mail antes</span>
                    <span className="block text-xs text-muted-foreground">Desligue para mandar direto ao destino</span>
                  </span>
                  <Switch checked={editando.captura_lead}
                    onCheckedChange={(v) => setEditando({ ...editando, captura_lead: v })} />
                </label>

                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-sm font-medium text-foreground">Destaque</span>
                  <Switch checked={editando.destaque}
                    onCheckedChange={(v) => setEditando({ ...editando, destaque: v })} />
                </label>

                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-sm font-medium text-foreground">Visível no catálogo</span>
                  <Switch checked={editando.ativo}
                    onCheckedChange={(v) => setEditando({ ...editando, ativo: v })} />
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditando(null)} disabled={salvando}>Cancelar</Button>
                <Button onClick={salvar} disabled={salvando} className="gap-2">
                  {salvando ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando…</> : "Salvar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
