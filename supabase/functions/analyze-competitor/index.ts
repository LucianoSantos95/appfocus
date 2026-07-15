// Analyze a competitor website with Firecrawl + Lovable AI and
// return structured content-idea suggestions to plug into the
// content calendar. Used by src/components/marketing/CompetitorAnalyzer.tsx.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function firecrawlScrape(url: string) {
  const KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!KEY) return { ok: false, status: 503, error: "FIRECRAWL_API_KEY ausente." };

  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({
      url,
      onlyMainContent: true,
      formats: ["markdown"],
    }),
  });

  const text = await res.text();
  let data: any = {};
  try { data = JSON.parse(text); } catch { /* noop */ }
  if (!res.ok || data?.success === false) {
    return { ok: false, status: res.status, error: data?.error || text.slice(0, 200) };
  }
  const md: string = data?.data?.markdown || data?.markdown || "";
  return { ok: true, status: 200, markdown: md.slice(0, 12000) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await supabaseAuth.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (!claims?.claims?.sub) return json({ error: "Token inválido" }, 401);

    const body = await req.json().catch(() => ({}));
    let url = String(body?.url || "").trim();
    if (!url) return json({ error: "URL é obrigatória" }, 400);
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

    const scrape = await firecrawlScrape(url);
    if (!scrape.ok) {
      return json({ error: scrape.error || "Falha ao raspar o site." }, scrape.status || 502);
    }

    if (!LOVABLE_API_KEY) return json({ error: "IA indisponível." }, 503);

    const prompt = [
      "Você é um estrategista de conteúdo para agências e consultorias.",
      "A partir do conteúdo abaixo (site de um concorrente), retorne EM JSON:",
      "1) summary: 2 frases sobre posicionamento e público;",
      "2) topics: 5 temas de conteúdo que este concorrente cobre bem;",
      "3) gaps: 3 lacunas / oportunidades que ele NÃO explora;",
      "4) ideas: 5 ideias de posts prontas (title + platform sugerido entre Instagram, LinkedIn, Blog, YouTube).",
      "Responda APENAS o JSON, sem cercas de código.",
      "",
      "SITE:",
      scrape.markdown,
    ].join("\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você retorna somente JSON válido." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("[analyze-competitor] AI:", aiRes.status, t.slice(0, 400));
      return json({ error: "Falha na análise IA." }, 502);
    }
    const aiData = await aiRes.json();
    const raw: string = aiData?.choices?.[0]?.message?.content ?? "";
    const clean = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();

    let parsed: any = {};
    try { parsed = JSON.parse(clean); } catch {
      return json({ error: "IA retornou formato inválido.", raw }, 502);
    }

    return json({ ok: true, url, analysis: parsed });
  } catch (e) {
    console.error("analyze-competitor error:", e);
    return json({ error: e instanceof Error ? e.message : "Erro interno" }, 500);
  }
});
