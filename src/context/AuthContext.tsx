
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { User, UserType, Permission } from '@/types/types';

export interface AuthContextType {
  user: User | null;
  userTypes: UserType[];
  permissions: Permission[];
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();
      
      if (data?.session?.user) {
        await fetchUser(data.session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    }
    
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchUser(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const fetchUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (userError) {
        throw new Error(userError.message);
      }
      
      if (!userData) {
        throw new Error('User not found');
      }
      
      const { data: userTypeData, error: userTypeError } = await supabase
        .from('user_types')
        .select('*')
        .eq('id', userData.user_type_id)
        .single();
        
      if (userTypeError) {
        console.error('Error fetching user type:', userTypeError);
        throw new Error(userTypeError.message);
      }
      
      if (!userTypeData) {
        console.error('User type not found for id:', userData.user_type_id);
        throw new Error('User type not found');
      }
      
      // Fetch permissions
      const fetchedPermissions = await getPermissions(userData.user_type_id);
      setPermissions(fetchedPermissions);
      
      // Construct user object
      const user: User = {
        id: userData.id,
        username: userData.username,
        name: userData.name,
        email: userData.email || '',
        role: userTypeData.name as any, // Adjust type assertion as needed
        permissions: fetchedPermissions,
        createdAt: new Date(userData.created_at),
        userTypeId: userData.user_type_id,
      };
      
      setUser(user);
      
    } catch (err: any) {
      console.error('Error fetching user:', err);
      setError(err.message || 'Failed to fetch user data');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getPermissions = useCallback(async (userTypeId: string): Promise<Permission[]> => {
    try {
      // Fetch permissions associated with this user type
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_type_permissions')
        .select('permission_id')
        .eq('user_type_id', userTypeId);
        
      if (permissionsError) {
        console.error('Error fetching permissions:', permissionsError);
        return [];
      }
      
      if (!permissionsData || permissionsData.length === 0) {
        return [];
      }
      
      // Extract permission IDs
      const permissionIds = permissionsData.map(p => p.permission_id);
      
      // Fetch permission details
      const { data: permissions, error: permDetailsError } = await supabase
        .from('permissions')
        .select('*')
        .in('id', permissionIds);
        
      if (permDetailsError) {
        console.error('Error fetching permission details:', permDetailsError);
        return [];
      }
      
      // Map to Permission type with isGranted set to true
      return (permissions || []).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        code: p.code,
        isGranted: true
      }));
    } catch (err) {
      console.error('Error in getPermissions:', err);
      return [];
    }
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });
      
      if (error) {
        console.error('Login error:', error);
        setError(error.message);
        toast.error('Credenciais inválidas');
      } else {
        console.log('Login successful:', data);
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err.message);
      setError(err.message || 'Ocorreu um erro ao fazer login.');
      toast.error('Ocorreu um erro ao fazer login.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error.message);
        setError(error.message);
        toast.error('Erro ao fazer logout.');
      } else {
        console.log('Logout successful');
        toast.success('Logout realizado com sucesso!');
        navigate('/login');
      }
    } catch (err: any) {
      console.error('Logout error:', err.message);
      setError(err.message || 'Ocorreu um erro ao fazer logout.');
      toast.error('Ocorreu um erro ao fazer logout.');
    } finally {
      setIsLoading(false);
      setUser(null);
    }
  };
  
  const hasPermission = (permissionCode: string): boolean => {
    return permissions.some(perm => perm.code === permissionCode && perm.isGranted);
  };

  const value: AuthContextType = {
    user,
    userTypes,
    permissions,
    isLoading,
    error,
    login,
    logout,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
