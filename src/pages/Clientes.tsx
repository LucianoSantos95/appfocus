import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UserCheck,
  Plus,
  Search,
  ArrowLeft,
  MoreHorizontal,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Cliente {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "ativo" | "inativo" | "prospecto";
  totalValue: number;
  lastInteraction: string;
}

const mockClientes: Cliente[] = [
  {
    id: "1",
    name: "Tech Solutions Ltda",
    email: "contato@techsolutions.com",
    phone: "(11) 3333-1111",
    status: "ativo",
    totalValue: 125000,
    lastInteraction: "2025-01-28",
  },
  {
    id: "2",
    name: "Grupo ABC",
    email: "financeiro@grupoabc.com",
    phone: "(11) 3333-2222",
    status: "ativo",
    totalValue: 85000,
    lastInteraction: "2025-01-25",
  },
  {
    id: "3",
    name: "StartupCo",
    email: "ceo@startupco.io",
    phone: "(11) 99999-3333",
    status: "ativo",
    totalValue: 45000,
    lastInteraction: "2025-01-20",
  },
  {
    id: "4",
    name: "Empresa XYZ",
    email: "comercial@xyz.com.br",
    phone: "(11) 3333-4444",
    status: "prospecto",
    totalValue: 0,
    lastInteraction: "2025-01-15",
  },
  {
    id: "5",
    name: "Antiga Corp",
    email: "contato@antigacorp.com",
    phone: "(11) 3333-5555",
    status: "inativo",
    totalValue: 32000,
    lastInteraction: "2024-08-10",
  },
];

const statusCliente = {
  ativo: { label: "Ativo", class: "bg-success/10 text-success" },
  inativo: { label: "Inativo", class: "bg-muted text-muted-foreground" },
  prospecto: { label: "Prospecto", class: "bg-primary/10 text-primary" },
};

export default function Clientes() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="h-9 w-9"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
              <p className="text-muted-foreground mt-1">
                Cadastro e relacionamento com clientes
              </p>
            </div>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-80 bg-muted border-border"
          />
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border/50 shadow-premium overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Cliente</TableHead>
                <TableHead className="text-muted-foreground">Contato</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Valor Total</TableHead>
                <TableHead className="text-muted-foreground">Última Interação</TableHead>
                <TableHead className="text-muted-foreground w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockClientes.map((c) => (
                <TableRow key={c.id} className="border-border/50">
                  <TableCell>
                    <p className="font-medium text-foreground">{c.name}</p>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="text-foreground">{c.email}</p>
                      <p className="text-muted-foreground">{c.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        statusCliente[c.status].class
                      )}
                    >
                      {statusCliente[c.status].label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-foreground">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span>R$ {c.totalValue.toLocaleString("pt-BR")}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(c.lastInteraction).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
