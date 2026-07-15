import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Loader2, Sparkles, Plus, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useConteudos } from "@/hooks/useConteudos";

interface Analysis {
  summary?: string;
  topics?: string[];
  gaps?: string[];
  ideas?: { title: string; platform: string }[];
}

/**
 * CompetitorAnalyzer
 * Fase 1.3.A do plano: Firecrawl direto no fluxo de Marketing.
 * O usuário cola a URL de um concorrente e recebe temas + ideias de posts
 * prontas para serem agendadas no calendário editorial, sem sair da tela.
 */
export function CompetitorAnalyzer() {
  const { toast } = useToast();
  const { addConteudo } = useConteudos();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const run = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setAnalysis(null);
    const { data, error } = await supabase.functions.invoke("analyze-competitor", {
      body: { url: url.trim() },
    });
    setLoading(false);

    if (error || !data?.ok) {
      const msg = (data as any)?.error || error?.message || "Falha ao analisar.";
      toast({ title: "Não deu para analisar", description: msg, variant: "destructive" });
      return;
    }
    setAnalysis(data.analysis as Analysis);
  };

  const scheduleIdea = async (idea: { title: string; platform: string }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    await addConteudo({
      title: idea.title,
      platform: idea.platform || "Instagram",
      scheduled_date: dateStr,
      status: "rascunho",
      description: `Ideia sugerida a partir de análise do concorrente ${url}`,
    });
    toast({ title: "Ideia enviada ao calendário", description: `Rascunho criado para ${dateStr}.` });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Search className="w-3.5 h-3.5" />
          Analisar concorrente
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[420px] p-0 bg-card border-border/70"
      >
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Análise de concorrente</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Cole o site de um concorrente. Extraímos os temas dele e sugerimos posts que você ainda não fez.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="https://concorrente.com.br"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-muted border-border h-9 text-sm"
              onKeyDown={(e) => e.key === "Enter" && run()}
            />
            <Button size="sm" onClick={run} disabled={loading || !url.trim()}>
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Analisar"}
            </Button>
          </div>
        </div>

        {loading && (
          <div className="p-6 text-center text-xs text-muted-foreground">
            <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin text-primary" />
            Raspando site e gerando ideias…
          </div>
        )}

        {analysis && !loading && (
          <div className="max-h-[380px] overflow-y-auto p-4 space-y-4">
            {analysis.summary && (
              <p className="text-xs text-muted-foreground italic border-l-2 border-primary/40 pl-3">
                {analysis.summary}
              </p>
            )}

            {analysis.topics && analysis.topics.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                  Temas que ele cobre
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.topics.map((t, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{t}</Badge>
                  ))}
                </div>
              </div>
            )}

            {analysis.gaps && analysis.gaps.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-warning font-semibold mb-1.5 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" /> Lacunas (oportunidade sua)
                </p>
                <ul className="text-xs text-foreground/80 space-y-1 list-disc list-inside">
                  {analysis.gaps.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              </div>
            )}

            {analysis.ideas && analysis.ideas.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-primary font-semibold mb-1.5">
                  Ideias prontas
                </p>
                <div className="space-y-1.5">
                  {analysis.ideas.map((idea, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/40 border border-border/40">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{idea.title}</p>
                        <p className="text-[10px] text-muted-foreground">{idea.platform}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 gap-1 text-primary hover:text-primary"
                        onClick={() => scheduleIdea(idea)}
                      >
                        <Plus className="w-3 h-3" /> Agendar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
