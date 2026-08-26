import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearAllResources } from "@/lib/sharedResource";
import { isDemoMode, DEMO_USER } from "@/lib/demo-fixtures";
import { isOwnerEmail } from "@/lib/owner";


interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name?: string, inviteToken?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const demo = isDemoMode();
  const [user, setUser] = useState<User | null>(demo ? (DEMO_USER as unknown as User) : null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(!demo);

  useEffect(() => {
    if (demo) return; // Modo demo não usa Supabase auth

    // Regra dura: só o dono da plataforma pode manter sessão. Se qualquer
    // outra conta conseguir autenticar (cadastro antigo, OAuth), derrubamos
    // a sessão na hora. O catálogo é público e não precisa de login.
    const aplicarSessao = (session: Session | null) => {
      if (session && !isOwnerEmail(session.user?.email)) {
        setSession(null);
        setUser(null);
        setIsLoading(false);
        supabase.auth.signOut().catch(() => {});
        return false;
      }
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      return true;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!aplicarSessao(session)) return;

        // After any sign-in (covers Google OAuth redirect), try to attribute UTM
        // if profiles.canal_aquisicao is still NULL (first-touch, never overwrites)
        if (event === "SIGNED_IN" && session?.user) {
          try {
            const raw = localStorage.getItem("hub_utm");
            if (raw) {
              const utm = JSON.parse(raw) as { utm_source?: string; captured_at?: number };
              const fresh = Date.now() - (utm.captured_at ?? 0) < 24 * 60 * 60 * 1000;
              if (fresh && utm.utm_source) {
                await supabase
                  .from("profiles")
                  .update({ canal_aquisicao: utm.utm_source })
                  .eq("user_id", session.user.id)
                  .is("canal_aquisicao", null);
                localStorage.removeItem("hub_utm");
              }
            }
          } catch {
            // Non-blocking — attribution failure must never break login
          }
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      aplicarSessao(session);
    });


    return () => subscription.unsubscribe();
  }, [demo]);

  const signIn = async (email: string, password: string) => {
    // Rate limit check + record attempt em paralelo (record é fire-and-forget)
    try {
      const rateCheckPromise = supabase.rpc("check_login_rate_limit", { p_email: email } as never);
      // fire-and-forget: não bloqueia o login
      supabase.rpc("record_login_attempt", { p_email: email } as never).then(() => {}, () => {});

      const { data: rateCheck, error: rateError } = await rateCheckPromise;
      if (!rateError && rateCheck && !(rateCheck as any).allowed) {
        const waitSec = (rateCheck as any).wait_seconds || 60;
        return { error: new Error(`Muitas tentativas de login. Aguarde ${Math.ceil(waitSec / 60)} minuto(s) e tente novamente.`) };
      }
    } catch {
      // If rate limit check fails, allow login to proceed
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Normalize errors to prevent user enumeration (email vs. senha).
      // Preserva mensagens específicas de MFA/email não confirmado.
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials") || msg.includes("email not confirmed") === false && msg.includes("password")) {
        return { error: new Error("Credenciais inválidas. Verifique e-mail e senha.") };
      }
      return { error: new Error(error.message) };
    }
    return { error: null };
  };

  const signUp = async (email: string, password: string, name?: string, inviteToken?: string) => {
    // Read first-touch UTM from localStorage (set when user landed on /auth)
    let canalAquisicao: string | null = null;
    try {
      const raw = localStorage.getItem("hub_utm");
      if (raw) {
        const utm = JSON.parse(raw) as { utm_source?: string; captured_at?: number };
        const fresh = Date.now() - (utm.captured_at ?? 0) < 24 * 60 * 60 * 1000;
        if (fresh && utm.utm_source) canalAquisicao = utm.utm_source;
      }
    } catch { /* ignore */ }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: inviteToken
          ? `${window.location.origin}/auth?invite=${inviteToken}`
          : window.location.origin,
        data: {
          full_name: name || email,
          invite_token: inviteToken || null,
          canal_aquisicao: canalAquisicao,
        },
      },
    });

    // Clean up UTM after successful signup (onAuthStateChange handles Google OAuth cleanup)
    if (!error && canalAquisicao) localStorage.removeItem("hub_utm");

    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    clearAllResources();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
