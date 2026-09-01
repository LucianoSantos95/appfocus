import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Star, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageMeta } from "@/components/seo/PageMeta";
import { FeedbackForm } from "@/components/user/FeedbackForm";

// Destino do clique nas estrelas do e-mail de follow-up. A nota já foi salva
// pela function `rate-produto` antes do redirect — aqui só agradecemos e
// oferecemos, opcionalmente, um detalhe por escrito.
export default function AvaliacaoRecebida() {
  const [params] = useSearchParams();
  const nota = Number(params.get("nota")) || 0;
  const slug = params.get("produto");
  const nome = params.get("nome");
  const [detalhado, setDetalhado] = useState(false);

  return (
    <div data-theme="focus" className="min-h-screen bg-background text-foreground">
      <PageMeta
        path="/avaliacao-recebida"
        title="Avaliação recebida"
        suffix="Hub Central"
        description="Obrigado por avaliar o material do Hub Central."
      />

      <main className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-16">
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-semibold tracking-tight">Nota registrada. Obrigado!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {nome
              ? `Sua avaliação sobre ${nome} já foi contabilizada.`
              : "Sua avaliação já foi contabilizada."}
          </p>

          {nota > 0 && (
            <div className="mt-4 flex justify-center gap-1" aria-label={`Nota ${nota} de 5`}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-6 w-6 ${s <= nota ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`}
                />
              ))}
            </div>
          )}
        </div>

        <Card>
          <CardContent className="p-5">
            {detalhado ? (
              <FeedbackForm
                titulo="Conta um pouco mais (opcional)"
                placeholder="O que funcionou bem? O que faltou?"
                pagina={slug ?? "/avaliacao-recebida"}
                submitLabel="Enviar detalhe"
                onSubmitted={() => setDetalhado(false)}
              />
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-sm text-muted-foreground">
                  Quer detalhar em uma frase? Ajuda muito a decidir o que melhorar.
                </p>
                <Button onClick={() => setDetalhado(true)} className="w-full">
                  Escrever um comentário
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao Hub Central
        </Link>
      </main>
    </div>
  );
}
