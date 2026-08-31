import { Link } from "react-router-dom";
import { PageMeta } from "@/components/seo/PageMeta";

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-background p-8 max-w-3xl mx-auto">
      <PageMeta
        path="/privacidade"
        title="Política de Privacidade"
        suffix="Hub Central"
        description="Quais dados o Hub Central coleta ao liberar templates e materiais (nome, e-mail e telefone no suporte), como usamos e como solicitar exclusão."
      />
      <Link to="/" className="text-primary hover:underline text-sm mb-8 inline-block">← Voltar</Link>
      <h1 className="text-3xl font-bold text-foreground mb-6">Política de Privacidade</h1>
      <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground">
        <p>Última atualização: Agosto de 2026</p>
        <h2 className="text-xl font-semibold text-foreground">1. Coleta de Dados</h2>
        <p>Coletamos apenas o que você informa nos formulários do Hub Central: nome e e-mail para liberar um material do catálogo; nome, e-mail, telefone e mensagem no formulário de suporte; e, opcionalmente, nome, e-mail e comentário no formulário de feedback. Também registramos eventos de uso anônimos (visualizações e downloads por produto) para medir o que é mais útil.</p>
        <h2 className="text-xl font-semibold text-foreground">2. Uso dos Dados</h2>
        <p>Usamos os dados para entregar o material solicitado, enviar o e-mail de confirmação, responder ao seu contato e melhorar o catálogo. Não usamos seus dados para outra finalidade sem avisar.</p>
        <h2 className="text-xl font-semibold text-foreground">3. Compartilhamento</h2>
        <p>Não vendemos nem compartilhamos seus dados pessoais com terceiros, exceto com os serviços necessários para operar o site (hospedagem, banco de dados e envio de e-mails) ou quando exigido por lei.</p>
        <h2 className="text-xl font-semibold text-foreground">4. Segurança</h2>
        <p>Os dados ficam em banco com acesso restrito e conexões criptografadas. Somente pessoas autorizadas da Focus acessam os registros.</p>
        <h2 className="text-xl font-semibold text-foreground">5. Seus Direitos (LGPD)</h2>
        <p>Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento pelo e-mail: comercial@focusinteligente.com.br</p>
        <h2 className="text-xl font-semibold text-foreground">6. Cookies e medição</h2>
        <p>Utilizamos cookies e ferramentas de medição de audiência (Google Analytics e Microsoft Clarity) para entender como o catálogo é usado.</p>
      </div>
    </div>
  );
}
