
-- Agenda items table
CREATE TABLE public.agenda_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  type text NOT NULL DEFAULT 'meeting',
  priority text DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agenda_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own agenda_items" ON public.agenda_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own agenda_items" ON public.agenda_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own agenda_items" ON public.agenda_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own agenda_items" ON public.agenda_items FOR DELETE USING (auth.uid() = user_id);

-- Bulletin notes table
CREATE TABLE public.bulletin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  content text NOT NULL,
  author text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bulletin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own bulletin_notes" ON public.bulletin_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bulletin_notes" ON public.bulletin_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bulletin_notes" ON public.bulletin_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bulletin_notes" ON public.bulletin_notes FOR DELETE USING (auth.uid() = user_id);
