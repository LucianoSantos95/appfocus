import { Link } from "react-router-dom";
import { PageMeta } from "@/components/seo/PageMeta";

export default function Termos() {
  return (
    <div className="min-h-screen bg-background p-8 max-w-3xl mx-auto">
      <PageMeta path="/termos" title="Termos de Uso" description="Termos de uso do Hub Empresarial da Focus Inteligente." />
      <Link to="/auth" className="text-primary hover:underline text-sm mb-8 inline-block">← Voltar</Link>
      <h1 className="text-3xl font-bold text-foreground mb-6">Termos de Uso</h1>
      <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground">
        <p>Última atualização: Fevereiro de 2026</p>
        <h2 className="text-xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
        <p>Ao utilizar o Hub Empresarial da Focus Inteligente, você concorda com estes termos de uso. Caso não concorde, não utilize o sistema.</p>
        <h2 className="text-xl font-semibold text-foreground">2. Descrição do Serviço</h2>
        <p>O Hub Empresarial é um sistema de gestão empresarial que oferece módulos de finanças, RH, marketing, projetos, clientes, atividades e processos.</p>
        <h2 className="text-xl font-semibold text-foreground">3. Conta do Usuário</h2>
        <p>Você é responsável por manter a segurança de sua conta e senha. A Focus Inteligente não se responsabiliza por acessos não autorizados à sua conta.</p>
        <h2 className="text-xl font-semibold text-foreground">4. Planos e Pagamentos</h2>
        <p>Os planos disponíveis e seus respectivos preços estão descritos na página de planos. A Focus Inteligente reserva-se o direito de alterar os preços mediante aviso prévio.</p>
        <h2 className="text-xl font-semibold text-foreground">5. Limitação de Responsabilidade</h2>
        <p>O sistema é fornecido "como está". A Focus Inteligente não garante disponibilidade ininterrupta e não se responsabiliza por perdas decorrentes do uso do sistema.</p>
        <h2 className="text-xl font-semibold text-foreground">6. Contato</h2>
        <p>Para dúvidas sobre estes termos: comercial@focusinteligente.com.br</p>
      </div>
    </div>
  );
}
