
-- Recreate client-recordings policies with qualified column
DROP POLICY IF EXISTS "Users read own recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own recordings" ON storage.objects;

CREATE POLICY "Users read own recordings" ON storage.objects FOR SELECT
USING (bucket_id = 'client-recordings' AND (auth.uid())::text = (storage.foldername(storage.objects.name))[1]);
CREATE POLICY "Users upload own recordings" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'client-recordings' AND (auth.uid())::text = (storage.foldername(storage.objects.name))[1]);
CREATE POLICY "Users update own recordings" ON storage.objects FOR UPDATE
USING (bucket_id = 'client-recordings' AND (auth.uid())::text = (storage.foldername(storage.objects.name))[1])
WITH CHECK (bucket_id = 'client-recordings' AND (auth.uid())::text = (storage.foldername(storage.objects.name))[1]);
CREATE POLICY "Users delete own recordings" ON storage.objects FOR DELETE
USING (bucket_id = 'client-recordings' AND (auth.uid())::text = (storage.foldername(storage.objects.name))[1]);

-- Recreate relatorios-pdf policies with qualified column
DROP POLICY IF EXISTS "relatorios_pdf_owner_select" ON storage.objects;
DROP POLICY IF EXISTS "relatorios_pdf_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "relatorios_pdf_owner_delete" ON storage.objects;

CREATE POLICY "relatorios_pdf_owner_select" ON storage.objects FOR SELECT
USING (bucket_id = 'relatorios-pdf' AND (storage.foldername(storage.objects.name))[1] = (auth.uid())::text);
CREATE POLICY "relatorios_pdf_owner_insert" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'relatorios-pdf' AND (storage.foldername(storage.objects.name))[1] = (auth.uid())::text);
CREATE POLICY "relatorios_pdf_owner_update" ON storage.objects FOR UPDATE
USING (bucket_id = 'relatorios-pdf' AND (storage.foldername(storage.objects.name))[1] = (auth.uid())::text)
WITH CHECK (bucket_id = 'relatorios-pdf' AND (storage.foldername(storage.objects.name))[1] = (auth.uid())::text);
CREATE POLICY "relatorios_pdf_owner_delete" ON storage.objects FOR DELETE
USING (bucket_id = 'relatorios-pdf' AND (storage.foldername(storage.objects.name))[1] = (auth.uid())::text);

-- Add missing UPDATE policy for colaborador-docs
CREATE POLICY "colaborador_docs_owner_update" ON storage.objects FOR UPDATE
USING (bucket_id = 'colaborador-docs' AND EXISTS (
  SELECT 1 FROM public.colaboradores c
  WHERE (c.id)::text = (storage.foldername(storage.objects.name))[1] AND c.user_id = auth.uid()
))
WITH CHECK (bucket_id = 'colaborador-docs' AND EXISTS (
  SELECT 1 FROM public.colaboradores c
  WHERE (c.id)::text = (storage.foldername(storage.objects.name))[1] AND c.user_id = auth.uid()
));

-- Add missing UPDATE policy for projeto-anexos
CREATE POLICY "projeto_anexos_owner_update" ON storage.objects FOR UPDATE
USING (bucket_id = 'projeto-anexos' AND EXISTS (
  SELECT 1 FROM public.projetos p
  WHERE (p.id)::text = (storage.foldername(storage.objects.name))[1] AND p.user_id = auth.uid()
))
WITH CHECK (bucket_id = 'projeto-anexos' AND EXISTS (
  SELECT 1 FROM public.projetos p
  WHERE (p.id)::text = (storage.foldername(storage.objects.name))[1] AND p.user_id = auth.uid()
));

-- Allow authenticated users to read their own feedback submissions
CREATE POLICY "Users can read their own feedback" ON public.feedbacks FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
