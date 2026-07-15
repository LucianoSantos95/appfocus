import { ReactNode, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { MfaChallenge } from "@/components/auth/MfaChallenge";

const MFA_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [mfaRequired, setMfaRequired] = useState<boolean | null>(null);
  const [mfaVerified, setMfaVerified] = useState(false);

  useEffect(() => {
    if (!user) {
      setMfaRequired(false);
      return;
    }

    // Serve from sessionStorage cache to avoid a spinner on every navigation.
    const cacheKey = `mfa_check_${user.id}`;
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (raw) {
        const { result, ts } = JSON.parse(raw) as { result: boolean; ts: number };
        if (Date.now() - ts < MFA_CACHE_TTL) {
          setMfaRequired(result);
          return;
        }
      }
    } catch { /* ignore malformed cache */ }

    const checkMfa = async () => {
      try {
        const { data } = await supabase.auth.mfa.listFactors();
        const hasVerifiedFactor = data?.totp.some((f) => f.status === "verified");
        let required = false;
        if (hasVerifiedFactor) {
          // Check current AAL level
          const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
            required = true;
          }
        }
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ result: required, ts: Date.now() }));
        } catch { /* storage quota exceeded — proceed without caching */ }
        setMfaRequired(required);
      } catch {
        setMfaRequired(false);
      }
    };

    checkMfa();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // MFA check runs in background; renderizamos otimisticamente enquanto mfaRequired === null.
  // Se descobrir depois que MFA é necessário, MfaChallenge substitui o conteúdo.
  if (mfaRequired && !mfaVerified) {
    return <MfaChallenge onVerified={() => { setMfaVerified(true); setMfaRequired(false); }} />;
  }

  return <>{children}</>;
}
