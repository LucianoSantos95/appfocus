import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, ShieldOff, Copy, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TwoFactorSetupProps {
  onComplete?: () => void;
}

export function TwoFactorSetup({ onComplete }: TwoFactorSetupProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkMfaStatus();
  }, []);

  const checkMfaStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const verifiedTotp = data.totp.find((f) => f.status === "verified");
      if (verifiedTotp) {
        setIsEnabled(true);
        setFactorId(verifiedTotp.id);
      } else {
        setIsEnabled(false);
        setFactorId(null);
      }
    } catch (err) {
      console.error("Error checking MFA:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      // Clean up any unverified factors first
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors?.totp) {
        for (const f of factors.totp) {
          if ((f as any).status === "unverified") {
            await supabase.auth.mfa.unenroll({ factorId: f.id });
          }
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Focus Hub TOTP",
      });
      if (error) throw error;
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (err: any) {
      toast({ title: "Erro ao configurar 2FA", description: err.message, variant: "destructive" });
    } finally {
      setEnrolling(false);
    }
  };

  const handleVerify = async () => {
    if (!factorId || totpCode.length !== 6) {
      toast({ title: "Insira o código de 6 dígitos", variant: "destructive" });
      return;
    }
    setVerifying(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: totpCode,
      });
      if (verifyError) throw verifyError;

      setIsEnabled(true);
      setQrCode(null);
      setSecret(null);
      setTotpCode("");
      toast({ title: "2FA ativado!", description: "Sua conta agora tem autenticação de dois fatores." });
      onComplete?.();
    } catch (err: any) {
      toast({ title: "Código inválido", description: "Verifique o código e tente novamente.", variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const handleUnenroll = async () => {
    if (!factorId) return;
    setUnenrolling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      setIsEnabled(false);
      setFactorId(null);
      toast({ title: "2FA desativado", description: "A autenticação de dois fatores foi removida." });
    } catch (err: any) {
      toast({ title: "Erro ao desativar 2FA", description: err.message, variant: "destructive" });
    } finally {
      setUnenrolling(false);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 2FA is active
  if (isEnabled && !qrCode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
          <ShieldCheck className="w-5 h-5 text-success flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-success">2FA Ativo</p>
            <p className="text-xs text-muted-foreground">Sua conta está protegida com autenticação de dois fatores.</p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleUnenroll}
          disabled={unenrolling}
          className="w-full"
        >
          {unenrolling && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          <ShieldOff className="w-4 h-4 mr-2" />
          Desativar 2FA
        </Button>
      </div>
    );
  }

  // Enrollment flow — show QR code
  if (qrCode && secret) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-sm font-medium text-foreground mb-2">Escaneie o QR Code</p>
          <p className="text-xs text-muted-foreground mb-4">
            Use um app autenticador como Google Authenticator, Authy ou 1Password.
          </p>
          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 rounded-xl">
              <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center">Ou insira o código manualmente:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted rounded-lg px-3 py-2 font-mono break-all text-foreground">
              {secret}
            </code>
            <Button variant="outline" size="icon" onClick={copySecret} className="flex-shrink-0">
              {copied ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Código de verificação</Label>
          <Input
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="text-center text-lg tracking-widest font-mono"
            autoFocus
          />
        </div>

        <Button onClick={handleVerify} disabled={verifying || totpCode.length !== 6} className="w-full">
          {verifying && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Verificar e Ativar
        </Button>
      </div>
    );
  }

  // Not enrolled — show activate button
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
        <ShieldOff className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">2FA Inativo</p>
          <p className="text-xs text-muted-foreground">Adicione uma camada extra de segurança à sua conta.</p>
        </div>
      </div>
      <Button onClick={handleEnroll} disabled={enrolling} className="w-full">
        {enrolling && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        <ShieldCheck className="w-4 h-4 mr-2" />
        Ativar 2FA
      </Button>
    </div>
  );
}
