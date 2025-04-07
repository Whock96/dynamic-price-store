import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { User, UserType, Permission } from '@/types/types';
import { authenticateDirectly } from '@/utils/auth-helper';

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
  
  // Para debug
  useEffect(() => {
    console.log('Current auth state:', { user, permissions, isLoading });
  }, [user, permissions, isLoading]);
  
  useEffect(() => {
    async function checkSession() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (data?.session?.user) {
          await fetchUser(data.session.user.id);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error checking session:", err);
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
    setError(null);
    try {
      console.log("Fetching user data for ID:", userId);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (userError) {
        console.error("Error fetching user:", userError);
        throw new Error(userError.message);
      }
      
      if (!userData) {
        console.error("User not found for ID:", userId);
        throw new Error('User not found');
      }
      
      console.log("User data retrieved:", userData);
      
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
      
      console.log("User type data retrieved:", userTypeData);
      
      const fetchedPermissions = await getPermissions(userData.user_type_id);
      setPermissions(fetchedPermissions);
      
      const userRole = userTypeData.name.toLowerCase();
      console.log("User role determined:", userRole);
      
      const user: User = {
        id: userData.id,
        username: userData.username,
        name: userData.name,
        email: userData.email || '',
        role: userRole as any,
        permissions: fetchedPermissions,
        createdAt: new Date(userData.created_at),
        userTypeId: userData.user_type_id,
      };
      
      console.log("Setting user data:", user);
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
      console.log("Fetching permissions for user type:", userTypeId);
      
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_type_permissions')
        .select('permission_id')
        .eq('user_type_id', userTypeId);
        
      if (permissionsError) {
        console.error('Error fetching permissions:', permissionsError);
        return [];
      }
      
      if (!permissionsData || permissionsData.length === 0) {
        console.log("No permissions found for user type:", userTypeId);
        return [];
      }
      
      const permissionIds = permissionsData.map(p => p.permission_id);
      console.log("Permission IDs:", permissionIds);
      
      const { data: permissions, error: permDetailsError } = await supabase
        .from('permissions')
        .select('*')
        .in('id', permissionIds);
        
      if (permDetailsError) {
        console.error('Error fetching permission details:', permDetailsError);
        return [];
      }
      
      console.log("Permissions retrieved:", permissions);
      
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
      console.log('Attempting login with username:', username);
      
      // Passo 1: Primeiro tente autenticar diretamente da tabela de usuários
      const { success, user: directUser, error: directError } = await authenticateDirectly(username, password);
      
      if (success && directUser) {
        console.log('Direct authentication successful, user found in database:', directUser.id);
        
        // Passo 2: Tente fazer login com Supabase Auth usando o nome de usuário como email
        const { data, error } = await supabase.auth.signInWithPassword({
          email: username,
          password,
        });
        
        if (error) {
          console.log('Supabase Auth login failed with error:', error.message);
          console.log('User exists in database but not in Auth. Loading user directly');
          
          // Passo 3: Se o login falhar, mas o usuário existir no banco de dados, carregue o usuário diretamente
          const { data: userTypeData, error: userTypeError } = await supabase
            .from('user_types')
            .select('*')
            .eq('id', directUser.user_type_id)
            .single();
            
          if (userTypeError) {
            console.error('Error fetching user type:', userTypeError);
            throw new Error('Erro ao buscar tipo de usuário');
          }
          
          const fetchedPermissions = await getPermissions(directUser.user_type_id);
          
          const userRole = userTypeData.name.toLowerCase();
          console.log("Direct login user role:", userRole);
          
          const userObj: User = {
            id: directUser.id,
            username: directUser.username,
            name: directUser.name,
            email: directUser.email || '',
            role: userRole as any,
            permissions: fetchedPermissions,
            createdAt: new Date(directUser.created_at),
            userTypeId: directUser.user_type_id,
          };
          
          setUser(userObj);
          setPermissions(fetchedPermissions);
          
          toast.success('Login realizado com sucesso!');
          navigate('/dashboard');
          return;
        } else {
          console.log('Login with Supabase Auth successful');
          toast.success('Login realizado com sucesso!');
          navigate('/dashboard');
          return;
        }
      } else {
        console.error('Direct authentication failed:', directError);
        setError('Credenciais inválidas. Verifique seu usuário e senha.');
        toast.error('Erro ao fazer login');
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
    // Para debug
    console.log(`Verificando permissão: ${permissionCode}, Usuário: ${user?.role}, Permissões: `, permissions);
    
    // Para administradores, sempre retorne true
    if (user?.role === 'administrator' || user?.role === 'admin') {
      console.log('Usuário é administrador, concedendo permissão');
      return true;
    }
    
    // Verifique se a permissão está na lista de permissões do usuário
    const hasPermission = permissions.some(perm => perm.code === permissionCode && perm.isGranted);
    console.log(`Permissão ${permissionCode} concedida: ${hasPermission}`);
    return hasPermission;
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
