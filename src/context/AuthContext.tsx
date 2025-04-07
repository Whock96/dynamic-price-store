
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Permission } from '@/types/types';
import { toast } from 'sonner';

// Define the MENU_ITEMS to export for sidebar
export const MENU_ITEMS = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    path: '/dashboard',
    icon: 'home',
    requiredRoles: ['administrator', 'salesperson', 'billing', 'inventory'],
  },
  {
    id: 'products',
    name: 'Produtos',
    path: '/products',
    icon: 'package',
    requiredRoles: ['administrator', 'salesperson', 'inventory'],
  },
  {
    id: 'customers',
    name: 'Clientes',
    path: '/customers',
    icon: 'users',
    requiredRoles: ['administrator', 'salesperson'],
  },
  {
    id: 'orders',
    name: 'Pedidos',
    path: '/orders',
    icon: 'clipboard',
    requiredRoles: ['administrator', 'salesperson', 'billing'],
  },
  {
    id: 'cart',
    name: 'Carrinho',
    path: '/cart',
    icon: 'shopping-cart',
    requiredRoles: ['administrator', 'salesperson'],
  },
  {
    id: 'settings',
    name: 'Configurações',
    path: '/settings',
    icon: 'settings',
    requiredRoles: ['administrator'],
    submenus: [
      {
        id: 'product-management',
        name: 'Gerenciar Produtos',
        path: '/settings/products',
        icon: 'list',
        requiredRoles: ['administrator'],
      },
      {
        id: 'user-management',
        name: 'Gerenciar Usuários',
        path: '/settings/users',
        icon: 'user-plus',
        requiredRoles: ['administrator'],
      },
      {
        id: 'user-type-management',
        name: 'Tipos de Usuário',
        path: '/settings/user-types',
        icon: 'shield',
        requiredRoles: ['administrator'],
      },
      {
        id: 'category-management',
        name: 'Gerenciar Categorias',
        path: '/settings/categories',
        icon: 'tag',
        requiredRoles: ['administrator'],
      },
      {
        id: 'discount-management',
        name: 'Gerenciar Descontos',
        path: '/settings/discounts',
        icon: 'percent',
        requiredRoles: ['administrator'],
      },
      {
        id: 'transport-company-management',
        name: 'Gerenciar Transportadoras',
        path: '/settings/transport-companies',
        icon: 'truck',
        requiredRoles: ['administrator'],
      },
      {
        id: 'company-settings',
        name: 'Dados da Empresa',
        path: '/settings/company',
        icon: 'building-2',
        requiredRoles: ['administrator'],
      },
    ],
  },
];

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
  checkAccess: (path: string) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the user is already logged in
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        // Try to get the session from localStorage
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // If no stored user, clear any potential session
          await logout();
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        await logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    setIsLoading(true);
    try {
      // For demo purposes, using a simple authentication
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, username, user_type_id,
          user_types:user_type_id (
            id, name, permissions:user_type_permissions (
              permissions:permission_id (
                id, name, description, code
              )
            )
          )
        `)
        .eq('email', email)
        .eq('password', password) // In a real app, you'd use proper password hashing
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.error('Login error:', error);
        throw new Error('Credenciais inválidas');
      }

      // Transform the data to match our User type
      const permissions: Permission[] = data.user_types?.permissions
        ?.map((p: any) => ({
          id: p.permissions.id,
          name: p.permissions.name,
          description: p.permissions.description,
          code: p.permissions.code,
          isGranted: true
        })) || [];

      const userData: User = {
        id: data.id,
        username: data.username,
        name: data.name,
        email: data.email,
        role: data.user_types?.name.toLowerCase() as 'administrator' | 'salesperson' | 'billing' | 'inventory',
        permissions,
        createdAt: new Date(),
        userTypeId: data.user_type_id
      };

      // Store user in localStorage for session persistence
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return userData;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Falha na autenticação. Verifique suas credenciais.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    // Clear the stored user data
    localStorage.removeItem('user');
    setUser(null);
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!user) return false;
    
    // For administrator role, grant all permissions
    if (user.role === 'administrator') return true;
    
    // Check if the user has the specific permission
    return user.permissions.some(permission => 
      permission.code === permissionCode && permission.isGranted
    );
  };

  const checkAccess = (path: string): boolean => {
    if (!user) return false;
    
    // Check all menu items and their submenus
    for (const item of MENU_ITEMS) {
      // Check if the current item matches the path
      if (item.path === path && item.requiredRoles.includes(user.role)) {
        return true;
      }
      
      // Check submenus if they exist
      if (item.submenus) {
        for (const submenu of item.submenus) {
          if (submenu.path === path && submenu.requiredRoles.includes(user.role)) {
            return true;
          }
        }
      }
    }
    
    return false;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      hasPermission,
      checkAccess,
      isLoading
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
