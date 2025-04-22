
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as UserType } from '../types/types';

export const useAuthService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      
      const userObj: UserType = {
        id: data.id,
        username: data.username,
        name: data.name,
        email: data.email || '',
        createdAt: new Date(data.created_at),
        userTypeId: data.user_type_id
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
    fetchUserTypes
  };
};
