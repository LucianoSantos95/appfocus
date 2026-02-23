import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TeamPermissions {
  isAdmin: boolean;
  isTeamMember: boolean;
  allowedPages: string[];
  isLoading: boolean;
}

export function useTeamPermissions(): TeamPermissions {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [allowedPages, setAllowedPages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      // Check if admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const admin = roles?.some((r) => r.role === "admin") ?? false;
      setIsAdmin(admin);

      if (admin) {
        // Admins have access to all pages
        setAllowedPages([
          "financas", "rh", "marketing", "projetos",
          "clientes", "atividades", "processos", "guia",
        ]);
        setIsTeamMember(false);
      } else {
        // Check team membership
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
        }
      }

      setIsLoading(false);
    };

    fetchPermissions();
  }, [user]);

  return { isAdmin, isTeamMember, allowedPages, isLoading };
}
