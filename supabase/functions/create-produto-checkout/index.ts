// Checkout Asaas para produto pago do Hub Central.
// Público de propósito: o comprador do catálogo não tem login.
// Cria a compra como "pendente" e devolve a URL do checkout hospedado.
// A liberação do acesso acontece só no webhook (asaas-webhook).
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { asaas, isAsaasConfigured } from "../_shared/asaas.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!isAsaasConfigured()) return json(503, { error: "Pagamento indisponível no momento." });

    const body = await req.json().catch(() => ({}));
    const slug = String(body?.slug || "").trim().slice(0, 120).replace(/[^a-zA-Z0-9_-]/g, "");
    const nome = String(body?.nome || "").trim().slice(0, 100);
    const email = String(body?.email || "").trim().toLowerCase().slice(0, 255);

    if (!slug) return json(400, { error: "Produto inválido." });
    if (nome.length < 2) return json(400, { error: "Informe seu nome." });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json(400, { error: "Informe um e-mail válido." });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    const { data: produto } = await admin
      .from("produtos")
      .select("slug,nome,preco,gratuito,ativo,arquivado")
      .eq("slug", slug)
      .maybeSingle();

    if (!produto || produto.ativo === false || produto.arquivado === true) {
      return json(400, { error: "Produto indisponível." });
    }
    if (produto.gratuito || !produto.preco || Number(produto.preco) <= 0) {
      return json(400, { error: "Este produto não é pago." });
    }

    // Rate limit simples: no máximo 5 tentativas por e-mail em 10 minutos.
    const desde = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("compras")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", desde);
    if ((count ?? 0) >= 5) return json(429, { error: "Muitas tentativas. Tente de novo em alguns minutos." });

    const valor = Number(produto.preco);

    const { data: compra, error: compraErr } = await admin
      .from("compras")
      .insert({
        produto_slug: produto.slug,
        produto_nome: produto.nome,
        nome,
        email,
        valor,
        status: "pendente",
      })
      .select("id, token_acesso")
      .single();
    if (compraErr || !compra) return json(500, { error: "Não foi possível iniciar a compra." });

    // Asaas rejeita URLs de localhost/preview — força domínio público fora de produção.
    const rawOrigin = req.headers.get("origin") ?? "";
    const isPublic = /^https:\/\/(app\.focusinteligente\.com\.br|[^/]+\.lovable\.app)/i.test(rawOrigin);
    const origin = isPublic ? rawOrigin : "https://app.focusinteligente.com.br";
    const acessoUrl = `${origin}/acesso/${compra.token_acesso}`;

    const baseBody = {
      minutesToExpire: 60,
      chargeTypes: ["DETACHED"],
      callback: {
        successUrl: acessoUrl,
        cancelUrl: `${origin}/?produto=${encodeURIComponent(produto.slug)}`,
        expiredUrl: `${origin}/?produto=${encodeURIComponent(produto.slug)}`,
      },
      items: [{
        name: produto.nome,
        description: `Acesso a ${produto.nome} — Hub Central Focus`,
        quantity: 1,
        value: valor,
      }],
      // Sem customerData: o Asaas exige cpfCnpj quando ele é enviado, e não temos
      // o CPF/CNPJ do comprador. A própria página do Asaas coleta esses dados.
      externalReference: `produto|${compra.id}`,
    };

    // Tenta oferecer o máximo de formas de pagamento que a conta aceitar.
    const tentativas: string[][] = [
      ["PIX", "BOLETO", "CREDIT_CARD"],
      ["PIX", "BOLETO"],
      ["PIX"],
    ];

    let checkout = await asaas("/checkouts", "POST", {
      ...baseBody,
      billingTypes: tentativas[0],
      dueDateLimitDays: 3,
    });
    if (checkout.ok) {
      console.log("[create-produto-checkout] formas aceitas:", tentativas[0].join(","));
    }

    for (let i = 1; i < tentativas.length && !checkout.ok; i++) {
      if (!/billingTypes/i.test(JSON.stringify(checkout.data ?? {}))) break;
      console.warn("[create-produto-checkout] billingTypes recusado; tentando", tentativas[i].join(","));
      checkout = await asaas("/checkouts", "POST", {
        ...baseBody,
        billingTypes: tentativas[i],
        dueDateLimitDays: 3,
      });
      if (checkout.ok) {
        console.log("[create-produto-checkout] formas aceitas:", tentativas[i].join(","));
      }
    }

    if (!checkout.ok) {
      await admin.from("compras").update({ status: "erro" }).eq("id", compra.id);
      const detalhe = checkout.data?.errors?.[0]?.description || checkout.data?.message;
      console.error("[create-produto-checkout] Asaas falhou", checkout.status, JSON.stringify(checkout.data).slice(0, 400));
      return json(502, { error: detalhe || "Não foi possível abrir o pagamento. Tente de novo." });
    }

    await admin.from("compras").update({ asaas_checkout_id: checkout.data?.id ?? null }).eq("id", compra.id);

    const url = checkout.data?.link ?? checkout.data?.url ?? checkout.data?.checkoutUrl ?? null;
    if (!url) return json(502, { error: "Checkout criado sem link. Tente de novo." });

    return json(200, { url, token: compra.token_acesso });
  } catch (e) {
    console.error("create-produto-checkout error", e);
    return json(500, { error: e instanceof Error ? e.message : "Erro inesperado" });
  }
});
