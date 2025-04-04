
import { useState, useEffect, useCallback } from 'react';
import { supabase, UserRow, UserTypeRow } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, UserType } from '@/context/AuthContext';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all users with their user types
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          username,
          name,
          email,
          is_active,
          created_at,
          user_type_id
        `)
        .order('name');

      if (usersError) throw usersError;

      // Fetch all user types with their permissions
      const { data: userTypesData, error: userTypesError } = await supabase
        .from('user_types')
        .select('*')
        .order('name');

      if (userTypesError) throw userTypesError;

      // Fetch permissions for all user types
      const { data: userTypePermissions, error: permissionsError } = await supabase
        .from('user_type_permissions')
        .select(`
          user_type_id,
          permissions:permission_id (
            id,
            name,
            description,
            code
          )
        `);

      if (permissionsError) throw permissionsError;

      // Cast to our known types
      const typedUsers = usersData as unknown as UserRow[];
      const typedUserTypes = userTypesData as unknown as UserTypeRow[];

      // Group permissions by user type ID
      const permissionsByUserType: Record<string, any[]> = {};
      userTypePermissions.forEach((utp: any) => {
        if (!permissionsByUserType[utp.user_type_id]) {
          permissionsByUserType[utp.user_type_id] = [];
        }
        permissionsByUserType[utp.user_type_id].push(utp.permissions);
      });

      // Process user types with their permissions
      const processedUserTypes = typedUserTypes.map(userType => {
        const permissions = permissionsByUserType[userType.id] || [];

        return {
          id: userType.id,
          name: userType.name,
          description: userType.description || '',
          permissions
        };
      });

      setUserTypes(processedUserTypes);

      // Process users with their user types
      const processedUsers = typedUsers.map(user => {
        const userType = processedUserTypes.find(ut => ut.id === user.user_type_id) || {
          id: '',
          name: 'Desconhecido',
          description: '',
          permissions: []
        };

        return {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email || '',
          isActive: user.is_active,
          createdAt: new Date(user.created_at),
          userType
        };
      });

      setUsers(processedUsers);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error fetching users:', error);
      toast.error(`Erro ao buscar usuários: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createUser = async (
    username: string,
    password: string,
    name: string,
    email: string,
    userTypeId: string
  ) => {
    try {
      // Check if username already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingUser) {
        toast.error('Nome de usuário já está em uso');
        return false;
      }

      // Create the user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          username,
          password, // In a real app, this would be hashed
          name,
          email,
          user_type_id: userTypeId
        })
        .select()
        .single();

      if (createError) throw createError;

      toast.success('Usuário criado com sucesso');
      await fetchUsers(); // Refresh the data
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Error creating user:', error);
      toast.error(`Erro ao criar usuário: ${error.message}`);
      return false;
    }
  };

  const updateUser = async (
    id: string,
    username: string,
    name: string,
    email: string,
    userTypeId: string,
    isActive: boolean,
    password?: string
  ) => {
    try {
      // Check if username already exists (excluding this user)
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .neq('id', id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingUser) {
        toast.error('Nome de usuário já está em uso');
        return false;
      }

      // Prepare update data
      const updateData: any = {
        username,
        name,
        email,
        user_type_id: userTypeId,
        is_active: isActive
      };

      // Add password to update data if provided
      if (password) {
        updateData.password = password;
      }

      // Update the user
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Usuário atualizado com sucesso');
      await fetchUsers(); // Refresh the data
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Error updating user:', error);
      toast.error(`Erro ao atualizar usuário: ${error.message}`);
      return false;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast.success('Usuário excluído com sucesso');
      await fetchUsers(); // Refresh the data
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Error deleting user:', error);
      toast.error(`Erro ao excluir usuário: ${error.message}`);
      return false;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    userTypes,
    isLoading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser
  };
}
