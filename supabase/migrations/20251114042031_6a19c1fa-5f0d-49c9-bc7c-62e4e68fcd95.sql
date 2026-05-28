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