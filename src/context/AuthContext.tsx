
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/types';

// Define menu items structure
export const MENU_ITEMS = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    path: '/dashboard',
    icon: 'home',
    requiredRoles: ['administrator', 'manager', 'salesperson']
  },
  {
    id: 'sales',
    name: 'Vendas',
    path: '/sales',
    icon: 'shopping-cart',
    requiredRoles: ['administrator', 'manager', 'salesperson'],
    submenus: [
      {
        id: 'orders',
        name: 'Pedidos',
        path: '/orders',
        icon: 'clipboard'
      },
      {
        id: 'customers',
        name: 'Clientes',
        path: '/customers',
        icon: 'users'
      }
    ]
  },
  {
    id: 'products',
    name: 'Produtos',
    path: '/products',
    icon: 'package',
    requiredRoles: ['administrator', 'manager', 'salesperson']
  },
  {
    id: 'billing',
    name: 'Faturamento',
    path: '/billing',
    icon: 'tag',
    requiredRoles: ['administrator', 'manager']
  },
  {
    id: 'settings',
    name: 'Configurações',
    path: '/settings',
    icon: 'settings',
    requiredRoles: ['administrator'],
    submenus: [
      {
        id: 'users',
        name: 'Usuários',
        path: '/settings/users',
        icon: 'users'
      },
      {
        id: 'user-types',
        name: 'Tipos de Usuário',
        path: '/settings/user-types',
        icon: 'user-plus'
      },
      {
        id: 'discount-options',
        name: 'Opções de Desconto',
        path: '/settings/discount-options',
        icon: 'percent'
      },
      {
        id: 'company',
        name: 'Empresa',
        path: '/settings/company',
        icon: 'building-2'
      },
      {
        id: 'transport-companies',
        name: 'Transportadoras',
        path: '/settings/transport-companies',
        icon: 'truck'
      },
    ]
  }
];

export interface AuthContextType {
  user: User | null;
  login?: (username: string, password: string) => Promise<void>;
  logout?: () => void;
  loading?: boolean;
  error?: string | null;
  hasPermission?: (permissionCode: string) => boolean;
  checkAccess?: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mock user for development
  useEffect(() => {
    // You can uncomment and modify this to simulate a logged-in user during development
    /*
    setUser({
      id: 'mock-user-id',
      username: 'mockuser',
      name: 'Mock User',
      role: 'administrator',
      permissions: [],
      email: 'mock@example.com',
      createdAt: new Date(),
      userTypeId: 'mock-user-type-id'
    });
    */
  }, []);

  // Implement login function
  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate login, replace with actual API call
      console.log('Logging in with:', username, password);
      
      // Mock successful login
      setUser({
        id: 'mock-user-id',
        username: username,
        name: 'Mock User',
        role: 'administrator',
        permissions: [],
        email: `${username}@example.com`,
        createdAt: new Date(),
        userTypeId: 'mock-user-type-id'
      });
    } catch (err) {
      setError('Failed to login. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Implement logout function
  const logout = () => {
    setUser(null);
  };

  // Check if user has a specific permission
  const hasPermission = (permissionCode: string) => {
    if (!user) return false;
    if (user.role === 'administrator') return true;
    return user.permissions?.includes(permissionCode) || false;
  };

  // Check if user has access to a specific path
  const checkAccess = (path: string) => {
    if (!user) return false;
    
    // Administrator has access to everything
    if (user.role === 'administrator') return true;
    
    // Find menu item or submenu that matches the path
    const hasPathInMenu = (items: typeof MENU_ITEMS) => {
      for (const item of items) {
        // Check if current item matches
        if (path.startsWith(item.path) && item.requiredRoles.includes(user.role)) {
          return true;
        }
        
        // Check submenus
        if (item.submenus) {
          for (const submenu of item.submenus) {
            if (path.startsWith(submenu.path) && item.requiredRoles.includes(user.role)) {
              return true;
            }
          }
        }
      }
      return false;
    };
    
    return hasPathInMenu(MENU_ITEMS);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      error, 
      hasPermission, 
      checkAccess 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
