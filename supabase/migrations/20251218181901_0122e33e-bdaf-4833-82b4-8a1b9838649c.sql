-- Create visited_places table
CREATE TABLE public.visited_places (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_name TEXT NOT NULL,
  country TEXT NOT NULL,
  state TEXT,
  city TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  visited_at DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visited_places ENABLE ROW LEVEL SECURITY;

-- Users can view their own visited places
CREATE POLICY "Users can view own visited places"
ON public.visited_places
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own visited places
CREATE POLICY "Users can insert own visited places"
ON public.visited_places
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own visited places
CREATE POLICY "Users can update own visited places"
ON public.visited_places
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own visited places
CREATE POLICY "Users can delete own visited places"
ON public.visited_places
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_visited_places_user_id ON public.visited_places(user_id);