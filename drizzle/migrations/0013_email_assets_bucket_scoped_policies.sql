-- Scope access to the public email-assets bucket: read only image files, writes owner-only.
DROP POLICY IF EXISTS "Email assets are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "email_assets_public_image_read" ON storage.objects;
CREATE POLICY "email_assets_public_image_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'email-assets'
  AND lower(name) ~ '\.(png|jpe?g|gif|webp|svg)$'
);

DROP POLICY IF EXISTS "email_assets_owner_insert" ON storage.objects;
CREATE POLICY "email_assets_owner_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'email-assets' AND public.is_platform_owner());

DROP POLICY IF EXISTS "email_assets_owner_update" ON storage.objects;
CREATE POLICY "email_assets_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'email-assets' AND public.is_platform_owner())
WITH CHECK (bucket_id = 'email-assets' AND public.is_platform_owner());

DROP POLICY IF EXISTS "email_assets_owner_delete" ON storage.objects;
CREATE POLICY "email_assets_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'email-assets' AND public.is_platform_owner());