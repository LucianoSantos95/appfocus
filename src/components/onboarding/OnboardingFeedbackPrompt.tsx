import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { FeedbackDialog } from "@/components/user/FeedbackDialog";

const STATE_KEY = "onb_feedback_state";
const JUST_COMPLETED_KEY = "onb_just_completed";
const MAX_ATTEMPTS = 2;
const RETRY_DAYS = 3;
const PENDING_MIN_HOURS = 1;

type Trigger = "completed" | "abandoned";

interface State {
  status: "shown" | "submitted";
  lastShownAt: string;
  attempts: number;
  lastTrigger?: Trigger;
}

function readState(): State | null {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as State) : null;
  } catch {
    return null;
  }
}

function writeState(s: State) {
  localStorage.setItem(STATE_KEY, JSON.stringify(s));
}

export function OnboardingFeedbackPrompt() {
  const { user, isLoading } = useAuth();
  const { session, loading: onbLoading, needsOnboarding } = useOnboardingSession();
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useState<Trigger | null>(null);

  useEffect(() => {
    if (isLoading || onbLoading || !user) return;

    const state = readState();
    if (state?.status === "submitted") return;
    if (state && state.attempts >= MAX_ATTEMPTS) return;
    if (state?.lastShownAt) {
      const days = (Date.now() - new Date(state.lastShownAt).getTime()) / 86400000;
      if (days < RETRY_DAYS) return;
    }

    let nextTrigger: Trigger | null = null;
    const justCompleted = localStorage.getItem(JUST_COMPLETED_KEY) === "1";

    if (justCompleted && session) {
      nextTrigger = "completed";
    } else if (needsOnboarding) {
      const createdAt = user.created_at ? new Date(user.created_at).getTime() : Date.now();
      const hours = (Date.now() - createdAt) / 3600000;
      if (hours >= PENDING_MIN_HOURS) nextTrigger = "abandoned";
    }

    if (!nextTrigger) return;

    const timer = setTimeout(() => {
      setTrigger(nextTrigger);
      setOpen(true);
      localStorage.removeItem(JUST_COMPLETED_KEY);
    }, 3500);
    return () => clearTimeout(timer);
  }, [isLoading, onbLoading, user, session, needsOnboarding]);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      const prev = readState();
      writeState({
        status: "shown",
        lastShownAt: new Date().toISOString(),
        attempts: (prev?.attempts ?? 0) + 1,
        lastTrigger: trigger ?? undefined,
      });
    }
  };

  const handleSubmitted = () => {
    writeState({
      status: "submitted",
      lastShownAt: new Date().toISOString(),
      attempts: (readState()?.attempts ?? 0) + 1,
      lastTrigger: trigger ?? undefined,
    });
  };

  const placeholder =
    trigger === "completed"
      ? "Como foi sua primeira experiência configurando o Hub? O que poderia melhorar?"
      : "O que te impediu de concluir a configuração inicial? Sua opinião nos ajuda muito.";

  if (!trigger) return null;

  return (
    <FeedbackDialog
      open={open}
      onOpenChange={handleOpenChange}
      placeholder={placeholder}
      onSubmitted={handleSubmitted}
    />
  );
}
