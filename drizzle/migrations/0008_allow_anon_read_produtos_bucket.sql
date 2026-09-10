CREATE POLICY "Leitura publica das capas de produtos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'produtos');