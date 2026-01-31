import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Send, MessageSquareHeart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const FeedbackWidget = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [avaliacao, setAvaliacao] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mensagem.trim()) {
      toast({
        title: "Mensagem obrigatória",
        description: "Por favor, escreva sua mensagem de feedback.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("feedbacks").insert({
      nome: nome.trim() || null,
      email: email.trim() || null,
      mensagem: mensagem.trim(),
      avaliacao: avaliacao || null,
      pagina: window.location.pathname,
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar seu feedback. Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Obrigado! 🎉",
      description: "Seu feedback foi enviado com sucesso.",
    });

    setSubmitted(true);
    setNome("");
    setEmail("");
    setMensagem("");
    setAvaliacao(0);
  };

  if (submitted) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 text-center">
          <MessageSquareHeart className="h-12 w-12 text-primary mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">Obrigado pelo feedback!</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Sua opinião é muito importante para melhorarmos.
          </p>
          <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
            Enviar outro feedback
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquareHeart className="h-5 w-5 text-primary" />
          Deixe seu Feedback
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-xs">Nome (opcional)</Label>
              <Input
                id="nome"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mensagem" className="text-xs">Mensagem *</Label>
            <Textarea
              id="mensagem"
              placeholder="O que você achou? Sugestões, críticas, elogios..."
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Avaliação (opcional)</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setAvaliacao(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      star <= (hoveredStar || avaliacao)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/40"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? "Enviando..." : "Enviar Feedback"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
