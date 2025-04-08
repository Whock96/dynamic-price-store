import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as UserType, MenuItem, Permission } from '../types/types';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: UserType | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permissionCode: string) => boolean;
  fetchPermissions: () => Promise<void>;
  fetchUserTypes: () => Promise<any[]>;
  checkAccess: (menuPath: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'home',
    name: 'Início',
    path: '/dashboard',
    icon: 'home',
    requiredRoles: ['administrator', 'salesperson', 'billing', 'inventory'],
  },
  {
    id: 'products',
    name: 'Produtos',
    path: '/products',
    icon: 'package',
    requiredRoles: ['administrator', 'salesperson', 'billing', 'inventory'],
    submenus: [
      {
        id: 'product-list',
        name: 'Listar Produtos',
        path: '/products',
        icon: 'list',
        requiredRoles: ['administrator', 'salesperson', 'billing', 'inventory'],
      },
    ],
  },
  {
    id: 'customers',
    name: 'Clientes',
    path: '/customers',
    icon: 'users',
    requiredRoles: ['administrator', 'salesperson', 'billing'],
    submenus: [
      {
        id: 'customer-list',
        name: 'Listar Clientes',
        path: '/customers',
        icon: 'list',
        requiredRoles: ['administrator', 'salesperson', 'billing'],
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
    requiredRoles: ['administrator', 'salesperson', 'billing'],
    submenus: [
      {
        id: 'order-list',
        name: 'Consultar Pedidos',
        path: '/orders',
        icon: 'search',
        requiredRoles: ['administrator', 'salesperson', 'billing'],
      },
    ],
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
        id: 'company-settings',
        name: 'Dados da Empresa',
        path: '/settings/company',
        icon: 'building-2',
        requiredRoles: ['administrator'],
      },
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
        id: 'user-type-management',
        name: 'Gerenciar Tipos de Usuário',
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
    ],
  },
];

