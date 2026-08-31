import { Link } from "react-router-dom";
import { PageMeta } from "@/components/seo/PageMeta";

export default function Termos() {
  return (
    <div className="min-h-screen bg-background p-8 max-w-3xl mx-auto">
      <PageMeta
        path="/termos"
        title="Termos de Uso"
        suffix="Hub Central"
        description="Regras de uso do Hub Central: catálogo de templates de Notion, playbooks, sistemas e consultoria da Focus Gestão Inteligente."
      />
      <Link to="/" className="text-primary hover:underline text-sm mb-8 inline-block">← Voltar</Link>
      <h1 className="text-3xl font-bold text-foreground mb-6">Termos de Uso</h1>
      <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground">
        <p>Última atualização: Agosto de 2026</p>
        <h2 className="text-xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
        <p>Ao utilizar o Hub Central da Focus Gestão Inteligente, você concorda com estes termos. Caso não concorde, não utilize o site.</p>
        <h2 className="text-xl font-semibold text-foreground">2. Descrição do Serviço</h2>
        <p>O Hub Central é um catálogo público de materiais para organizar a operação de pequenos negócios: templates de Notion, playbooks, sistemas e sessões de diagnóstico (Advisor). Alguns itens são gratuitos e outros são pagos ou realizados sob agendamento.</p>
        <h2 className="text-xl font-semibold text-foreground">3. Acesso aos materiais</h2>
        <p>Para receber determinados materiais pedimos nome e e-mail. Não é necessário criar conta nem senha para navegar pelo catálogo.</p>
        <h2 className="text-xl font-semibold text-foreground">4. Uso dos materiais</h2>
        <p>Os materiais são para uso próprio ou do seu negócio. Não é permitido revender, redistribuir ou comercializar os arquivos e templates disponibilizados.</p>
        <h2 className="text-xl font-semibold text-foreground">5. Limitação de Responsabilidade</h2>
        <p>O conteúdo é fornecido "como está", em caráter informativo. A Focus Gestão Inteligente não garante resultados específicos nem disponibilidade ininterrupta do site.</p>
        <h2 className="text-xl font-semibold text-foreground">6. Contato</h2>
        <p>Para dúvidas sobre estes termos: comercial@focusinteligente.com.br</p>
      </div>
    </div>
  );
}
