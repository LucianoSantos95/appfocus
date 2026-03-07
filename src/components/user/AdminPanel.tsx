import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/contexts/PlanContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Trash2, Mail, CreditCard, Search } from "lucide-react";

interface AdminPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const allPages = [
  { slug: "financas", label: "Finanças" },
  { slug: "rh", label: "RH" },
  { slug: "marketing", label: "Marketing" },
  { slug: "projetos", label: "Projetos" },
  { slug: "clientes", label: "Clientes" },
  { slug: "atividades", label: "Atividades" },
  { slug: "processos", label: "Processos" },
  { slug: "guia", label: "Guia" },
];

const planLimits: Record<string, number> = {
  gratuito: 1,
  plus: 5,
  pro: 10,
  enterprise: 999,
};

const planOptions = [
  { value: "gratuito", label: "Gratuito" },
  { value: "plus", label: "Plus" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
];

interface TeamMember {
  id: string;
  member_email: string;
  status: string;
  member_user_id: string | null;
}

interface SubscriptionRecord {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  display_name: string | null;
  email: string | null;
}

export function AdminPanel({ open, onOpenChange }: AdminPanelProps) {
  const { user } = useAuth();
  const { plan } = usePlan();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [allSelected, setAllSelected] = useState(false);
  const [sending, setSending] = useState(false);

  // Subscription management state
  const [subSearch, setSubSearch] = useState("");
  const [subResults, setSubResults] = useState<SubscriptionRecord[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [updatingSubId, setUpdatingSubId] = useState<string | null>(null);

  const limit = planLimits[plan] || 1;

  useEffect(() => {
    if (!open || !user) return;
    fetchMembers();
  }, [open, user]);

  const fetchMembers = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("team_members")
      .select("id, member_email, status, member_user_id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    setMembers(data || []);
    setLoading(false);
  };

  const togglePage = (slug: string) => {
    setSelectedPages((prev) =>
      prev.includes(slug) ? prev.filter((p) => p !== slug) : [...prev, slug]
    );
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedPages([]);
    } else {
      setSelectedPages(allPages.map((p) => p.slug));
    }
    setAllSelected(!allSelected);
  };

  const handleInvite = async () => {
    if (!user) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Email inválido", variant: "destructive" });
      return;
    }
    if (selectedPages.length === 0) {
      toast({ title: "Selecione pelo menos uma página", variant: "destructive" });
      return;
    }
    if (members.length >= limit) {
      toast({ title: `Limite de ${limit} colaboradores atingido`, description: "Faça upgrade do plano para adicionar mais.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { data: member, error } = await supabase
        .from("team_members")
        .insert({ owner_id: user.id, member_email: email })
        .select("id")
        .single();

      if (error) throw error;

      const perms = selectedPages.map((slug) => ({
        team_member_id: member.id,
        page_slug: slug,
      }));
      await supabase.from("team_member_permissions").insert(perms);

      const { data: tokenData } = await supabase
        .from("invite_tokens")
        .insert({ team_member_id: member.id })
        .select("token")
        .single();

      if (tokenData) {
        try {
          await supabase.functions.invoke("send-invite", {
            body: {
              email,
              token: tokenData.token,
              inviter_name: user.user_metadata?.full_name || user.email,
            },
          });
        } catch {
          // Edge function might not exist yet
        }
      }

      toast({ title: "Convite enviado!", description: `Convite enviado para ${email}` });
      setInviteEmail("");
      setSelectedPages([]);
      setAllSelected(false);
      fetchMembers();
    } catch (err: any) {
      const msg = err.message?.includes("duplicate") ? "Este email já foi convidado." : err.message;
      toast({ title: "Erro ao convidar", description: msg, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    await supabase.from("team_members").delete().eq("id", memberId);
    toast({ title: "Colaborador removido" });
    fetchMembers();
  };

  // --- Subscription management ---
  const searchSubscriptions = async () => {
    const q = subSearch.trim();
    if (!q) return;
    setSubLoading(true);
    try {
      // Search profiles by display_name, then join with subscriptions
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .ilike("display_name", `%${q}%`)
        .limit(10);

      if (!profiles || profiles.length === 0) {
        setSubResults([]);
        setSubLoading(false);
        return;
      }

      const userIds = profiles.map((p) => p.user_id);
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("id, user_id, plan, status")
        .in("user_id", userIds);

      const results: SubscriptionRecord[] = (subs || []).map((s) => {
        const profile = profiles.find((p) => p.user_id === s.user_id);
        return {
          ...s,
          display_name: profile?.display_name || null,
          email: null,
        };
      });

      setSubResults(results);
    } catch {
      toast({ title: "Erro ao buscar", variant: "destructive" });
    } finally {
      setSubLoading(false);
    }
  };

  const updateSubscriptionPlan = async (subId: string, newPlan: string) => {
    setUpdatingSubId(subId);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ plan: newPlan, updated_at: new Date().toISOString() })
        .eq("id", subId);

      if (error) throw error;

      setSubResults((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, plan: newPlan } : s))
      );
      toast({ title: "Plano atualizado!", description: `Plano alterado para ${newPlan}` });
    } catch (err: any) {
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingSubId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Painel Admin</DialogTitle>
        </DialogHeader>

        {/* Subscription Management */}
        <div className="space-y-3 mt-2">
          <div className="p-4 rounded-xl border border-border bg-card/50 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Gerenciar Assinaturas</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por nome do usuário..."
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchSubscriptions()}
              />
              <Button size="icon" variant="outline" onClick={searchSubscriptions} disabled={subLoading}>
                {subLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            {subResults.length > 0 && (
              <ul className="space-y-2">
                {subResults.map((s) => (
                  <li key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/30 gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{s.display_name || "Sem nome"}</p>
                      <Badge variant="secondary" className="text-xs mt-1">{s.plan}</Badge>
                    </div>
                    <Select
                      value={s.plan}
                      onValueChange={(val) => updateSubscriptionPlan(s.id, val)}
                      disabled={updatingSubId === s.id}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {planOptions.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </li>
                ))}
              </ul>
            )}
            {subResults.length === 0 && subSearch && !subLoading && (
              <p className="text-sm text-muted-foreground text-center py-2">Nenhum usuário encontrado.</p>
            )}
          </div>
        </div>

        {/* Invite Section */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-card/50 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <UserPlus className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Adicionar Colaborador</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {members.length}/{limit}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>Email do colaborador</Label>
              <Input
                type="email"
                placeholder="colaborador@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label>Permissões por página</Label>
              <div className="flex items-center gap-2 mb-2">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} id="all-pages" />
                <label htmlFor="all-pages" className="text-sm font-medium">Todas as Páginas</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {allPages.map((page) => (
                  <div key={page.slug} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedPages.includes(page.slug)}
                      onCheckedChange={() => togglePage(page.slug)}
                      id={`page-${page.slug}`}
                    />
                    <label htmlFor={`page-${page.slug}`} className="text-sm">{page.label}</label>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={handleInvite} className="w-full gap-2" disabled={sending}>
              {sending && <Loader2 className="w-4 h-4 animate-spin" />}
              <Mail className="w-4 h-4" />
              Enviar Convite
            </Button>
          </div>

          {/* Members List */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Colaboradores</h3>
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum colaborador adicionado.</p>
            ) : (
              <ul className="space-y-2">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/30">
                    <div>
                      <p className="text-sm font-medium">{m.member_email}</p>
                      <Badge variant={m.status === "aceito" ? "default" : "secondary"} className="text-xs mt-1">
                        {m.status === "aceito" ? "Aceito" : "Pendente"}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemove(m.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
