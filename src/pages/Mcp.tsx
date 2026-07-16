import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  ShieldCheck,
  Zap,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MCP_URL =
  "https://hnextembswhejumvxbzd.supabase.co/functions/v1/mcp";

const TOOLS: Array<{
  name: string;
  title: string;
  desc: string;
  badge?: string;
}> = [
  { name: "list_clientes", title: "Listar clientes", desc: "Consulta prospects e clientes ativos com filtro por status." },
  { name: "list_projetos", title: "Listar projetos", desc: "Lista projetos em andamento e concluídos da operação." },
  { name: "list_tarefas", title: "Listar tarefas", desc: "Filtra tarefas por status (pendente, em andamento, concluída)." },
  { name: "create_tarefa", title: "Criar tarefa", desc: "Cria tarefa com título, prioridade, prazo e categoria." },
  { name: "financeiro_resumo", title: "Resumo financeiro", desc: "Soma receitas, despesas e saldo em um período." },
  { name: "funnel_summary", title: "Funil de conversão", desc: "Contagem por estágio e taxa de conversão.", badge: "admin" },
  { name: "list_hot_leads", title: "Leads quentes", desc: "Usuários prontos para conversão comercial.", badge: "admin" },
  { name: "mark_contacted", title: "Registrar contato", desc: "Registra touchpoint (call, e-mail, WhatsApp).", badge: "admin" },
  { name: "send_conversion_nudge", title: "Nudge de conversão", desc: "Envia cupom 20% OFF via notificação in-app.", badge: "admin" },
];

const FAQ = [
  {
    q: "O que é MCP?",
    a: "Model Context Protocol é um padrão aberto que permite que assistentes de IA como ChatGPT, Claude, Cursor e Codex conectem-se a aplicações externas e usem suas ferramentas de forma segura.",
  },
  {
    q: "Preciso pagar algo a mais?",
    a: "Não. O acesso via MCP está incluso em qualquer plano ativo do Hub Empresarial, incluindo o teste gratuito.",
  },
  {
    q: "Meus dados ficam seguros?",
    a: "Sim. Autenticação via OAuth 2.1 com Supabase Auth, RLS por usuário em todas as tabelas e tokens nunca expostos ao modelo de IA.",
  },
  {
    q: "Quais assistentes são suportados?",
    a: "Qualquer cliente compatível com MCP: ChatGPT (Team/Enterprise), Claude Desktop, Cursor, Codex CLI, Windsurf e outros.",
  },
  {
    q: "Posso desconectar quando quiser?",
    a: "Sim. Basta remover a integração no seu cliente de IA. O acesso é revogado imediatamente.",
  },
];

function track(event: string, params?: Record<string, unknown>) {
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  w.gtag?.("event", event, params ?? {});
}

