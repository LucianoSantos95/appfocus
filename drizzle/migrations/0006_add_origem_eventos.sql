ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS origem text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text;