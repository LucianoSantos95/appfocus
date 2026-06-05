
-- Fix storage UPDATE policies referencing wrong column
DROP POLICY IF EXISTS "colaborador_docs_owner_update" ON storage.objects;
CREATE POLICY "colaborador_docs_owner_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'colaborador-docs'
  AND EXISTS (
    SELECT 1 FROM public.colaboradores c
    WHERE (c.id)::text = (storage.foldername(storage.objects.name))[1]
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'colaborador-docs'
  AND EXISTS (
    SELECT 1 FROM public.colaboradores c
    WHERE (c.id)::text = (storage.foldername(storage.objects.name))[1]
      AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "projeto_anexos_owner_update" ON storage.objects;
CREATE POLICY "projeto_anexos_owner_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'projeto-anexos'
  AND EXISTS (
    SELECT 1 FROM public.projetos p
    WHERE (p.id)::text = (storage.foldername(storage.objects.name))[1]
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'projeto-anexos'
  AND EXISTS (
    SELECT 1 FROM public.projetos p
    WHERE (p.id)::text = (storage.foldername(storage.objects.name))[1]
      AND p.user_id = auth.uid()
  )
);

-- Remove sensitive tables from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.subscriptions;
ALTER PUBLICATION supabase_realtime DROP TABLE public.subscriber_extras;
ALTER PUBLICATION supabase_realtime DROP TABLE public.subscriber_followups;
