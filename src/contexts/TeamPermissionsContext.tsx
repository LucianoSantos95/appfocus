import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface TeamPermissions {
  isAdmin: boolean;
  isTeamMember: boolean;
  allowedPages: string[];
  isLoading: boolean;
}

const TeamPermissionsContext = createContext<TeamPermissions>({
  isAdmin: false,
  isTeamMember: false,
  allowedPages: [],
  isLoading: true,
});

export function TeamPermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [allowedPages, setAllowedPages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setIsTeamMember(false);
      setAllowedPages([]);
      setIsLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const admin = roles?.some((r) => r.role === "admin") ?? false;
      setIsAdmin(admin);

      if (admin) {
        setAllowedPages([
          "financas", "rh", "marketing", "projetos",
          "clientes", "atividades", "processos", "guia",
        ]);
        setIsTeamMember(false);
      } else {
        const { data: membership } = await supabase
          .from("team_members")
          .select("id, status")
          .eq("member_user_id", user.id)
          .eq("status", "aceito")
          .maybeSingle();

        if (membership) {
          setIsTeamMember(true);
          const { data: perms } = await supabase
            .from("team_member_permissions")
            .select("page_slug")
            .eq("team_member_id", membership.id);
          setAllowedPages(perms?.map((p) => p.page_slug) || []);
        } else {
          setIsTeamMember(false);
          setAllowedPages([]);
        }
      }

      setIsLoading(false);
    };

    fetchPermissions();
  }, [user]);

  return (
    <TeamPermissionsContext.Provider value={{ isAdmin, isTeamMember, allowedPages, isLoading }}>
      {children}
    </TeamPermissionsContext.Provider>
  );
}

export function useTeamPermissionsContext(): TeamPermissions {
  return useContext(TeamPermissionsContext);
}
