// Shared Slack helper — routes through Lovable connector gateway.
const GATEWAY_URL = "https://connector-gateway.lovable.dev/slack/api";

export interface SlackMessageOptions {
  channel: string;
  text: string;
  blocks?: unknown[];
  username?: string;
  icon_emoji?: string;
  thread_ts?: string;
}

export interface SlackSendResult {
  ok: boolean;
  status: number;
  ts?: string;
  channel?: string;
  error?: string;
}

export function isSlackConfigured(): boolean {
  return !!(Deno.env.get("LOVABLE_API_KEY") && Deno.env.get("SLACK_API_KEY"));
}

export async function sendSlackMessage(opts: SlackMessageOptions): Promise<SlackSendResult> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const SLACK_API_KEY = Deno.env.get("SLACK_API_KEY");
  if (!LOVABLE_API_KEY || !SLACK_API_KEY) {
    return { ok: false, status: 500, error: "Slack connector not configured" };
  }

  try {
    const res = await fetch(`${GATEWAY_URL}/chat.postMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": SLACK_API_KEY,
      },
      body: JSON.stringify(opts),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      console.error(`[slack] ${res.status}: ${data.error ?? "unknown"}`);
      return { ok: false, status: res.status, error: data.error ?? "unknown" };
    }
    return { ok: true, status: res.status, ts: data.ts, channel: data.channel };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[slack] fetch failed: ${msg}`);
    return { ok: false, status: 0, error: msg };
  }
}

export async function listPublicChannels(limit = 200): Promise<Array<{ id: string; name: string }>> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const SLACK_API_KEY = Deno.env.get("SLACK_API_KEY");
  if (!LOVABLE_API_KEY || !SLACK_API_KEY) return [];

  const channels: Array<{ id: string; name: string }> = [];
  let cursor = "";
  do {
    const url = `${GATEWAY_URL}/conversations.list?limit=${limit}&types=public_channel${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": SLACK_API_KEY,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!data.ok) break;
    for (const c of data.channels ?? []) channels.push({ id: c.id, name: c.name });
    cursor = data.response_metadata?.next_cursor ?? "";
  } while (cursor);
  return channels;
}
