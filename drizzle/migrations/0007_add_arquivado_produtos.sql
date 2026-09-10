ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS arquivado boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS produtos_arquivado_idx ON public.produtos (arquivado);