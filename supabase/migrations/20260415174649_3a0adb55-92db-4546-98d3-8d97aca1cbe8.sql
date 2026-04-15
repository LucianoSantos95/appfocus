
CREATE TABLE public.campanha_clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id UUID NOT NULL REFERENCES public.campanhas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campanha_id, cliente_id)
);

ALTER TABLE public.campanha_clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own campanha_clientes"
ON public.campanha_clientes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campanha_clientes"
ON public.campanha_clientes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own campanha_clientes"
ON public.campanha_clientes FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_campanha_clientes_campanha ON public.campanha_clientes(campanha_id);
CREATE INDEX idx_campanha_clientes_cliente ON public.campanha_clientes(cliente_id);
