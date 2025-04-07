
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/types';

export interface AuthContextType {
  user: User | null;
  login?: (username: string, password: string) => Promise<void>;
  logout?: () => void;
  loading?: boolean;
  error?: string | null;
  hasPermission?: (permissionCode: string) => boolean;
  checkAccess?: (requiredRoles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
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

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
