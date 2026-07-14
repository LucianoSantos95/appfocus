import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

// ---------- HMAC-signed state helpers ----------

const STATE_SECRET =
  Deno.env.get("GOOGLE_OAUTH_STATE_SECRET") ||
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  "";

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacSign(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(STATE_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
  return toBase64Url(sig);
}

async function signState(data: { userId: string; redirect: string }): Promise<string> {
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify(data)));
  const sig = await hmacSign(payload);
  return `${payload}.${sig}`;
}

async function verifyState(state: string): Promise<{ userId: string; redirect: string } | null> {
  const parts = state.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = await hmacSign(payload);
  // constant-time compare
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    return JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
  } catch {
    return null;
  }
}

// ---------- HELPERS ----------

async function getValidToken(
  supabaseService: ReturnType<typeof createClient>,
  userId: string,
  clientId: string,
  clientSecret: string
): Promise<{ token: string; error?: never } | { token?: never; error: string }> {
  // Tokens are encrypted at rest; use the RPC so decryption happens server-side.
  const { data: integration, error } = await supabaseService
    .rpc("get_integration_tokens", { p_user_id: userId, p_provider: "google" })
    .single();

  if (error || !integration) {
    return { error: "Google não está conectado. Conecte sua conta primeiro." };
  }

  const now = new Date();
  const expiresAt = integration.token_expires_at ? new Date(integration.token_expires_at) : null;

  // Token still valid
  if (expiresAt && expiresAt > new Date(now.getTime() + 60000) && integration.access_token) {
    return { token: integration.access_token };
  }

  // Refresh token
  if (!integration.refresh_token) {
    return { error: "Refresh token ausente. Reconecte sua conta Google." };
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: integration.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("Token refresh failed:", errBody);
    return { error: "Falha ao renovar token Google. Reconecte sua conta." };
  }

  const tokenData = await res.json();
  const newExpiry = new Date(now.getTime() + (tokenData.expires_in || 3600) * 1000).toISOString();

  // Encrypt the refreshed access_token before storing
  await supabaseService.rpc("update_integration_access_token", {
    p_user_id:      userId,
    p_provider:     "google",
    p_access_token: tokenData.access_token,
    p_expires_at:   newExpiry,
  });

  return { token: tokenData.access_token };
}

function buildAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function buildMimeMessage(to: string, subject: string, body: string): string {
  const msg = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    body,
  ].join("\r\n");

  // Base64url encode
  const encoded = btoa(unescape(encodeURIComponent(msg)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return encoded;
}

// ---------- MAIN ----------
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: "Google OAuth não configurado. Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseService = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Handle GET for OAuth callback
    if (req.method === "GET") {
      const url = new URL(req.url);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const errorParam = url.searchParams.get("error");

      if (errorParam) {
        const fallbackRedirect = "/";
        let redirectUrl = fallbackRedirect;
        if (state) {
          const verified = await verifyState(state);
          redirectUrl = verified?.redirect || fallbackRedirect;
        }
        return Response.redirect(`${redirectUrl}?google_error=${errorParam}`, 302);
      }

      if (!code || !state) {
        return new Response(JSON.stringify({ error: "Missing code or state" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const stateData = await verifyState(state);
      if (!stateData) {
        return new Response(JSON.stringify({ error: "Invalid or tampered state" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const functionUrl = `${SUPABASE_URL}/functions/v1/google-integration`;

      // Exchange code for tokens
      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: functionUrl,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        const errBody = await tokenRes.text();
        console.error("Token exchange failed:", errBody);
        return Response.redirect(`${stateData.redirect}?google_error=token_exchange_failed`, 302);
      }

      const tokens = await tokenRes.json();
      const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

      // Get user email from Google
      let googleEmail = "";
      try {
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        if (userInfoRes.ok) {
          const userInfo = await userInfoRes.json();
          googleEmail = userInfo.email || "";
        }
      } catch (e) {
        console.error("Failed to get user info:", e);
      }

      // Upsert integration — tokens are encrypted by the RPC (ON CONFLICT handled server-side)
      const { error: upsertError } = await supabaseService.rpc("upsert_integration", {
        p_user_id:       stateData.userId,
        p_provider:      "google",
        p_access_token:  tokens.access_token,
        p_refresh_token: tokens.refresh_token || null,
        p_expires_at:    expiresAt,
        p_scopes:        tokens.scope || "",
        p_metadata:      { email: googleEmail },
      });

      if (upsertError) {
        console.error("Upsert error:", upsertError);
        return Response.redirect(`${stateData.redirect}?google_error=save_failed`, 302);
      }

      return Response.redirect(`${stateData.redirect}?google_connected=true`, 302);
    }

    // POST actions
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { action, ...params } = await req.json();

    switch (action) {
      case "auth_url": {
        const functionUrl = `${SUPABASE_URL}/functions/v1/google-integration`;
        const ALLOWED_REDIRECT_ORIGINS = [
          "https://app.focusinteligente.com.br",
          "https://appfocus.lovable.app",
          "https://id-preview--7b5ec06c-73e1-4b8a-b8c6-b0355f0a1aa9.lovable.app",
        ];
        const requestedRedirect = typeof params.redirect_url === "string" ? params.redirect_url : "/";
        let safeRedirect = "/configuracoes";
        try {
          if (requestedRedirect.startsWith("/")) {
            safeRedirect = requestedRedirect;
          } else {
            const u = new URL(requestedRedirect);
            if (ALLOWED_REDIRECT_ORIGINS.includes(u.origin)) {
              safeRedirect = u.toString();
            }
          }
        } catch {
          safeRedirect = "/configuracoes";
        }
        const state = await signState({ userId, redirect: safeRedirect });
        const url = buildAuthUrl(GOOGLE_CLIENT_ID, functionUrl, state);
        return new Response(JSON.stringify({ url }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "status": {
        const { data: integration } = await supabaseService
          .from("user_integrations")
          .select("provider, scopes, metadata, created_at, token_expires_at")
          .eq("user_id", userId)
          .eq("provider", "google")
          .single();

        return new Response(
          JSON.stringify({
            connected: !!integration,
            email: integration?.metadata?.email || null,
            connected_at: integration?.created_at || null,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "disconnect": {
        await supabaseService
          .from("user_integrations")
          .delete()
          .eq("user_id", userId)
          .eq("provider", "google");

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list_emails": {
        const tokenResult = await getValidToken(supabaseService, userId, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
        if (tokenResult.error) {
          return new Response(JSON.stringify({ error: tokenResult.error }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const maxResults = params.max_results || 10;
        const messagesRes = await fetch(
          `${GMAIL_API}/messages?maxResults=${maxResults}&labelIds=INBOX`,
          { headers: { Authorization: `Bearer ${tokenResult.token}` } }
        );

        if (!messagesRes.ok) {
          return new Response(JSON.stringify({ error: "Falha ao listar e-mails" }), {
            status: messagesRes.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const messagesData = await messagesRes.json();
        const messageIds = (messagesData.messages || []).map((m: any) => m.id);

        // Fetch details for each message (limited)
        const emails = [];
        for (const id of messageIds.slice(0, 10)) {
          const detailRes = await fetch(
            `${GMAIL_API}/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
            { headers: { Authorization: `Bearer ${tokenResult.token}` } }
          );
          if (detailRes.ok) {
            const detail = await detailRes.json();
            const headers = detail.payload?.headers || [];
            emails.push({
              id: detail.id,
              snippet: detail.snippet,
              from: headers.find((h: any) => h.name === "From")?.value || "",
              subject: headers.find((h: any) => h.name === "Subject")?.value || "",
              date: headers.find((h: any) => h.name === "Date")?.value || "",
              labelIds: detail.labelIds || [],
            });
          }
        }

        return new Response(JSON.stringify({ emails, total: messagesData.resultSizeEstimate || 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "send_email": {
        const { to, subject, body } = params;
        if (!to || !subject || !body) {
          return new Response(JSON.stringify({ error: "to, subject e body são obrigatórios" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const tokenResult = await getValidToken(supabaseService, userId, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
        if (tokenResult.error) {
          return new Response(JSON.stringify({ error: tokenResult.error }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const raw = buildMimeMessage(to, subject, body);
        const sendRes = await fetch(`${GMAIL_API}/messages/send`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenResult.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw }),
        });

        if (!sendRes.ok) {
          const errBody = await sendRes.text();
          console.error("Send email error:", errBody);
          return new Response(JSON.stringify({ error: "Falha ao enviar e-mail" }), {
            status: sendRes.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const sendData = await sendRes.json();
        return new Response(JSON.stringify({ success: true, messageId: sendData.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list_events": {
        const tokenResult = await getValidToken(supabaseService, userId, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
        if (tokenResult.error) {
          return new Response(JSON.stringify({ error: tokenResult.error }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const timeMin = params.time_min || new Date().toISOString();
        const maxResults = params.max_results || 10;

        const eventsRes = await fetch(
          `${CALENDAR_API}/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`,
          { headers: { Authorization: `Bearer ${tokenResult.token}` } }
        );

        if (!eventsRes.ok) {
          return new Response(JSON.stringify({ error: "Falha ao listar eventos" }), {
            status: eventsRes.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const eventsData = await eventsRes.json();
        const events = (eventsData.items || []).map((e: any) => ({
          id: e.id,
          summary: e.summary || "",
          start: e.start?.dateTime || e.start?.date || "",
          end: e.end?.dateTime || e.end?.date || "",
          location: e.location || "",
          description: e.description?.substring(0, 200) || "",
        }));

        return new Response(JSON.stringify({ events }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create_event": {
        const { summary, description, start, end, all_day } = params;
        if (!summary || !start) {
          return new Response(JSON.stringify({ error: "summary e start são obrigatórios" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const tokenResult = await getValidToken(supabaseService, userId, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
        if (tokenResult.error) {
          return new Response(JSON.stringify({ error: tokenResult.error }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // all_day → { date: "YYYY-MM-DD" }; timed → { dateTime: ISO }.
        // For timed events without an explicit end, default to +1h.
        const startObj = all_day ? { date: start } : { dateTime: start };
        const endObj = all_day
          ? { date: end || start }
          : { dateTime: end || new Date(new Date(start).getTime() + 3600000).toISOString() };

        const createRes = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenResult.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary,
            description: description || undefined,
            start: startObj,
            end: endObj,
          }),
        });

        if (!createRes.ok) {
          const errBody = await createRes.text();
          console.error("Create event error:", errBody);
          return new Response(JSON.stringify({ error: "Falha ao criar evento na agenda" }), {
            status: createRes.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const created = await createRes.json();
        return new Response(
          JSON.stringify({ success: true, eventId: created.id, htmlLink: created.htmlLink }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "sync_events": {
        const tokenResult = await getValidToken(supabaseService, userId, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
        if (tokenResult.error) {
          return new Response(JSON.stringify({ error: tokenResult.error }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const now = new Date();
        const timeMin = now.toISOString();
        const timeMax = new Date(now.getTime() + 30 * 86400000).toISOString();

        const eventsRes = await fetch(
          `${CALENDAR_API}/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=50`,
          { headers: { Authorization: `Bearer ${tokenResult.token}` } }
        );

        if (!eventsRes.ok) {
          return new Response(JSON.stringify({ error: "Falha ao buscar eventos para sincronização" }), {
            status: eventsRes.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const eventsData = await eventsRes.json();
        let synced = 0;

        for (const event of eventsData.items || []) {
          const startStr = event.start?.dateTime || event.start?.date || "";
          const eventDate = startStr.split("T")[0];
          const eventTime = startStr.includes("T")
            ? startStr.split("T")[1]?.substring(0, 5) || "00:00"
            : "00:00";

          if (!eventDate) continue;

          // Upsert by checking if exists
          const { data: existing } = await supabaseService
            .from("agenda_items")
            .select("id")
            .eq("user_id", userId)
            .eq("title", event.summary || "Sem título")
            .eq("date", eventDate)
            .maybeSingle();

          if (!existing) {
            await supabaseService.from("agenda_items").insert({
              user_id: userId,
              title: (event.summary || "Sem título").substring(0, 255),
              date: eventDate,
              time: eventTime,
              type: "meeting",
              priority: "medium",
            });
            synced++;
          }
        }

        return new Response(JSON.stringify({ success: true, synced, total_found: (eventsData.items || []).length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Ação '${action}' não reconhecida` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Google integration error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
