import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  FolderKanban,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  dadosClientes,
  dadosFinanceiro,
  dadosProjetos,
  type DemoModule,
} from "@/lib/demo-data";

interface Props {
  module: DemoModule;
}

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function DemoBadge() {
  return (
    <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
      <Sparkles className="h-3 w-3" />
      Modo demonstração
    </Badge>
  );
}

function FinanceiroDemo() {
  const f = dadosFinanceiro;
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" /> Finanças
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão completa do seu fluxo financeiro
          </p>
        </div>
        <DemoBadge />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4 text-success" /> Receita do mês
          </div>
          <p className="text-2xl font-bold text-foreground">{fmtBRL(f.receitaMes)}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <ArrowDownRight className="h-4 w-4 text-destructive" /> Despesas do mês
          </div>
          <p className="text-2xl font-bold text-foreground">{fmtBRL(f.despesasMes)}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Wallet className="h-4 w-4 text-primary" /> Saldo atual
          </div>
          <p className="text-2xl font-bold text-foreground">{fmtBRL(f.saldoAtual)}</p>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Meta de receita</h3>
          <span className="text-sm text-muted-foreground">
            {fmtBRL(f.receitaMes)} de {fmtBRL(f.metas.receitaMeta)}
          </span>
        </div>
        <Progress value={f.metas.progresso} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">{f.metas.progresso}% atingido</p>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold text-foreground mb-4">Últimas transações</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {f.transacoes.map((t, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{t.descricao}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{t.categoria}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{t.data}</TableCell>
                <TableCell
                  className={`text-right font-semibold ${t.tipo === "receita" ? "text-success" : "text-destructive"}`}
                >
                  {t.tipo === "receita" ? "+" : "-"}
                  {fmtBRL(t.valor)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function ClientesDemo() {
  const total = dadosClientes.reduce((s, c) => s + c.valor, 0);
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Clientes & CRM
          </h1>
          <p className="text-muted-foreground mt-1">Sua carteira e pipeline de vendas</p>
        </div>
        <DemoBadge />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Total de clientes</p>
          <p className="text-2xl font-bold text-foreground mt-1">{dadosClientes.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Clientes ativos</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {dadosClientes.filter((c) => c.fase === "Ativo").length}
          </p>
        </Card>
        <Card className="p-5 col-span-2 md:col-span-1">
          <p className="text-sm text-muted-foreground">Pipeline total</p>
          <p className="text-2xl font-bold text-foreground mt-1">{fmtBRL(total)}</p>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-foreground mb-4">Sua carteira</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Fase</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Próximo contato</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dadosClientes.map((c, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell>
                  <Badge variant="outline">{c.fase}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{c.status}</TableCell>
                <TableCell className="text-muted-foreground">{c.proximoContato}</TableCell>
                <TableCell className="text-right font-semibold">{fmtBRL(c.valor)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function ProjetosDemo() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-primary" /> Projetos
          </h1>
          <p className="text-muted-foreground mt-1">
            Entregas, prazos e progresso dos seus clientes
          </p>
        </div>
        <DemoBadge />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dadosProjetos.map((p, i) => (
          <Card key={i} className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-foreground">{p.nome}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{p.cliente}</p>
              </div>
              <Badge
                variant="outline"
                className={
                  p.prioridade === "Alta"
                    ? "border-destructive/40 text-destructive"
                    : p.prioridade === "Média"
                    ? "border-warning/40 text-warning"
                    : "border-muted-foreground/30"
                }
              >
                {p.prioridade}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{p.status}</span>
              <span>Prazo: {p.prazo}</span>
            </div>
            <div>
              <Progress value={p.progresso} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1.5">{p.progresso}% concluído</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function DemoModulePreview({ module }: Props) {
  if (module === "financeiro") return <FinanceiroDemo />;
  if (module === "clientes") return <ClientesDemo />;
  if (module === "projetos") return <ProjetosDemo />;
  return null;
}
