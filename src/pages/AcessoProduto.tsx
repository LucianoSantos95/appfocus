import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

// Página de acesso pós-compra. O token vem no successUrl do checkout Asaas e no
// e-mail de entrega. O link só é revelado quando o webhook confirma o pagamento.
const sb = supabase as any;

interface Compra {
  produto_nome: string | null;
  produto_slug: string | null;
  status: string;
  nome: string | null;
  link_entrega: string | null;
}

export default function AcessoProduto() {
  const { token } = useParams<{ token: string }>();
  const [compra, setCompra] = useState<Compra | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrada, setNaoEncontrada] = useState(false);

  const buscar = useCallback(async () => {
    if (!token) return;
    const { data } = await sb.rpc("compra_por_token", { p_token: token });
    const linha = Array.isArray(data) ? data[0] : data;
    if (!linha) setNaoEncontrada(true);
    else setCompra(linha as Compra);
    setCarregando(false);
  }, [token]);

  useEffect(() => { buscar(); }, [buscar]);

  // Pagamento por Pix/boleto pode demorar: recarrega sozinho enquanto pendente.
  useEffect(() => {
    if (!compra || compra.status !== "pendente") return;
    const id = setInterval(buscar, 8000);
    return () => clearInterval(id);
  }, [compra, buscar]);

  const pago = compra?.status === "pago";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-16">
      <PageMeta path="/acesso" title="Seu acesso" suffix="Hub Central" description="Acesso ao produto comprado no Hub Central." noindex />

      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        {carregando ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm">Conferindo sua compra…</p>
          </div>
        ) : naoEncontrada ? (
          <div className="flex flex-col items-center gap-3">
            <XCircle className="w-10 h-10 text-destructive" />
            <h1 className="font-grotesk text-2xl font-extrabold tracking-tight">Link inválido</h1>
            <p className="text-sm text-muted-foreground">
              Este link de acesso não existe mais. Se você pagou e não conseguiu abrir,
              fale com a gente pelo catálogo.
            </p>
            <Button asChild variant="outline" className="mt-2"><Link to="/">Voltar ao catálogo</Link></Button>
          </div>
        ) : pago ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-success" />
            </div>
            <h1 className="font-grotesk text-2xl font-extrabold tracking-tight">
              Pagamento confirmado
            </h1>
            <p className="text-sm text-muted-foreground">
              {compra?.nome ? `${compra.nome}, seu ` : "Seu "}acesso a{" "}
              <strong className="text-foreground">{compra?.produto_nome ?? "seu produto"}</strong> está liberado.
              Também mandamos por e-mail.
            </p>
            {compra?.link_entrega ? (
              <Button asChild className="mt-2 rounded-full gap-2">
                <a href={compra.link_entrega} target="_blank" rel="noopener noreferrer">
                  Abrir agora <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                O link ainda está sendo preparado. Você recebe por e-mail em instantes.
              </p>
            )}
            <Button asChild variant="ghost" className="text-muted-foreground"><Link to="/">Ver o catálogo</Link></Button>
          </div>
        ) : compra?.status === "estornado" ? (
          <div className="flex flex-col items-center gap-3">
            <XCircle className="w-10 h-10 text-destructive" />
            <h1 className="font-grotesk text-2xl font-extrabold tracking-tight">Compra cancelada</h1>
            <p className="text-sm text-muted-foreground">
              Este pagamento foi estornado, então o acesso foi encerrado.
            </p>
            <Button asChild variant="outline" className="mt-2"><Link to="/">Voltar ao catálogo</Link></Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <Clock className="w-7 h-7 text-muted-foreground" />
            </div>
            <h1 className="font-grotesk text-2xl font-extrabold tracking-tight">
              Aguardando o pagamento
            </h1>
            <p className="text-sm text-muted-foreground">
              Assim que o pagamento de <strong className="text-foreground">{compra?.produto_nome ?? "seu produto"}</strong>{" "}
              cair, o acesso aparece aqui automaticamente — pode deixar esta página aberta.
              No Pix costuma levar segundos; no boleto, até 2 dias úteis.
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verificando…
            </div>
            <Button asChild variant="ghost" className="text-muted-foreground"><Link to="/">Ver o catálogo</Link></Button>
          </div>
        )}
      </div>
    </div>
  );
}
