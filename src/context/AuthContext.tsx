
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as UserType } from '../types/types';
import { AuthContextType } from '../types/auth';
import { MENU_ITEMS } from '../constants/menuItems';
import { isAdministrador, isVendedor } from '../utils/permissionUtils';
import { useAuthService } from '../hooks/useAuthService';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { MENU_ITEMS };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const { loading, error, login: performLogin, fetchUserTypes } = useAuthService();

  useEffect(() => {
    const storedUser = localStorage.getItem('ferplas_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error("Error parsing stored user:", err);
        localStorage.removeItem('ferplas_user');
      }
    }
  }, []);

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

  const checkAccess = (menuPath: string) => {
    if (!user) return false;
    
    console.log(`Checking access to ${menuPath} for user with userTypeId ${user.userTypeId}`);
    
    // Administrador tem acesso total a todas as rotas
    if (isAdministrador(user.userTypeId)) {
      console.log("User is administrator - granting access to all paths");
      return true;
    }
    
    // Se não é administrador e o caminho começa com /settings, negar acesso
    if (menuPath.startsWith('/settings')) {
      console.log("Denying access to settings for non-administrator user");
      return false;
    }
    
    // Para vendedor, permitir acesso a dashboard, customers, orders e cart
    if (isVendedor(user.userTypeId)) {
      if (
        menuPath.startsWith('/dashboard') || 
        menuPath.startsWith('/customers') || 
        menuPath.startsWith('/orders') || 
        menuPath === '/cart'
      ) {
        return true;
      }
    }
    
    // Por padrão, negar acesso a rotas não mapeadas explicitamente
    console.log(`Access to ${menuPath} denied for user with type ${user.userTypeId}`);
    return false;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      logout, 
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
