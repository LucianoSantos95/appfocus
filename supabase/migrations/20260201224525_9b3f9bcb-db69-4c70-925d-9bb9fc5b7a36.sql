-- Criar tabela de clientes com campos principais e campos de IA
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  segmento TEXT,
  status TEXT NOT NULL DEFAULT 'prospecto' CHECK (status IN ('ativo', 'inativo', 'prospecto')),
  valor_total NUMERIC DEFAULT 0,
  tipo_contrato TEXT,
  ultima_interacao DATE DEFAULT CURRENT_DATE,
  anexo_url TEXT,
  empresa TEXT,
  
  -- Campos de IA (preenchidos automaticamente)
  classificacao TEXT CHECK (classificacao IN ('vip', 'padrao', 'em_risco', 'novo')),
  potencial TEXT CHECK (potencial IN ('alto', 'medio', 'baixo')),
  prioridade_contato TEXT CHECK (prioridade_contato IN ('alta', 'media', 'baixa')),
  palavras_chave TEXT[],
  proxima_acao_sugerida TEXT,
  analisado_em TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS públicas (já que não há autenticação no MVP)
CREATE POLICY "Permitir leitura publica de clientes" 
ON public.clientes 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir insercao publica de clientes" 
ON public.clientes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir atualizacao publica de clientes" 
ON public.clientes 
FOR UPDATE 
USING (true);

CREATE POLICY "Permitir exclusao publica de clientes" 
ON public.clientes 
FOR DELETE 
USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_clientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.update_clientes_updated_at();

-- Inserir dados iniciais para teste
INSERT INTO public.clientes (nome, email, telefone, status, valor_total, segmento, empresa, tipo_contrato, ultima_interacao) VALUES
('Tech Solutions Ltda', 'contato@techsolutions.com', '(11) 3333-1111', 'ativo', 125000, 'Tecnologia', 'Tech Solutions Ltda', 'Consultoria', '2025-01-28'),
('Grupo ABC', 'financeiro@grupoabc.com', '(11) 3333-2222', 'ativo', 85000, 'Varejo', 'Grupo ABC', 'Serviços', '2025-01-25'),
('StartupCo', 'ceo@startupco.io', '(11) 99999-3333', 'ativo', 45000, 'Tecnologia', 'StartupCo', 'Desenvolvimento', '2025-01-20'),
('Empresa XYZ', 'comercial@xyz.com.br', '(11) 3333-4444', 'prospecto', 0, 'Serviços', 'Empresa XYZ', NULL, '2025-01-15'),
('Nova Startup', 'contato@novastartup.com', '(11) 99999-5555', 'prospecto', 0, 'Tecnologia', 'Nova Startup', NULL, '2025-01-28'),
('Antiga Corp', 'contato@antigacorp.com', '(11) 3333-5555', 'inativo', 32000, 'Indústria', 'Antiga Corp', NULL, '2024-08-10');