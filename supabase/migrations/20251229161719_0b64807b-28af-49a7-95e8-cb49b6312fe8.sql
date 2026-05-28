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