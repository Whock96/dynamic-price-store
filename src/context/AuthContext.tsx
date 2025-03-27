
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, MenuItem } from '../types/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (menuPath: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial mock user for testing
const INITIAL_ADMIN_USER: User = {
  id: '1',
  username: 'admin',
  name: 'Administrador',
  role: 'administrator',
  permissions: [],
  email: 'admin@ferplas.ind.br',
  createdAt: new Date(),
};

// Menu items with permission requirements
export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'home',
    name: 'Início',
    path: '/dashboard',
    icon: 'home',
    requiredRoles: ['administrator', 'salesperson', 'employee'],
  },
  {
    id: 'products',
    name: 'Produtos',
    path: '/products',
    icon: 'package',
    requiredRoles: ['administrator', 'salesperson', 'employee'],
    submenus: [
      {
        id: 'product-list',
        name: 'Listar Produtos',
        path: '/products',
        icon: 'list',
        requiredRoles: ['administrator', 'salesperson', 'employee'],
      },
    ],
  },
  {
    id: 'customers',
    name: 'Clientes',
    path: '/customers',
    icon: 'users',
    requiredRoles: ['administrator', 'salesperson', 'employee'],
    submenus: [
      {
        id: 'customer-list',
        name: 'Listar Clientes',
        path: '/customers',
        icon: 'list',
        requiredRoles: ['administrator', 'salesperson', 'employee'],
      },
      {
        id: 'customer-create',
        name: 'Cadastrar Clientes',
        path: '/customers/new',
        icon: 'user-plus',
        requiredRoles: ['administrator', 'salesperson'],
      },
    ],
  },
  {
    id: 'orders',
    name: 'Pedidos',
    path: '/orders',
    icon: 'clipboard',
    requiredRoles: ['administrator', 'salesperson', 'employee'],
    submenus: [
      {
        id: 'order-list',
        name: 'Consultar Pedidos',
        path: '/orders',
        icon: 'search',
        requiredRoles: ['administrator', 'salesperson', 'employee'],
      },
      {
        id: 'order-update',
        name: 'Atualizar Pedidos',
        path: '/orders/update',
        icon: 'edit',
        requiredRoles: ['administrator'],
      },
    ],
  },
  {
    id: 'cart',
    name: 'Carrinho',
    path: '/cart',
    icon: 'shopping-cart',
    requiredRoles: ['administrator', 'salesperson', 'employee'],
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
        icon: 'package',
        requiredRoles: ['administrator'],
      },
      {
        id: 'user-management',
        name: 'Gerenciar Usuários',
        path: '/settings/users',
        icon: 'users',
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
    ],
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('ferplas_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock authentication - in a real app, this would be an API call
      if (username === 'admin' && password === 'admin') {
        setUser(INITIAL_ADMIN_USER);
        localStorage.setItem('ferplas_user', JSON.stringify(INITIAL_ADMIN_USER));
      } else {
        throw new Error('Credenciais inválidas');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('ferplas_user');
    setUser(null);
  };

  const hasPermission = (menuPath: string) => {
    if (!user) return false;
    
    // Find the menu item that matches the path
    const findMenuItem = (items: MenuItem[]): MenuItem | undefined => {
      for (const item of items) {
        if (item.path === menuPath) return item;
        if (item.submenus) {
          const found = findMenuItem(item.submenus);
          if (found) return found;
        }
      }
      return undefined;
    };
    
    const menuItem = findMenuItem(MENU_ITEMS);
    if (!menuItem) return true; // If menu not found in permissions, allow it (could be a public route)
    
    return menuItem.requiredRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, hasPermission }}>
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
