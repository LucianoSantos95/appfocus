import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Auth required" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_KEY) return json({ error: "OPENAI_API_KEY não configurada" }, 500);

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabaseAuth.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Invalid token" }, 401);
    const userId = claims.claims.sub as string;

    const { recording_id, cliente_id } = await req.json();
    if (!recording_id) return json({ error: "recording_id obrigatório" }, 400);

    const service = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verify ownership and derive storage_path from DB — never trust client input
    const { data: rec, error: recErr } = await service
      .from("client_recordings")
      .select("storage_path, user_id")
      .eq("id", recording_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (recErr || !rec) return json({ error: "Gravação não encontrada" }, 404);
    const safePath = rec.storage_path;

    // 1) Download audio from private bucket using the validated path
    const { data: file, error: dlErr } = await service.storage.from("client-recordings").download(safePath);
    if (dlErr || !file) {
      await service.from("client_recordings").update({ status: "erro" }).eq("id", recording_id);
      return json({ error: "Falha ao ler áudio: " + (dlErr?.message || "desconhecido") }, 500);
    }

    // 2) Transcribe with OpenAI Whisper
    const form = new FormData();
    form.append("file", file, "audio.webm");
    form.append("model", "whisper-1");
    form.append("language", "pt");
    form.append("response_format", "text");

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
      body: form,
    });
    if (!whisperRes.ok) {
      const errTxt = await whisperRes.text();
      console.error("[transcribe-meeting] Whisper failed:", whisperRes.status, errTxt);
      await service.from("client_recordings").update({ status: "erro" }).eq("id", recording_id);
      const safe = whisperRes.status === 429
        ? "Limite de transcrição atingido. Tente novamente em instantes."
        : "Transcrição indisponível. Tente novamente.";
      return json({ error: safe }, whisperRes.status === 429 ? 429 : 500);
    }
    const transcript = (await whisperRes.text()).trim();

    if (!transcript) {
      await service.from("client_recordings").update({ status: "erro", transcript: "" }).eq("id", recording_id);
      return json({ error: "Transcrição vazia" }, 422);
    }

    // 3) Summarize with Lovable AI Gateway (Gemini)
    let summary = "";
    let nextActions = "";
    try {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_KEY}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                'Você resume reuniões de agência com clientes em português brasileiro. Responda APENAS JSON válido com as chaves: "summary" (3-5 bullets em markdown com pontos principais e decisões) e "next_actions" (bullets em markdown com próximos passos acionáveis e responsáveis quando mencionados). Sem texto fora do JSON.',
            },
            { role: "user", content: `Reunião transcrita:\n\n${transcript}` },
          ],
        }),
      });
      if (aiRes.ok) {
        const aiJson = await aiRes.json();
        const content = aiJson.choices?.[0]?.message?.content || "{}";
        const m = content.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(m ? m[0] : content);
        const toText = (v: unknown): string => {
          if (!v) return "";
          if (typeof v === "string") return v;
          if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x : `- ${JSON.stringify(x)}`)).join("\n");
          if (typeof v === "object") return Object.entries(v as Record<string, unknown>).map(([k, val]) => `- **${k}:** ${typeof val === "string" ? val : JSON.stringify(val)}`).join("\n");
          return String(v);
        };
        summary = toText(parsed.summary);
        nextActions = toText(parsed.next_actions);
      }
    } catch (e) {
      console.error("Resumo IA falhou:", e);
    }

    // 4) Persist
    await service.from("client_recordings").update({
      transcript,
      summary: summary || null,
      next_actions: nextActions || null,
      status: "concluido",
    }).eq("id", recording_id).eq("user_id", userId);

    if (cliente_id && (summary || transcript)) {
      const { data: cli } = await service.from("clientes").select("meeting_notes").eq("id", cliente_id).eq("user_id", userId).maybeSingle();
      const stamp = new Date().toLocaleDateString("pt-BR");
      const body = summary || transcript.slice(0, 500) + (transcript.length > 500 ? "…" : "");
      const novoBloco = `<div style="margin-top:12px;padding:8px;border-left:3px solid hsl(var(--primary));"><strong>🎙️ Reunião gravada — ${stamp}</strong><br/>${body.replace(/\n/g, "<br/>")}${nextActions ? `<br/><strong>Próximos passos:</strong><br/>${nextActions.replace(/\n/g, "<br/>")}` : ""}</div>`;
      const updated = (cli?.meeting_notes || "") + novoBloco;
      await service.from("clientes").update({
        meeting_notes: updated,
        ...(nextActions ? { proxima_acao_sugerida: nextActions } : {}),
      }).eq("id", cliente_id).eq("user_id", userId);
    }

    return json({ success: true, transcript, summary, next_actions: nextActions });
  } catch (err) {
    console.error("transcribe-meeting error:", err);
    return json({ error: "Erro interno ao processar a reunião. Tente novamente." }, 500);
  }
});
