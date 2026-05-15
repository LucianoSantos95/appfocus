import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Auth required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabaseAuth.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claims.claims.sub as string;

    const { recording_id, cliente_id, storage_path, audio_url } = await req.json();
    if (!recording_id || !storage_path) {
      return new Response(JSON.stringify({ error: "recording_id e storage_path obrigatórios" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const service = createClient(SUPABASE_URL, SERVICE_KEY);

    // baixar áudio do bucket privado
    const { data: file, error: dlErr } = await service.storage.from("client-recordings").download(storage_path);
    if (dlErr || !file) {
      await service.from("client_recordings").update({ status: "erro" }).eq("id", recording_id);
      return new Response(JSON.stringify({ error: "Falha ao ler áudio: " + dlErr?.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64Audio = btoa(binary);
    const mimeType = file.type || "audio/webm";

    // chamar Gemini com áudio inline
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: "Você é um assistente que transcreve e resume reuniões de agência com clientes em português brasileiro. Sempre responda em JSON válido com as chaves: transcript (transcrição completa do áudio), summary (3-5 bullets em markdown com os pontos principais), next_actions (bullets em markdown com os próximos passos acionáveis). Não inclua nada além do JSON.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcreva integralmente esta reunião e gere o resumo + próximos passos no formato JSON especificado." },
              { type: "input_audio", input_audio: { data: base64Audio, format: mimeType.includes("mp3") ? "mp3" : "webm" } },
            ],
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errTxt = await aiRes.text();
      await service.from("client_recordings").update({ status: "erro" }).eq("id", recording_id);
      const status = aiRes.status === 429 ? 429 : aiRes.status === 402 ? 402 : 500;
      return new Response(JSON.stringify({ error: "IA falhou: " + errTxt }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content || "{}";
    let parsed: { transcript?: string; summary?: string; next_actions?: string } = {};
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      parsed = { transcript: content };
    }

    await service.from("client_recordings").update({
      transcript: parsed.transcript || null,
      summary: parsed.summary || null,
      next_actions: parsed.next_actions || null,
      status: "concluido",
    }).eq("id", recording_id).eq("user_id", userId);

    // Anexar resumo ao meeting_notes do cliente
    if (cliente_id && parsed.summary) {
      const { data: cli } = await service.from("clientes").select("meeting_notes").eq("id", cliente_id).eq("user_id", userId).maybeSingle();
      const stamp = new Date().toLocaleDateString("pt-BR");
      const novoBloco = `<div style="margin-top:12px;padding:8px;border-left:3px solid hsl(var(--primary));"><strong>🎙️ Reunião gravada — ${stamp}</strong><br/>${parsed.summary.replace(/\n/g, "<br/>")}${parsed.next_actions ? `<br/><strong>Próximos passos:</strong><br/>${parsed.next_actions.replace(/\n/g, "<br/>")}` : ""}</div>`;
      const updated = (cli?.meeting_notes || "") + novoBloco;
      await service.from("clientes").update({ meeting_notes: updated, proxima_acao_sugerida: parsed.next_actions || null }).eq("id", cliente_id).eq("user_id", userId);
    }

    return new Response(JSON.stringify({ success: true, ...parsed }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("transcribe-meeting error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
