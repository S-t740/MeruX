"use client"

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';
import { UserRole, UserProfile } from '@/types';

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const fetchUserProfile = async () => {
      try {
        if (!user) {
          // For development: default to student role
          console.warn('No authenticated user, using guest mode');
          setLoading(false);
          return;
        }

        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (queryError) {
          // Instead of silent {}, log the actual message
          console.warn(`User profile not found or fetch failed (${queryError.message}), creating/falling back to default profile`);
          
          // Try to create default profile if doesn't exist
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              role: 'student' as UserRole,
            }])
            .select()
            .single();

          if (createError) {
             console.error("Failed to insert default profile (possibly RLS or trigger race condition):", JSON.stringify(createError));
             // Fallback to in-memory student profile instead of crashing
             setProfile({
                id: user.id,
                email: user.email || '',
                name: user.user_metadata?.name || 'User',
                role: 'student' as UserRole,
             } as UserProfile);
          } else {
             setProfile(newProfile);
          }
        } else {
          setProfile(data);
        }
      } catch (err: any) {
        setError(err instanceof Error ? err : new Error(err?.message || 'Unknown error'));
        console.error('Error fetching user profile:', err?.message || JSON.stringify(err) || err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, authLoading, supabase]);

  return {
    role: profile?.role as UserRole | undefined,
    profile,
    loading: loading || authLoading,
    error,
    isAdmin: profile?.role === 'admin' || profile?.role === 'super_admin',
    isSuperAdmin: profile?.role === 'super_admin',
    isInstructor: profile?.role === 'instructor',
    isStudent: profile?.role === 'student',
    isMentor: profile?.role === 'mentor',
    isResearcher: profile?.role === 'researcher',
    isReviewer: profile?.role === 'reviewer',
  };
}

export function useRequireRole(requiredRoles: UserRole[]) {
  const { role, loading } = useUserRole();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!loading && role) {
      setHasAccess(requiredRoles.includes(role));
    }
  }, [role, loading, requiredRoles]);

  return { hasAccess, loading };
}
