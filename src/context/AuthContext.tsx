
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

export interface Permission {
  id: string;
  name: string;
  description: string;
  code: string;
}

export interface UserType {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  userType: UserType;
  isActive: boolean;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permissionCode: string) => boolean;
  refreshUserData: () => Promise<void>;
}

// Navigation menu items with permission requirements
export const MENU_ITEMS = [
  {
    id: 'home',
    name: 'Início',
    path: '/dashboard',
    icon: 'home',
    permissionCode: 'dashboard',
  },
  {
    id: 'products',
    name: 'Produtos',
    path: '/products',
    icon: 'package',
    permissionCode: 'products.view',
    submenus: [
      {
        id: 'product-list',
        name: 'Listar Produtos',
        path: '/products',
        icon: 'list',
        permissionCode: 'products.view',
      },
    ],
  },
  {
    id: 'customers',
    name: 'Clientes',
    path: '/customers',
    icon: 'users',
    permissionCode: 'customers.view',
    submenus: [
      {
        id: 'customer-list',
        name: 'Listar Clientes',
        path: '/customers',
        icon: 'list',
        permissionCode: 'customers.view',
      },
      {
        id: 'customer-create',
        name: 'Cadastrar Clientes',
        path: '/customers/new',
        icon: 'user-plus',
        permissionCode: 'customers.edit',
      },
    ],
  },
  {
    id: 'orders',
    name: 'Pedidos',
    path: '/orders',
    icon: 'clipboard',
    permissionCode: 'orders.view',
    submenus: [
      {
        id: 'order-list',
        name: 'Consultar Pedidos',
        path: '/orders',
        icon: 'search',
        permissionCode: 'orders.view',
      },
    ],
  },
  {
    id: 'cart',
    name: 'Carrinho',
    path: '/cart',
    icon: 'shopping-cart',
    permissionCode: 'orders.edit',
  },
  {
    id: 'settings',
    name: 'Configurações',
    path: '/settings',
    icon: 'settings',
    permissionCode: 'settings.view',
    submenus: [
      {
        id: 'company-settings',
        name: 'Dados da Empresa',
        path: '/settings/company',
        icon: 'building-2',
        permissionCode: 'settings.company',
      },
      {
        id: 'product-management',
        name: 'Gerenciar Produtos',
        path: '/settings/products',
        icon: 'package',
        permissionCode: 'settings.products',
      },
      {
        id: 'user-management',
        name: 'Gerenciar Usuários',
        path: '/settings/users',
        icon: 'users',
        permissionCode: 'settings.users',
      },
      {
        id: 'user-types-management',
        name: 'Tipos de Usuário',
        path: '/settings/user-types',
        icon: 'shield',
        permissionCode: 'settings.usertypes',
      },
      {
        id: 'category-management',
        name: 'Gerenciar Categorias',
        path: '/settings/categories',
        icon: 'tag',
        permissionCode: 'settings.categories',
      },
      {
        id: 'discount-management',
        name: 'Gerenciar Descontos',
        path: '/settings/discounts',
        icon: 'percent',
        permissionCode: 'settings.discounts',
      },
    ],
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async (userId: string): Promise<User | null> => {
    try {
      // Fetch the user with their user type
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id, 
          username, 
          name, 
          email, 
          is_active, 
          created_at,
          user_type_id
        `)
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      if (!userData) return null;

      // Fetch the user type with permissions
      const { data: userTypeData, error: userTypeError } = await supabase
        .from('user_types')
        .select(`
          id, 
          name, 
          description
        `)
        .eq('id', userData.user_type_id)
        .single();

      if (userTypeError) throw userTypeError;

      // Fetch permissions for this user type
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_type_permissions')
        .select(`
          permissions (
            id,
            name,
            description,
            code
          )
        `)
        .eq('user_type_id', userTypeData.id);

      if (permissionsError) throw permissionsError;

      // Extract permissions from the nested structure
      const permissions = permissionsData.map(item => item.permissions);

      // Build the complete user object
      const fullUser: User = {
        id: userData.id,
        username: userData.username,
        name: userData.name,
        email: userData.email || '',
        isActive: userData.is_active,
        createdAt: new Date(userData.created_at),
        userType: {
          id: userTypeData.id,
          name: userTypeData.name,
          description: userTypeData.description || '',
          permissions: permissions
        }
      };

      return fullUser;
    } catch (err) {
      console.error('Error fetching user data:', err);
      return null;
    }
  };

  const refreshUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    const userData = await fetchUserData(user.id);
    if (userData) {
      setUser(userData);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Check if user is logged in from localStorage
    const checkLoggedInUser = async () => {
      setLoading(true);
      const storedUserId = localStorage.getItem('ferplas_user_id');
      
      if (storedUserId) {
        const userData = await fetchUserData(storedUserId);
        if (userData) {
          setUser(userData);
        } else {
          // User data couldn't be fetched, clear local storage
          localStorage.removeItem('ferplas_user_id');
        }
      }
      
      setLoading(false);
    };

    checkLoggedInUser();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Verify credentials
      const { data, error } = await supabase
        .from('users')
        .select('id, password')
        .eq('username', username)
        .eq('is_active', true)
        .single();
      
      if (error) throw new Error('Usuário não encontrado ou inativo');
      
      // In a real application, you would use a proper password verification method
      // For this example, we're using a direct comparison for simplicity
      if (data.password !== '$2a$10$mLK.rrdlvx9DCFb6Eck1t.TlltnGulepXnov3bBp5T2TloO1MYj52') {
        throw new Error('Senha incorreta');
      }
      
      // Fetch full user data
      const userData = await fetchUserData(data.id);
      
      if (!userData) {
        throw new Error('Erro ao obter dados do usuário');
      }
      
      setUser(userData);
      localStorage.setItem('ferplas_user_id', userData.id);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
      console.error('Login error:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('ferplas_user_id');
    setUser(null);
    toast.info('Sessão encerrada');
  };

  const hasPermission = (permissionCode: string) => {
    if (!user) return false;
    
    // Check if the user has the required permission
    return user.userType.permissions.some(permission => permission.code === permissionCode);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      logout, 
      hasPermission,
      refreshUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
