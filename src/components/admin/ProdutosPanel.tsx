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
import { Plus, Pencil, Loader2, ExternalLink, GripVertical } from "lucide-react";

// CRUD do catálogo. É o que permite publicar produto novo sem depender de código.
const sb = supabase as any;

interface Produto {
  id?: string;
  slug: string;
  nome: string;
  descricao: string | null;
  tipo: "notion" | "lovable" | "advisor";
  gratuito: boolean;
  preco: number | null;
  link_destino: string | null;
  captura_lead: boolean;
  emoji: string | null;
  ordem: number;
  ativo: boolean;
  destaque: boolean;
}

const VAZIO: Produto = {
  slug: "", nome: "", descricao: "", tipo: "notion", gratuito: true, preco: null,
  link_destino: "", captura_lead: true, emoji: "📦", ordem: 0, ativo: true, destaque: false,
};

const TIPO_LABEL: Record<string, string> = { notion: "Notion", lovable: "Sistema", advisor: "Advisor" };

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

  const carregar = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from("produtos").select("*").order("ordem", { ascending: true });
    setProdutos((data as Produto[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

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

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : produtos.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">
          Nenhum produto ainda. Crie o primeiro.
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {produtos.map((p) => (
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Seção do catálogo</Label>
                  <Select value={editando.tipo} onValueChange={(v: any) => setEditando({ ...editando, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="notion">Templates de Notion</SelectItem>
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
