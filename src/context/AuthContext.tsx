import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, Institution } from '../types/models';
import { UserRole } from '../types/database.types';

interface AuthContextType {
  user: UserProfile | null;
  institution: Institution | null;
  role: UserRole | null;
  isLoading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  setDemoUser: (role: UserRole) => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo institution for instant UI evaluation before Supabase credentials are plugged in
const DEMO_INSTITUTION: Institution = {
  id: 'demo-inst-001',
  name: 'Greenwood Academy',
  code: 'GW-2026',
  address: '100 Education Blvd, Academic District',
  phone: '+1 (555) 019-2834',
  email: 'office@greenwood.edu',
  good_threshold: 90.0,
  warning_threshold: 75.0,
  working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isSupabaseConfigured);

  const fetchProfileAndRole = async (userId: string) => {
    try {
      // 1. Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) throw roleError;

      const userRole: UserRole = roleData?.role || 'teacher';
      const institutionId = roleData?.institution_id;

      // 2. Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      // 3. Fetch institution
      let instData: Institution | null = null;
      if (institutionId) {
        const { data: inst, error: instError } = await supabase
          .from('institutions')
          .select('*')
          .eq('id', institutionId)
          .maybeSingle();
        if (!instError && inst) {
          instData = inst as unknown as Institution;
        }
      }

      setRole(userRole);
      setInstitution(instData || DEMO_INSTITUTION);

      if (profileData) {
        setUser({
          id: profileData.id,
          institution_id: profileData.institution_id || institutionId || DEMO_INSTITUTION.id,
          email: profileData.email,
          full_name: profileData.full_name,
          phone: profileData.phone,
          avatar_url: profileData.avatar_url,
          role: userRole,
          institution: instData || DEMO_INSTITUTION,
        });
      }
    } catch (err) {
      console.warn('Error fetching user profile:', err);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // If Supabase credentials are not in .env, start with an active demo admin session
      setUser({
        id: 'demo-admin-id',
        institution_id: DEMO_INSTITUTION.id,
        email: 'admin@greenwood.edu',
        full_name: 'Principal Sarah Johnson',
        role: 'admin',
        institution: DEMO_INSTITUTION,
      });
      setInstitution(DEMO_INSTITUTION);
      setRole('admin');
      setIsLoading(false);
      return;
    }

    // Check active Supabase session
    supabase.auth.getSession().then((res: any) => {
      const session = res?.data?.session;
      if (session?.user) {
        fetchProfileAndRole(session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        fetchProfileAndRole(session.user.id);
      } else {
        setUser(null);
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured || isDemoMode) {
      // Local simulation for immediate evaluation
      const simulatedRole: UserRole = email.toLowerCase().includes('teacher') ? 'teacher' : 'admin';
      setUser({
        id: simulatedRole === 'admin' ? 'demo-admin-id' : 'demo-teacher-id',
        institution_id: DEMO_INSTITUTION.id,
        email,
        full_name: simulatedRole === 'admin' ? 'Principal Sarah Johnson' : 'Mr. John Smith',
        role: simulatedRole,
        institution: DEMO_INSTITUTION,
      });
      setInstitution(DEMO_INSTITUTION);
      setRole(simulatedRole);
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };
      if (data.user) {
        await fetchProfileAndRole(data.user.id);
      }
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && !isDemoMode) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setRole(null);
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  };

  const setDemoUser = (targetRole: UserRole) => {
    setIsDemoMode(true);
    const demoProfile: UserProfile = {
      id: targetRole === 'admin' ? 'demo-admin-id' : 'demo-teacher-id',
      institution_id: DEMO_INSTITUTION.id,
      email: targetRole === 'admin' ? 'admin@greenwood.edu' : 'teacher.smith@greenwood.edu',
      full_name: targetRole === 'admin' ? 'Principal Sarah Johnson' : 'Mr. John Smith (Grade 5)',
      role: targetRole,
      institution: DEMO_INSTITUTION,
    };
    setUser(demoProfile);
    setRole(targetRole);
    setInstitution(DEMO_INSTITUTION);
  };

  const refreshUserData = async () => {
    if (user?.id && isSupabaseConfigured && !isDemoMode) {
      await fetchProfileAndRole(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        institution,
        role,
        isLoading,
        isDemoMode,
        signIn,
        signOut,
        resetPassword,
        setDemoUser,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