const PERMISSION_MENU_MAP: Record<string, string[]> = {
  'dashboard_access': ['/dashboard'],
  'products_view': ['/products'],
  'products_manage': ['/settings/products'],
  'customers_view': ['/customers'],
  'customers_manage': ['/customers/new', '/customers/:id/edit'],
  'orders_view': ['/orders', '/orders/:id'],
  'orders_manage': ['/orders/:id/edit', '/cart'],
  'users_view': ['/settings/users'],
  'users_manage': ['/settings/users'],
  'user_types_manage': ['/settings/user-types'],
  'settings_view': ['/settings'],
  'settings_manage': ['/settings/company'],
  'categories_manage': ['/settings/categories'],
  'discounts_manage': ['/settings/discounts'],
  'transport_companies_view': ['/settings/transport-companies'],
  'transport_companies_manage': ['/settings/transport-companies']
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('ferplas_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        if (parsedUser) {
          fetchPermissions();
        }
      } catch (err) {
        console.error("Error parsing stored user:", err);
        localStorage.removeItem('ferplas_user');
      }
    }
    setLoading(false);
  }, []);

  const fetchUserTypePermissions = async (userTypeId: string): Promise<Permission[]> => {
    try {
      const { data: permLinks, error: permLinksError } = await supabase
        .from('user_type_permissions')
        .select('permission_id')
        .eq('user_type_id', userTypeId);
        
      if (permLinksError) throw permLinksError;
      
      if (!permLinks || permLinks.length === 0) {
        return [];
      }
      
      const permissionIds = permLinks.map(p => p.permission_id);
      const { data: permissions, error: permsError } = await supabase
        .from('permissions')
        .select('*')
        .in('id', permissionIds);
        
      if (permsError) throw permsError;
      
      return permissions.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        isGranted: true,
        code: p.code
      }));
    } catch (err) {
      console.error("Error fetching user type permissions:", err);
      return [];
    }
  };

  const fetchPermissions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*, user_type:user_types(*)')
        .eq('id', user.id)
        .single();
        
      if (userError) throw userError;
      
      if (!userData || !userData.user_type) {
        throw new Error("User or user type not found");
      }
      
      const permissions = await fetchUserTypePermissions(userData.user_type.id);
      
      let userRole = userData.user_type.name.toLowerCase();
      
      if (userRole === 'administrador') {
        userRole = 'administrator';
      }
      
      const updatedUser: UserType = {
        ...user,
        role: userRole as 'administrator' | 'salesperson' | 'billing' | 'inventory',
        permissions: permissions,
      };
      
      console.log("Updated user role:", updatedUser.role);
      console.log("User permissions:", permissions);
      
      setUser(updatedUser);
      localStorage.setItem('ferplas_user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error("Error fetching permissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('user_types')
        .select('*')
        .order('name');
        
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error fetching user types:", err);
      return [];
    }
  };

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, user_type:user_types(*)')
        .eq('username', username)
        .eq('password', password)
        .eq('is_active', true)
        .single();
        
      if (error || !data) {
        throw new Error('Credenciais inválidas ou usuário inativo');
      }
      
      if (!data.user_type) {
        throw new Error('Tipo de usuário não encontrado');
      }
      
      let userTypeName = data.user_type.name;
      if (userTypeName === 'administrador') {
        userTypeName = 'administrator';
        
        try {
          const { data: adminTypes } = await supabase
            .from('user_types')
            .select('*')
            .eq('name', 'administrator')
            .limit(1);
            
          if (adminTypes && adminTypes.length > 0) {
            await supabase
              .from('users')
              .update({ user_type_id: adminTypes[0].id })
              .eq('id', data.id);
          }
        } catch (updateErr) {
          console.error("Error updating user role:", updateErr);
        }
      }
      
      const permissions = await fetchUserTypePermissions(data.user_type.id);
      
      const userRole = userTypeName as 'administrator' | 'salesperson' | 'billing' | 'inventory';
      
      const userObj: UserType = {
        id: data.id,
        username: data.username,
        name: data.name,
        role: userRole,
        permissions: permissions,
        email: data.email || '',
        createdAt: new Date(data.created_at),
        userTypeId: data.user_type.id
      };
      
      setUser(userObj);
      localStorage.setItem('ferplas_user', JSON.stringify(userObj));
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

  const hasPermission = (permissionCode: string) => {
    if (!user || !user.permissions) return false;
    
    console.log(`Checking permission ${permissionCode} for user with role ${user.role}`);
    
    if (user.role.toLowerCase() === 'administrator') {
      console.log("User is administrator - granting all permissions");
      return true;
    }
    
    const hasPermAccess = user.permissions.some(p => p.code === permissionCode && p.isGranted);
    console.log(`Permission ${permissionCode} access:`, hasPermAccess);
    
    return hasPermAccess;
  };

  const checkAccess = (menuPath: string) => {
    if (!user) return false;
    
    console.log(`Checking access to ${menuPath} for user with role ${user.role}`);
    
    if (user.role.toLowerCase() === 'administrator') {
      console.log("User is administrator - granting access to all paths");
      return true;
    }
    
    for (const [permCode, paths] of Object.entries(PERMISSION_MENU_MAP)) {
      const matchesPath = paths.some(path => {
        if (path.includes(':')) {
          const regexPath = path.replace(/:\w+/g, '[^/]+');
          const pattern = new RegExp(`^${regexPath}$`);
          return pattern.test(menuPath);
        }
        return path === menuPath;
      });
      
      if (matchesPath && hasPermission(permCode)) {
        console.log(`Access granted to ${menuPath} via permission ${permCode}`);
        return true;
      }
    }
    
    const isPathMapped = Object.values(PERMISSION_MENU_MAP).flat().some(path => {
      if (path.includes(':')) {
        const regexPath = path.replace(/:\w+/g, '[^/]+');
        const pattern = new RegExp(`^${regexPath}$`);
        return pattern.test(menuPath);
      }
      return path === menuPath;
    });
    
    console.log(`Path ${menuPath} is ${isPathMapped ? 'mapped' : 'not mapped'} in permission system`);
    return !isPathMapped;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      logout, 
      hasPermission, 
      fetchPermissions,
      fetchUserTypes,
      checkAccess
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
