
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as UserType, Permission } from '../types/types';

export const useAuthService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const login = async (username: string, password: string): Promise<UserType | null> => {
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
      
      return userObj;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
      console.error('Login error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    login,
    fetchUserTypePermissions,
    fetchUserTypes
  };
};
