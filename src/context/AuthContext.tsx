
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as UserType } from '../types/types';
import { AuthContextType } from '../types/auth';
import { MENU_ITEMS } from '../constants/menuItems';
import { PERMISSION_MENU_MAP, isAdministrator } from '../utils/permissionUtils';
import { useAuthService } from '../hooks/useAuthService';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { MENU_ITEMS };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const { loading, error, login: performLogin, fetchUserTypePermissions, fetchUserTypes } = useAuthService();

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
  }, []);

  const fetchPermissions = async () => {
    if (!user) return;

    try {
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
    }
  };

  const login = async (username: string, password: string) => {
    const userObj = await performLogin(username, password);
    if (userObj) {
      setUser(userObj);
      localStorage.setItem('ferplas_user', JSON.stringify(userObj));
    }
  };

  const logout = () => {
    localStorage.removeItem('ferplas_user');
    setUser(null);
  };

  const hasPermission = (permissionCode: string) => {
    if (!user || !user.permissions) return false;
    
    console.log(`Checking permission ${permissionCode} for user with role ${user.role}`);
    
    // Administradores têm acesso total a todas as permissões
    if (isAdministrator(user.role)) {
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
    
    // Administradores têm acesso total a todos os caminhos
    if (isAdministrator(user.role)) {
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
