-- ==================================================
-- Migration: 20251114042031_6a19c1fa-5f0d-49c9-bc7c-62e4e68fcd95.sql
-- ==================================================
-- Create profiles table
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  email text not null,
  name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- RLS policies for profiles
create policy "Users can view all profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Create trips table
create table public.trips (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  origin text not null,
  destination text not null,
  start_date date not null,
  end_date date not null,
  budget numeric,
  travelers integer not null default 1,
  preferences jsonb,
  created_at timestamptz not null default now()
);

alter table public.trips enable row level security;

-- RLS policies for trips
create policy "Users can view own trips"
  on public.trips for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create own trips"
  on public.trips for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own trips"
  on public.trips for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own trips"
  on public.trips for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create itinerary_days table
create table public.itinerary_days (
  id uuid not null default gen_random_uuid() primary key,
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_number integer not null,
  date date not null,
  summary text,
  activities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.itinerary_days enable row level security;

-- RLS policies for itinerary_days
create policy "Users can view itinerary days for own trips"
  on public.itinerary_days for select
  to authenticated
  using (
    exists (
      select 1 from public.trips
      where trips.id = itinerary_days.trip_id
      and trips.user_id = auth.uid()
    )
  );

create policy "Users can create itinerary days for own trips"
  on public.itinerary_days for insert
  to authenticated
  with check (
    exists (
      select 1 from public.trips
      where trips.id = itinerary_days.trip_id
      and trips.user_id = auth.uid()
    )
  );

create policy "Users can update itinerary days for own trips"
  on public.itinerary_days for update
  to authenticated
  using (
    exists (
      select 1 from public.trips
      where trips.id = itinerary_days.trip_id
      and trips.user_id = auth.uid()
    )
  );

create policy "Users can delete itinerary days for own trips"
  on public.itinerary_days for delete
  to authenticated
  using (
    exists (
      select 1 from public.trips
      where trips.id = itinerary_days.trip_id
      and trips.user_id = auth.uid()
    )
  );

-- Create flight_options table
create table public.flight_options (
  id uuid not null default gen_random_uuid() primary key,
  trip_id uuid not null references public.trips(id) on delete cascade,
  airline text not null,
  origin text not null,
  destination text not null,
  departure_time timestamptz not null,
  arrival_time timestamptz not null,
  price numeric not null,
  link text,
  raw_data jsonb,
  created_at timestamptz not null default now()
);

alter table public.flight_options enable row level security;

-- RLS policies for flight_options
create policy "Users can view flight options for own trips"
  on public.flight_options for select
  to authenticated
  using (
    exists (
      select 1 from public.trips
      where trips.id = flight_options.trip_id
      and trips.user_id = auth.uid()
    )
  );

create policy "Users can create flight options for own trips"
  on public.flight_options for insert
  to authenticated
  with check (
    exists (
      select 1 from public.trips
      where trips.id = flight_options.trip_id
      and trips.user_id = auth.uid()
    )
  );

create policy "Users can update flight options for own trips"
  on public.flight_options for update
  to authenticated
  using (
    exists (
      select 1 from public.trips
      where trips.id = flight_options.trip_id
      and trips.user_id = auth.uid()
    )
  );

create policy "Users can delete flight options for own trips"
  on public.flight_options for delete
  to authenticated
  using (
    exists (
      select 1 from public.trips
      where trips.id = flight_options.trip_id
      and trips.user_id = auth.uid()
    )
  );

-- Function to handle new user profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ==================================================
-- Migration: 20251114062802_f78e63a5-921f-4c6e-8f50-84536a42a01f.sql
-- ==================================================
-- Fix RLS policies for profiles table to prevent data exposure

-- Drop the insecure policy that allows viewing all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create secure policy: users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Add policy for users to delete their own profile (if needed)
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- ==================================================
-- Migration: 20251208234315_9da87f42-a143-4446-b263-a4fa16b49af7.sql
-- ==================================================
-- Create conversations table to store chat sessions
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  destination TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL
);

