import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageMeta } from "@/components/seo/PageMeta";
import { CustomizeDialog } from "@/components/customize/CustomizeDialog";

// O Hub Empresarial é 100% gratuito. Esta rota era a página de planos pagos;
// agora comunica a gratuidade e captura pedidos de customização.
// A rota /planos foi preservada por causa de links externos e SEO já indexado.

const INCLUSO = [
  "Registros ilimitados em todos os módulos",
  "Finanças, CRM, Projetos, Atividades, RH, Marketing e Processos",
  "Relatórios e exportações",
  "Análises com IA",
  "Integrações (Google, Slack, WhatsApp)",
  "Servidor MCP para conectar sua IA ao Hub",
  "Suporte e atualizações contínuas",
];

const Planos = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <PageMeta
        path="/planos"
        title="Gratuito para sempre"
        description="O Hub Empresarial é 100% gratuito: todos os módulos, relatórios, IA e integrações liberados. Precisa de algo sob medida para sua operação? Conte pra gente."
      />
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8 gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>

        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-5 gap-1.5 px-4 py-1.5 text-sm">
            <Sparkles className="w-3.5 h-3.5" /> Gratuito para sempre
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl leading-tight tracking-tight text-foreground mb-4">
            O Hub inteiro, <span className="gradient-text italic">sem custo</span>.
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Sem plano, sem cartão, sem limite de registros. Tudo o que existe no Hub está liberado
            para a sua operação desde o primeiro dia.
          </p>
        </div>

        {/* O que está incluso */}
        <div className="rounded-2xl border border-border bg-card shadow-premium p-6 md:p-8 mb-8">
          <h2 className="font-display text-xl tracking-tight mb-5">O que você tem acesso</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {INCLUSO.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA de customização */}
        <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.07] to-transparent p-6 md:p-8 text-center">
          <h2 className="font-display text-2xl tracking-tight mb-2">Sua operação precisa de algo próprio?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Se existe um processo que nenhum sistema pronto atende, dá pra construir algo
            sob medida pro seu negócio. Conte a dor da sua operação e a gente conversa.
          </p>
          <Button size="lg" onClick={() => setOpen(true)} className="gap-2 group">
            Quero um sistema sob medida
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Sem cobrança, sem período de teste, sem pegadinha.
        </p>
      </div>

      <CustomizeDialog open={open} onOpenChange={setOpen} origem="planos" />
    </div>
  );
};

export default Planos;
