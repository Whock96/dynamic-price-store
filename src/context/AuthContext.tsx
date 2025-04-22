
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as UserType } from '../types/types';
import { AuthContextType } from '../types/auth';
import { MENU_ITEMS } from '../constants/menuItems';
import { hasAccessToRoute, isAdministrador } from '../utils/permissionUtils';
import { useAuthService } from '../hooks/useAuthService';

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
    
    console.log(`Checking access to ${menuPath} for user with type ${user.userTypeId}`);
    
    // Verificação simplificada baseada apenas no tipo de usuário
    return hasAccessToRoute(user.userTypeId, menuPath);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      logout, 
      checkAccess,
      fetchUserTypes
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
