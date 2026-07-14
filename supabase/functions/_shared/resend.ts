// Shared Resend helper — routes through Lovable connector gateway.
// Automatic OAuth-style refresh; no direct api.resend.com calls.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

const PUBLIC_DOMAINS = [
  "gmail.com", "googlemail.com", "hotmail.com", "outlook.com",
  "live.com", "yahoo.com", "yahoo.com.br", "icloud.com",
  "me.com", "uol.com.br", "bol.com.br", "terra.com.br",
];

const DEFAULT_FROM = "Hub Empresarial <noreply@app.focusinteligente.com.br>";

export function resolveFrom(): string {
  const rawFrom = Deno.env.get("RESEND_FROM_EMAIL")?.trim();
  if (!rawFrom) return DEFAULT_FROM;
  const match = rawFrom.match(/<?([^<>\s@]+@([^<>\s]+))>?$/);
  const domain = match?.[2]?.toLowerCase();
  if (domain && PUBLIC_DOMAINS.includes(domain)) {
    console.warn(`[resend] RESEND_FROM_EMAIL ignorado (domínio público "${domain}").`);
    return DEFAULT_FROM;
  }
  return rawFrom;
}

export interface ResendEmailPayload {
  from?: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  reply_to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{ filename: string; content: string }>;
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
}

export interface ResendSendResult {
  ok: boolean;
  status: number;
  id?: string;
  error?: string;
  raw?: string;
}

export async function sendResendEmail(payload: ResendEmailPayload): Promise<ResendSendResult> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    return {
      ok: false,
      status: 500,
      error: "Resend connector not configured (missing LOVABLE_API_KEY or RESEND_API_KEY)",
    };
  }

  const body = {
    from: payload.from ?? resolveFrom(),
    to: Array.isArray(payload.to) ? payload.to : [payload.to],
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    reply_to: payload.reply_to,
    cc: payload.cc,
    bcc: payload.bcc,
    attachments: payload.attachments,
    headers: payload.headers,
    tags: payload.tags,
  };

  try {
    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const raw = await res.text();
    let parsed: any = null;
    try { parsed = JSON.parse(raw); } catch { /* not JSON */ }

    if (!res.ok) {
      console.error(`[resend gateway] ${res.status}: ${raw.slice(0, 500)}`);
      return {
        ok: false,
        status: res.status,
        error: parsed?.message || parsed?.error || raw.slice(0, 300),
        raw,
      };
    }

    return { ok: true, status: res.status, id: parsed?.id, raw };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[resend gateway] fetch failed: ${msg}`);
    return { ok: false, status: 0, error: msg };
  }
}
