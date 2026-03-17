import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";

interface MfaChallengeProps {
  onVerified: () => void;
}

export function MfaChallenge({ onVerified }: MfaChallengeProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);

  useEffect(() => {
    const getFactorId = async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = data?.totp.find((f) => f.status === "verified");
      if (verified) {
        setFactorId(verified.id);
      }
    };
    getFactorId();
  }, []);

  const handleVerify = async () => {
    if (!factorId || code.length !== 6) {
      setError("Insira o código de 6 dígitos");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });
      if (verifyError) throw verifyError;

      onVerified();
    } catch (err: any) {
      setError("Código inválido. Tente novamente.");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm glass rounded-2xl p-8 shadow-premium space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Verificação em duas etapas</h2>
          <p className="text-sm text-muted-foreground">
            Insira o código do seu app autenticador para continuar.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Código de verificação</Label>
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            placeholder="000000"
            maxLength={6}
            className="text-center text-xl tracking-[0.3em] font-mono"
            autoFocus
          />
          {error && <p className="text-xs text-destructive text-center">{error}</p>}
        </div>

        <Button onClick={handleVerify} disabled={loading || code.length !== 6} className="w-full">
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Verificar
        </Button>
      </div>
    </div>
  );
}
