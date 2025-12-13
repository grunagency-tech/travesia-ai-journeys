-- Block all public access to password_reset_tokens table
-- Only service role (used by edge functions) should access this table
CREATE POLICY "No public access" ON public.password_reset_tokens
FOR ALL USING (false);