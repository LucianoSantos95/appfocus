ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS imagens text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS capa text,
  ADD COLUMN IF NOT EXISTS detalhes text;

DROP POLICY IF EXISTS "Admins gerenciam imagens de produtos" ON storage.objects;
CREATE POLICY "Admins gerenciam imagens de produtos"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'produtos' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'produtos' AND public.has_role(auth.uid(), 'admin'));