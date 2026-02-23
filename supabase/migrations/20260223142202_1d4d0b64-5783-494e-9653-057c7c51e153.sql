
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read feedbacks" ON public.feedbacks;

-- Create a new policy that only allows admins to read all feedbacks
CREATE POLICY "Admins can read all feedbacks"
ON public.feedbacks
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
