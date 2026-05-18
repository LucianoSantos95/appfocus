import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriberFollowup {
  id: string;
  user_id: string;
  recipient_email: string;
  sequence_step: number;
  status: "draft" | "sent" | "skipped";
  subject: string;
  body_html: string;
  body_text: string | null;
  ai_rationale: string | null;
  suggested_next_days: number | null;
  next_followup_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface FollowupState {
  followups: SubscriberFollowup[];
  lastSent?: SubscriberFollowup;
  openDraft?: SubscriberFollowup;
  canGenerate: boolean;
  nextAvailableAt: Date | null;
  sequenceCompleted: boolean;
  lastStep: number;
}

const MAX_STEPS = 4;

export function useSubscriberFollowups(userIds: string[]) {
  const [byUser, setByUser] = useState<Record<string, SubscriberFollowup[]>>({});
  const [loading, setLoading] = useState(false);

  const stableIds = useMemo(() => [...userIds].sort().join(","), [userIds]);

  const refetch = async () => {
    if (userIds.length === 0) {
      setByUser({});
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("subscriber_followups" as any)
      .select("*")
      .in("user_id", userIds)
      .order("created_at", { ascending: false });
    if (!error && data) {
      const map: Record<string, SubscriberFollowup[]> = {};
      for (const row of data as unknown as SubscriberFollowup[]) {
        (map[row.user_id] ||= []).push(row);
      }
      setByUser(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableIds]);

  useEffect(() => {
    if (userIds.length === 0) return;
    const ch = supabase
      .channel("subscriber-followups-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriber_followups" },
        () => void refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableIds]);

  const stateFor = (userId: string): FollowupState => {
    const list = byUser[userId] ?? [];
    const openDraft = list.find((f) => f.status === "draft");
    const lastSent = list.find((f) => f.status === "sent");
    const lastStep = lastSent?.sequence_step ?? 0;
    const sequenceCompleted =
      lastStep >= MAX_STEPS ||
      (lastSent != null && lastSent.next_followup_at == null);
    const nextAvailableAt = lastSent?.next_followup_at
      ? new Date(lastSent.next_followup_at)
      : null;
    const locked = nextAvailableAt != null && nextAvailableAt > new Date();
    return {
      followups: list,
      lastSent,
      openDraft,
      canGenerate: !openDraft && !sequenceCompleted && !locked,
      nextAvailableAt,
      sequenceCompleted,
      lastStep,
    };
  };

  return { stateFor, loading, refetch };
}
