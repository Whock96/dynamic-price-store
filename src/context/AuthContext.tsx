
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

// Menu items with permission requirements
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
    ],
  },
];

// Map of permission codes to menu paths
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
  'discounts_manage': ['/settings/discounts']
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('ferplas_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Fetch fresh permissions if we have a stored user
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
      // Get permissions associated with this user type using direct queries
      const { data: permLinks, error: permLinksError } = await supabase
        .from('user_type_permissions')
        .select('permission_id')
        .eq('user_type_id', userTypeId);
        
      if (permLinksError) throw permLinksError;
      
      if (!permLinks || permLinks.length === 0) {
        return [];
      }
      
      // Get the actual permission details
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
      
      // Get user with user type information using direct query
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*, user_type:user_types(*)')
        .eq('id', user.id)
        .single();
        
      if (userError) throw userError;
      
      if (!userData || !userData.user_type) {
        throw new Error("User or user type not found");
      }
      
      // Fetch permissions for this user type
      const permissions = await fetchUserTypePermissions(userData.user_type.id);
      
      // Check if the user role is administrator (case-insensitive)
      let userRole = userData.user_type.name;
      const isAdministrator = 
        userRole.toLowerCase() === 'administrator' || 
        userRole.toLowerCase() === 'administrador';
      
      // Normalize administrator role name
      if (isAdministrator) {
        userRole = 'administrator';
      }
      
      // Update user in state and localStorage
      const updatedUser: UserType = {
        ...user,
        role: userRole as 'administrator' | 'salesperson' | 'billing' | 'inventory',
        permissions: permissions,
      };
      
      console.log("Updated user with permissions:", updatedUser);
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
      // Use direct query to Supabase instead of abstracted hook
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
      // In a real application, this would be an API call with proper authentication
      const { data, error } = await supabase
        .from('users')
        .select('*, user_type:user_types(*)')
        .eq('username', username)
        .eq('password', password) // Note: In a real app, use proper password hashing
        .eq('is_active', true)
        .single();
        
      if (error || !data) {
        throw new Error('Credenciais inválidas ou usuário inativo');
      }
      
      if (!data.user_type) {
        throw new Error('Tipo de usuário não encontrado');
      }
      
      // Check if the user role is administrator (case-insensitive)
      let userTypeName = data.user_type.name;
      const isAdministrator = 
        userTypeName.toLowerCase() === 'administrator' || 
        userTypeName.toLowerCase() === 'administrador';
      
      // Normalize administrator role name
      if (isAdministrator) {
        userTypeName = 'administrator';
        
        // Update the user's role in the database to fix the issue (optional)
        try {
          // Find the administrator user type
          const { data: adminTypes } = await supabase
            .from('user_types')
            .select('*')
            .ilike('name', 'administrator')
            .limit(1);
            
          if (adminTypes && adminTypes.length > 0) {
            // Update the user's user_type_id to the administrator type
            await supabase
              .from('users')
              .update({ user_type_id: adminTypes[0].id })
              .eq('id', data.id);
          }
        } catch (updateErr) {
          console.error("Error updating user role:", updateErr);
          // Continue with login even if this fails
        }
      }
      
      // Fetch permissions for this user
      const permissions = await fetchUserTypePermissions(data.user_type.id);
      
      // Ensure the role is one of the allowed values
      const userRole = userTypeName as 'administrator' | 'salesperson' | 'billing' | 'inventory';
      
      // Create user object
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
      
      console.log("Logged in user:", userObj);
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
    if (!user) return false;
    
    console.log(`Checking permission: ${permissionCode}, user role: ${user.role}`);
    
    // Admin has all permissions - explicitly check for administrator role
    if (user.role === 'administrator') {
      console.log("User is administrator, granting permission");
      return true;
    }
    
    // For other roles, check if they have the required permission
    const hasSpecificPermission = user.permissions.some(p => p.code === permissionCode && p.isGranted);
    console.log(`Specific permission check for ${permissionCode}: ${hasSpecificPermission}`);
    
    return hasSpecificPermission;
  };

  const checkAccess = (menuPath: string) => {
    if (!user) return false;
    
    console.log(`Checking access for path: ${menuPath}, user role: ${user.role}`);
    
    // Admin has access to everything - explicitly check for administrator role
    if (user.role === 'administrator') {
      console.log("User is administrator, granting access to path");
      return true;
    }
    
    // For other roles, check if they have the required permission for this path
    for (const [permCode, paths] of Object.entries(PERMISSION_MENU_MAP)) {
      // Check if this permission grants access to the requested path
      const matchesPath = paths.some(path => {
        if (path.includes(':')) {
          // Convert dynamic paths like '/orders/:id' to regex pattern
          const regexPath = path.replace(/:\w+/g, '[^/]+');
          const pattern = new RegExp(`^${regexPath}$`);
          return pattern.test(menuPath);
        }
        return path === menuPath;
      });
      
      if (matchesPath && hasPermission(permCode)) {
        console.log(`Access granted via permission: ${permCode}`);
        return true;
      }
    }
    
    // If no specific permission mapping is found, allow access to unmapped paths
    // This is a fallback mechanism for paths not explicitly controlled
    const isPathMapped = Object.values(PERMISSION_MENU_MAP).flat().some(path => {
      if (path.includes(':')) {
        const regexPath = path.replace(/:\w+/g, '[^/]+');
        const pattern = new RegExp(`^${regexPath}$`);
        return pattern.test(menuPath);
      }
      return path === menuPath;
    });
    
    if (!isPathMapped) {
      console.log("Path is not mapped to any permission, access granted");
      return true;
    }
    
    console.log("Access denied to path");
    return false;
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
