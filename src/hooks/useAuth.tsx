import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (import.meta.env.DEV) {
          console.log('Auth state changed:', event);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string, firstName?: string, lastName?: string, country?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: {
          first_name: firstName,
          last_name: lastName,
          name: `${firstName || ''} ${lastName || ''}`.trim(),
          country: country,
        },
      },
    });
    return { error };
  };

  const resetPassword = async (email: string) => {
    const resetLink = `${window.location.origin}/reset-password`;
    
    // First, trigger Supabase password reset to generate the token
    const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetLink,
    });
    
    if (supabaseError) {
      return { error: supabaseError };
    }

    // Get user's first name from profiles if available
    let firstName: string | undefined;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('email', email)
        .single();
      
      if (profile?.name) {
        firstName = profile.name.split(' ')[0];
      }
    } catch (e) {
      // Ignore - name is optional
    }

    // Send our branded email via edge function
    try {
      const response = await supabase.functions.invoke('send-password-reset', {
        body: {
          email,
          resetLink,
          firstName,
        },
      });
      
      if (response.error) {
        console.error('Error sending branded email:', response.error);
        // Don't return error - Supabase already sent a backup email
      }
    } catch (e) {
      console.error('Error calling send-password-reset:', e);
      // Don't return error - Supabase already sent a backup email
    }
    
    return { error: null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
    updatePassword,
  };
};
