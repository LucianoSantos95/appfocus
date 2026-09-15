-- Leitura pública do bucket 'produtos' limitada a imagens de capa na raiz.
-- Qualquer arquivo dentro de pastas (ex.: entregas/) deixa de ser público.
DROP POLICY IF EXISTS "Leitura publica das capas de produtos" ON storage.objects;

CREATE POLICY "produtos_public_cover_read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'produtos'
  AND array_length(storage.foldername(name), 1) IS NULL
  AND lower(name) ~ '\.(png|jpe?g|gif|webp|svg)$'
);