export default function Mcp() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    track("mcp_page_view");
  }, []);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(MCP_URL);
    setCopied(true);
    track("mcp_url_copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen gradient-dark text-foreground">
      <Helmet>
        <title>Hub Empresarial no ChatGPT e Claude via MCP | Focus Inteligente</title>
        <meta
          name="description"
          content="Conecte o Hub Empresarial ao ChatGPT, Claude, Cursor e Codex via MCP. Consulte finanças, crie tarefas e converse com sua operação por IA. Grátis para clientes."
        />
        <link rel="canonical" href="https://app.focusinteligente.com.br/mcp" />
        <meta property="og:title" content="Hub Empresarial no ChatGPT e Claude via MCP" />
        <meta property="og:description" content="Conecte o Hub Empresarial ao ChatGPT, Claude, Cursor e Codex via MCP. Grátis para clientes." />
        <meta property="og:url" content="https://app.focusinteligente.com.br/mcp" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "Conectar o Hub Empresarial ao ChatGPT ou Claude via MCP",
          step: [
            { "@type": "HowToStep", name: "Abrir integrações", text: "No ChatGPT ou Claude, acesse Configurações → Conectores." },
            { "@type": "HowToStep", name: "Adicionar servidor MCP", text: `Cole a URL do servidor: ${MCP_URL}` },
            { "@type": "HowToStep", name: "Autenticar", text: "Entre com sua conta do Hub Empresarial via OAuth." },
            { "@type": "HowToStep", name: "Começar a usar", text: "Peça ao assistente para listar clientes, criar tarefas ou resumir finanças." },
          ],
        })}</script>
      </Helmet>

      <header className="border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg gradient-text">Hub Empresarial</Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 max-w-5xl">
        {/* Hero */}
        <section className="text-center mb-16">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
            <Sparkles className="w-3 h-3 mr-1" /> Novo — Integração nativa
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Converse com seu Hub direto do{" "}
            <span className="gradient-text">ChatGPT, Claude e Cursor</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            O Hub Empresarial é um servidor MCP oficial. Peça relatórios financeiros,
            crie tarefas e consulte clientes usando seu assistente de IA favorito.
          </p>

          {/* URL do servidor */}
          <div className="max-w-xl mx-auto rounded-xl border border-border/60 bg-card/60 backdrop-blur p-4 flex items-center gap-3">
            <code className="flex-1 text-left text-xs md:text-sm text-foreground/90 truncate font-mono">
              {MCP_URL}
            </code>
            <Button size="sm" variant="outline" onClick={copyUrl}>
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Precisa estar autenticado no Hub para conectar
          </p>
        </section>

        {/* O que é MCP */}
        <section className="grid md:grid-cols-3 gap-6 mb-20">
          {[
            { icon: Bot, title: "IA que age", desc: "Não é só chat: o assistente executa ações reais na sua operação." },
            { icon: ShieldCheck, title: "Seguro por padrão", desc: "OAuth 2.1, RLS por usuário e tokens nunca expostos." },
            { icon: Zap, title: "Configuração em minutos", desc: "Cole a URL, autentique e comece a usar. Sem código." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border/60 bg-card/60 backdrop-blur p-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* Tools disponíveis */}
        <section className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Ferramentas disponíveis</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            9 ferramentas prontas para uso — consulta e ação nos módulos principais do Hub.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map((t) => (
              <div key={t.name} className="rounded-xl border border-border/60 bg-card/60 backdrop-blur p-5">
                <div className="flex items-start justify-between mb-2">
                  <code className="text-xs font-mono text-primary">{t.name}</code>
                  {t.badge && (
                    <Badge variant="outline" className="text-[10px] h-5">{t.badge}</Badge>
                  )}
                </div>
                <h3 className="font-semibold text-sm mb-1">{t.title}</h3>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Guia de conexão */}
        <section className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Como conectar</h2>
          <Tabs defaultValue="chatgpt" onValueChange={(v) => track("mcp_docs_tab_change", { tab: v })}>
            <TabsList className="mb-6">
              <TabsTrigger value="chatgpt">ChatGPT</TabsTrigger>
              <TabsTrigger value="claude">Claude Desktop</TabsTrigger>
              <TabsTrigger value="cursor">Cursor</TabsTrigger>
              <TabsTrigger value="codex">Codex CLI</TabsTrigger>
            </TabsList>

            <TabsContent value="chatgpt" className="rounded-xl border border-border/60 bg-card/60 p-6">
              <ol className="space-y-3 text-sm list-decimal list-inside text-muted-foreground">
                <li>Abra o ChatGPT e vá em <strong className="text-foreground">Settings → Connectors</strong>.</li>
                <li>Clique em <strong className="text-foreground">Add custom connector</strong>.</li>
                <li>Cole a URL do servidor MCP acima.</li>
                <li>Complete o login OAuth com sua conta do Hub.</li>
                <li>Ative o conector na próxima conversa e peça: <em>"resuma minhas finanças do mês"</em>.</li>
              </ol>
            </TabsContent>

            <TabsContent value="claude" className="rounded-xl border border-border/60 bg-card/60 p-6">
              <ol className="space-y-3 text-sm list-decimal list-inside text-muted-foreground">
                <li>Abra <strong className="text-foreground">Claude Desktop → Settings → Connectors</strong>.</li>
                <li>Clique em <strong className="text-foreground">Add custom connector</strong>.</li>
                <li>Cole a URL do servidor e autentique via OAuth.</li>
                <li>Comece a usar: <em>"crie uma tarefa urgente para amanhã"</em>.</li>
              </ol>
            </TabsContent>

            <TabsContent value="cursor" className="rounded-xl border border-border/60 bg-card/60 p-6">
              <p className="text-sm text-muted-foreground mb-3">Adicione ao seu <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">~/.cursor/mcp.json</code>:</p>
              <pre className="text-xs bg-secondary/50 p-4 rounded-lg overflow-x-auto">
{`{
  "mcpServers": {
    "hub-empresarial": {
      "url": "${MCP_URL}"
    }
  }
}`}
              </pre>
            </TabsContent>

            <TabsContent value="codex" className="rounded-xl border border-border/60 bg-card/60 p-6">
              <p className="text-sm text-muted-foreground mb-3">No terminal, adicione o servidor:</p>
              <pre className="text-xs bg-secondary/50 p-4 rounded-lg overflow-x-auto">
{`codex mcp add hub-empresarial ${MCP_URL}`}
              </pre>
            </TabsContent>
          </Tabs>
        </section>

        {/* Casos de uso */}
        <section className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">O que você pode pedir</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Resuma minhas finanças de novembro",
              "Crie uma tarefa urgente: enviar proposta para AgroFuturo até sexta",
              "Liste meus prospects sem contato há mais de 30 dias",
              "Quais projetos estão atrasados esta semana?",
              "Registre que liguei para o João hoje e ele pediu proposta",
              "Quantos leads quentes tenho no funil agora?",
            ].map((q) => (
              <div key={q} className="rounded-lg border border-border/60 bg-card/40 p-4 text-sm italic text-foreground/80">
                "{q}"
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Pronto para conectar?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Já é cliente? Copie a URL acima. Ainda não? Comece com 7 dias grátis, sem cartão.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button asChild size="lg" className="btn-hero text-foreground" onClick={() => track("mcp_cta_signup")}>
              <Link to="/auth">Começar grátis</Link>
            </Button>
            <Button asChild size="lg" variant="outline" onClick={() => track("mcp_cta_learn_more")}>
              <a href="https://modelcontextprotocol.io" target="_blank" rel="noreferrer">
                O que é MCP <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </Button>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Perguntas frequentes</h2>
          <div className="space-y-4">
            {FAQ.map((f) => (
              <div key={f.q} className="rounded-xl border border-border/60 bg-card/40 p-5">
                <h3 className="font-semibold mb-2">{f.q}</h3>
                <p className="text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
