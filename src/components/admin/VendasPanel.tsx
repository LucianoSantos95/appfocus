import { useCallback, useEffect, useMemo, useState } from "react";
import { buscarTodas } from "@/lib/buscarTodas";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mail, RefreshCw, ShoppingBag } from "lucide-react";

// Vendas dos produtos pagos (tabela compras). Só o dono enxerga.
const sb = supabase as any;

interface Compra {
  id: string;
  produto_nome: string | null;
  produto_slug: string;
  nome: string | null;
  email: string;
  valor: number | null;
  status: string;
  billing_type: string | null;
  created_at: string;
  liberado_em: string | null;
  token_acesso: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  pago: "Pago",
  pendente: "Aguardando pagamento",
  estornado: "Estornado",
};

const PAGAMENTO_LABEL: Record<string, string> = {
  PIX: "Pix",
  BOLETO: "Boleto",
  CREDIT_CARD: "Cartão",
};

const brl = (v: number | null) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dataHora = (s: string | null) =>
  s ? new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

export function VendasPanel() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [reenviando, setReenviando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    const data = await buscarTodas<Compra>(() =>
      sb.from("compras").select("*").order("created_at", { ascending: false }).order("id")).catch(() => [] as Compra[]);
    setCompras(data);
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return compras;
    return compras.filter((c) =>
      [c.nome, c.email, c.produto_nome, c.produto_slug].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [compras, busca]);

  const pagas = compras.filter((c) => c.status === "pago");
  const total = pagas.reduce((s, c) => s + (c.valor ?? 0), 0);

  const reenviar = async (c: Compra) => {
    setReenviando(c.id);
    const { data, error } = await supabase.functions.invoke("reenviar-acesso-produto", {
      body: { compra_id: c.id },
    });
    setReenviando(null);
    if (error || (data as any)?.error) {
      return toast({
        title: "Não reenviei o e-mail",
        description: (data as any)?.error || error?.message,
        variant: "destructive",
      });
    }
    toast({ title: "E-mail reenviado", description: `Acesso enviado de novo para ${c.email}.` });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4">
          <p className="focus-label text-muted-foreground">/ Vendas pagas</p>
          <p className="text-2xl font-extrabold text-foreground">{pagas.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="focus-label text-muted-foreground">/ Faturamento</p>
          <p className="text-2xl font-extrabold text-foreground">{brl(total)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="focus-label text-muted-foreground">/ Aguardando pagamento</p>
          <p className="text-2xl font-extrabold text-foreground">
            {compras.filter((c) => c.status === "pendente").length}
          </p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, e-mail ou produto"
          className="max-w-xs"
        />
        <Button variant="outline" size="sm" onClick={carregar} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-10 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
        </div>
      ) : filtradas.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
          <ShoppingBag className="w-6 h-6" />
          {compras.length === 0 ? "Sem dados — nenhuma compra registrada ainda." : "Nada encontrado com esse termo."}
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtradas.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[220px]">
                  <p className="text-sm font-medium text-foreground">{c.nome || c.email}</p>
                  <p className="text-xs text-muted-foreground">{c.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.produto_nome ?? c.produto_slug} · {dataHora(c.created_at)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{brl(c.valor)}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.billing_type ? PAGAMENTO_LABEL[c.billing_type] ?? c.billing_type : "—"}
                  </p>
                </div>

                <Badge
                  variant={c.status === "pago" ? "default" : "outline"}
                  className={c.status === "estornado" ? "text-destructive border-destructive/40" : ""}
                >
                  {STATUS_LABEL[c.status] ?? c.status}
                </Badge>

                {c.status === "pago" && (
                  <Button
                    variant="outline" size="sm" className="gap-1.5"
                    disabled={reenviando === c.id}
                    onClick={() => reenviar(c)}
                  >
                    {reenviando === c.id
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando…</>
                      : <><Mail className="w-3.5 h-3.5" /> Reenviar acesso</>}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
