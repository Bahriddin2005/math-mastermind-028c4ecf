import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'student' | 'parent' | 'teacher' | 'admin';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      setRole((data?.role as UserRole) || 'student');
      setLoading(false);
    };

    fetchRole();
  }, [user]);

  const isStudent = role === 'student';
  const isParent = role === 'parent';
  const isTeacher = role === 'teacher';
  const isAdmin = role === 'admin';

  return { role, loading, isStudent, isParent, isTeacher, isAdmin };
};
