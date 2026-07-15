import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSharedResource } from "@/lib/sharedResource";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const { data: notifications, isLoading, refetch, mutate } = useSharedResource<Notification[]>(
    user ? `notifications:${user.id}` : null,
    async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data as Notification[]) || [];
    },
    { initial: [], enabled: !!user }
  );

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          mutate((prev) => [payload.new as Notification, ...(prev || [])]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, mutate]);

  const list = notifications || [];
  const unreadCount = list.filter((n) => !n.read).length;

  const markAsRead = useCallback(
    async (id: string) => {
      await supabase.from("notifications").update({ read: true } as never).eq("id", id);
      mutate((prev) => (prev || []).map((n) => (n.id === id ? { ...n, read: true } : n)));
    },
    [mutate]
  );

  const markAllAsRead = useCallback(async () => {
    const unreadIds = list.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("notifications").update({ read: true } as never).in("id", unreadIds);
    mutate((prev) => (prev || []).map((n) => ({ ...n, read: true })));
  }, [list, mutate]);

  return { notifications: list, unreadCount, isLoading, markAsRead, markAllAsRead, refetch };
}
