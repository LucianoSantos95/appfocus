
-- Fix broken storage policies: use storage.objects.name (folder = first segment of path),
-- and verify the parent entity belongs to the current user.

-- colaborador-docs
DROP POLICY IF EXISTS colaborador_docs_owner_select ON storage.objects;
DROP POLICY IF EXISTS colaborador_docs_owner_insert ON storage.objects;
DROP POLICY IF EXISTS colaborador_docs_owner_delete ON storage.objects;

CREATE POLICY colaborador_docs_owner_select ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'colaborador-docs'
  AND EXISTS (
    SELECT 1 FROM public.colaboradores c
    WHERE (c.id)::text = (storage.foldername(storage.objects.name))[1]
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY colaborador_docs_owner_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'colaborador-docs'
  AND EXISTS (
    SELECT 1 FROM public.colaboradores c
    WHERE (c.id)::text = (storage.foldername(storage.objects.name))[1]
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY colaborador_docs_owner_delete ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'colaborador-docs'
  AND EXISTS (
    SELECT 1 FROM public.colaboradores c
    WHERE (c.id)::text = (storage.foldername(storage.objects.name))[1]
      AND c.user_id = auth.uid()
  )
);

-- projeto-anexos
DROP POLICY IF EXISTS projeto_anexos_owner_select ON storage.objects;
DROP POLICY IF EXISTS projeto_anexos_owner_insert ON storage.objects;
DROP POLICY IF EXISTS projeto_anexos_owner_delete ON storage.objects;

CREATE POLICY projeto_anexos_owner_select ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'projeto-anexos'
  AND EXISTS (
    SELECT 1 FROM public.projetos p
    WHERE (p.id)::text = (storage.foldername(storage.objects.name))[1]
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY projeto_anexos_owner_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'projeto-anexos'
  AND EXISTS (
    SELECT 1 FROM public.projetos p
    WHERE (p.id)::text = (storage.foldername(storage.objects.name))[1]
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY projeto_anexos_owner_delete ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'projeto-anexos'
  AND EXISTS (
    SELECT 1 FROM public.projetos p
    WHERE (p.id)::text = (storage.foldername(storage.objects.name))[1]
      AND p.user_id = auth.uid()
  )
);

-- Public bucket listing: keep email-assets reachable via public URL (bucket is public),
-- but drop the broad SELECT policy that allows listing/enumeration via the storage API.
DROP POLICY IF EXISTS "Email assets are publicly accessible" ON storage.objects;

-- Realtime channel scoping: prevent any authenticated user from subscribing to
-- arbitrary broadcast/presence topics. App only relies on postgres_changes (not
-- gated by realtime.messages), so deny by default for broadcast/presence by
-- requiring topic to start with the user's own uid.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'realtime' AND tablename = 'messages') THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "realtime_authenticated_user_scoped_topics" ON realtime.messages';
    EXECUTE $p$
      CREATE POLICY "realtime_authenticated_user_scoped_topics"
      ON realtime.messages
      FOR SELECT
      TO authenticated
      USING (
        realtime.topic() LIKE (auth.uid()::text || ':%')
      )
    $p$;
  END IF;
END $$;