-- Create messages table to store individual chat messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  html_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can view own conversations" 
ON public.conversations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" 
ON public.conversations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" 
ON public.conversations 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for messages (through conversation ownership)
CREATE POLICY "Users can view messages of own conversations" 
ON public.messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.conversations 
  WHERE conversations.id = messages.conversation_id 
  AND conversations.user_id = auth.uid()
));

CREATE POLICY "Users can create messages in own conversations" 
ON public.messages 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.conversations 
  WHERE conversations.id = messages.conversation_id 
  AND conversations.user_id = auth.uid()
));

CREATE POLICY "Users can delete messages of own conversations" 
ON public.messages 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.conversations 
  WHERE conversations.id = messages.conversation_id 
  AND conversations.user_id = auth.uid()
));

-- Create index for faster queries
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- ==================================================
-- Migration: 20251213025948_9cec383a-5c7b-4595-bf57-a5529b2d59a2.sql
-- ==================================================
-- Add country column to profiles table
ALTER TABLE public.profiles ADD COLUMN country text;

-- ==================================================
-- Migration: 20251213040908_e4219e6b-4f3e-4701-84ae-d4ce2f7c4f10.sql
-- ==================================================
-- Create password reset tokens table
CREATE TABLE public.password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster token lookup
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_email ON public.password_reset_tokens(email);

-- Enable RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- No policies needed - this table should only be accessed by service role from edge functions

-- ==================================================
-- Migration: 20251213042007_053b24bd-7292-4c45-a3b4-8b2357ceb4cb.sql
-- ==================================================
-- Block all public access to password_reset_tokens table
-- Only service role (used by edge functions) should access this table
CREATE POLICY "No public access" ON public.password_reset_tokens
FOR ALL USING (false);

-- ==================================================
-- Migration: 20251218180423_7fb6155b-28e0-485d-9662-95746be19398.sql
-- ==================================================
-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to view avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ==================================================
-- Migration: 20251218181901_0122e33e-bdaf-4833-82b4-8a1b9838649c.sql
-- ==================================================
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

-- ==================================================
-- Migration: 20251229161221_0f299e01-83e5-482f-9da7-72c65b3cb5d0.sql
-- ==================================================
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create admin policies for viewing all data
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all trips"
ON public.trips
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all conversations"
ON public.conversations
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all messages"
ON public.messages
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = auth.uid()
  )
);

-- Insert admin role for the specified user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'molinacd910@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- ==================================================
-- Migration: 20251229161719_0b64807b-28af-49a7-95e8-cb49b6312fe8.sql
-- ==================================================
-- Drop existing policies that may conflict
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Create a single unified policy for viewing roles
CREATE POLICY "Users can view own roles or admins view all"
ON public.user_roles
FOR SELECT
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'admin')
);

-- ==================================================
-- Migration: 20260113220844_0c0e6de6-cbe3-4538-842a-027b53db22d7.sql
-- ==================================================
-- Tabla para imÃ¡genes de destinos turÃ­sticos
CREATE TABLE public.destination_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city_name TEXT NOT NULL,
  city_name_en TEXT, -- nombre en inglÃ©s para bÃºsquedas
  country TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(city_name, country)
);

-- Permitir lectura pÃºblica (no requiere auth)
ALTER TABLE public.destination_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view destination images"
ON public.destination_images
FOR SELECT
USING (true);

-- Solo admins pueden modificar
CREATE POLICY "Admins can manage destination images"
ON public.destination_images
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Ãndice para bÃºsquedas rÃ¡pidas
CREATE INDEX idx_destination_images_city ON public.destination_images(city_name);
CREATE INDEX idx_destination_images_city_en ON public.destination_images(city_name_en);
CREATE INDEX idx_destination_images_country ON public.destination_images(country);

-- ==================================================
-- Migration: 20260116164821_ad7dab3f-95d1-404c-8cf4-95ef7c58835d.sql
-- ==================================================
-- Add image_url column to trips table to persist the itinerary image
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS image_url TEXT;


