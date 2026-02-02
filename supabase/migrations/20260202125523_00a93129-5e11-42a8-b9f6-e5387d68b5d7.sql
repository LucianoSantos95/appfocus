-- Drop existing public RLS policies on clientes table
DROP POLICY IF EXISTS "Permitir atualizacao publica de clientes" ON public.clientes;
DROP POLICY IF EXISTS "Permitir exclusao publica de clientes" ON public.clientes;
DROP POLICY IF EXISTS "Permitir insercao publica de clientes" ON public.clientes;
DROP POLICY IF EXISTS "Permitir leitura publica de clientes" ON public.clientes;

-- Drop existing public RLS policies on feedbacks table
DROP POLICY IF EXISTS "Permitir insercao publica" ON public.feedbacks;
DROP POLICY IF EXISTS "Permitir leitura publica" ON public.feedbacks;

-- Create new secure RLS policies for clientes table
-- Only authenticated users can read clientes
CREATE POLICY "Authenticated users can read clientes"
ON public.clientes
FOR SELECT
TO authenticated
USING (true);

-- Only authenticated users can insert clientes
CREATE POLICY "Authenticated users can insert clientes"
ON public.clientes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only authenticated users can update clientes
CREATE POLICY "Authenticated users can update clientes"
ON public.clientes
FOR UPDATE
TO authenticated
USING (true);

-- Only authenticated users can delete clientes
CREATE POLICY "Authenticated users can delete clientes"
ON public.clientes
FOR DELETE
TO authenticated
USING (true);

-- Create new secure RLS policies for feedbacks table
-- Allow public insert for feedback submissions (forms are public)
CREATE POLICY "Anyone can submit feedback"
ON public.feedbacks
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only authenticated users can read feedbacks (protect PII)
CREATE POLICY "Authenticated users can read feedbacks"
ON public.feedbacks
FOR SELECT
TO authenticated
USING (true);