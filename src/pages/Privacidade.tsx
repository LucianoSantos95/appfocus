import { Link } from "react-router-dom";
import { PageMeta } from "@/components/seo/PageMeta";

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-background p-8 max-w-3xl mx-auto">
      <PageMeta path="/privacidade" title="Política de Privacidade" description="Como o Hub Empresarial coleta, usa e protege os dados dos usuários." />
      <Link to="/auth" className="text-primary hover:underline text-sm mb-8 inline-block">← Voltar</Link>
      <h1 className="text-3xl font-bold text-foreground mb-6">Política de Privacidade</h1>
      <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground">
        <p>Última atualização: Fevereiro de 2026</p>
        <h2 className="text-xl font-semibold text-foreground">1. Coleta de Dados</h2>
        <p>Coletamos nome, email e informações de uso para fornecer e melhorar nossos serviços.</p>
        <h2 className="text-xl font-semibold text-foreground">2. Uso dos Dados</h2>
        <p>Seus dados são utilizados exclusivamente para operação do sistema, suporte ao cliente e melhoria dos serviços.</p>
        <h2 className="text-xl font-semibold text-foreground">3. Compartilhamento</h2>
        <p>Não vendemos ou compartilhamos seus dados pessoais com terceiros, exceto quando exigido por lei.</p>
        <h2 className="text-xl font-semibold text-foreground">4. Segurança</h2>
        <p>Utilizamos criptografia e práticas de segurança para proteger seus dados. O acesso é restrito a pessoal autorizado.</p>
        <h2 className="text-xl font-semibold text-foreground">5. Seus Direitos</h2>
        <p>Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento através do email: comercial@focusinteligente.com.br</p>
        <h2 className="text-xl font-semibold text-foreground">6. Cookies</h2>
        <p>Utilizamos cookies essenciais para manter sua sessão ativa e melhorar a experiência de uso.</p>
      </div>
    </div>
  );
}
