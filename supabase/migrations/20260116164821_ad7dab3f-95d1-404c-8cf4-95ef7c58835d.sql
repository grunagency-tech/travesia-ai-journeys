-- Add image_url column to trips table to persist the itinerary image
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS image_url TEXT;