import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const STORAGE_KEY = "feedback_popup_dismissed";
const POPUP_DELAY = 5000; // 5 seconds

export const FeedbackPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [avaliacao, setAvaliacao] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, POPUP_DELAY);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = (permanent: boolean) => {
    if (permanent) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    setIsOpen(false);
  };

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

    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            💬 Sua opinião é importante!
          </DialogTitle>
          <DialogDescription>
            Estamos em fase de testes. Conte-nos o que você achou até agora.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="popup-nome" className="text-xs">
                Nome (opcional)
              </Label>
              <Input
                id="popup-nome"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="popup-email" className="text-xs">
                Email (opcional)
              </Label>
              <Input
                id="popup-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="popup-mensagem" className="text-xs">
              Mensagem *
            </Label>
            <Textarea
              id="popup-mensagem"
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

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? "Enviando..." : "Enviar"}
            </Button>
          </div>

          <div className="flex justify-center gap-4 pt-2 border-t">
            <button
              type="button"
              onClick={() => handleDismiss(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Lembrar depois
            </button>
            <button
              type="button"
              onClick={() => handleDismiss(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Não mostrar novamente
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
