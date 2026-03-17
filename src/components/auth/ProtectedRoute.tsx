import { ReactNode, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { MfaChallenge } from "@/components/auth/MfaChallenge";

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

    const checkMfa = async () => {
      try {
        const { data } = await supabase.auth.mfa.listFactors();
        const hasVerifiedFactor = data?.totp.some((f) => f.status === "verified");
        if (hasVerifiedFactor) {
          // Check current AAL level
          const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
            setMfaRequired(true);
          } else {
            setMfaRequired(false);
          }
        } else {
          setMfaRequired(false);
        }
      } catch {
        setMfaRequired(false);
      }
    };

    checkMfa();
  }, [user]);

  if (isLoading || mfaRequired === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (mfaRequired && !mfaVerified) {
    return <MfaChallenge onVerified={() => { setMfaVerified(true); setMfaRequired(false); }} />;
  }

  return <>{children}</>;
}
