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