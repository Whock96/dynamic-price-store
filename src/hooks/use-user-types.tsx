
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Permission, UserType } from '@/context/AuthContext';

export function useUserTypes() {
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserTypes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all user types
      const { data: userTypesData, error: userTypesError } = await supabase
        .from('user_types')
        .select('*')
        .order('name');

      if (userTypesError) throw userTypesError;

      // Fetch all permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .order('name');

      if (permissionsError) throw permissionsError;

      // Fetch user type permissions mappings
      const { data: mappingsData, error: mappingsError } = await supabase
        .from('user_type_permissions')
        .select('*');

      if (mappingsError) throw mappingsError;

      // Process the data to create UserType objects with their permissions
      const processedUserTypes: UserType[] = userTypesData.map(userType => {
        // Find all permission IDs for this user type
        const userTypePermissionIds = mappingsData
          .filter(mapping => mapping.user_type_id === userType.id)
          .map(mapping => mapping.permission_id);

        // Find the full permission objects for these IDs
        const userTypePermissions = permissionsData
          .filter(permission => userTypePermissionIds.includes(permission.id))
          .map(permission => ({
            id: permission.id,
            name: permission.name,
            description: permission.description || '',
            code: permission.code
          }));

        return {
          id: userType.id,
          name: userType.name,
          description: userType.description || '',
          permissions: userTypePermissions
        };
      });

      setUserTypes(processedUserTypes);
      setPermissions(permissionsData.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        code: p.code
      })));

    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error fetching user types:', error);
      toast.error(`Erro ao buscar tipos de usuário: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createUserType = async (name: string, description: string, permissionIds: string[]) => {
    try {
      // First create the user type
      const { data: newUserType, error: createError } = await supabase
        .from('user_types')
        .insert({ name, description })
        .select()
        .single();

      if (createError) throw createError;

      // Then create the permission mappings
      if (permissionIds.length > 0) {
        const mappings = permissionIds.map(permissionId => ({
          user_type_id: newUserType.id,
          permission_id: permissionId
        }));

        const { error: mappingError } = await supabase
          .from('user_type_permissions')
          .insert(mappings);

        if (mappingError) throw mappingError;
      }

      toast.success('Tipo de usuário criado com sucesso');
      await fetchUserTypes(); // Refresh the data
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Error creating user type:', error);
      toast.error(`Erro ao criar tipo de usuário: ${error.message}`);
      return false;
    }
  };

  const updateUserType = async (id: string, name: string, description: string, permissionIds: string[]) => {
    try {
      // Update the user type
      const { error: updateError } = await supabase
        .from('user_types')
        .update({ name, description })
        .eq('id', id);

      if (updateError) throw updateError;

      // Delete all existing permission mappings for this user type
      const { error: deleteError } = await supabase
        .from('user_type_permissions')
        .delete()
        .eq('user_type_id', id);

      if (deleteError) throw deleteError;

      // Create new permission mappings
      if (permissionIds.length > 0) {
        const mappings = permissionIds.map(permissionId => ({
          user_type_id: id,
          permission_id: permissionId
        }));

        const { error: mappingError } = await supabase
          .from('user_type_permissions')
          .insert(mappings);

        if (mappingError) throw mappingError;
      }

      toast.success('Tipo de usuário atualizado com sucesso');
      await fetchUserTypes(); // Refresh the data
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Error updating user type:', error);
      toast.error(`Erro ao atualizar tipo de usuário: ${error.message}`);
      return false;
    }
  };

  const deleteUserType = async (id: string) => {
    try {
      // Check if there are users with this user type
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('user_type_id', id);

      if (usersError) throw usersError;

      if (users && users.length > 0) {
        toast.error('Este tipo de usuário não pode ser excluído pois existem usuários associados a ele');
        return false;
      }

      // Delete the user type - this will also delete the permission mappings due to the cascade constraint
      const { error: deleteError } = await supabase
        .from('user_types')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast.success('Tipo de usuário excluído com sucesso');
      await fetchUserTypes(); // Refresh the data
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Error deleting user type:', error);
      toast.error(`Erro ao excluir tipo de usuário: ${error.message}`);
      return false;
    }
  };

  useEffect(() => {
    fetchUserTypes();
  }, [fetchUserTypes]);

  return {
    userTypes,
    permissions,
    isLoading,
    error,
    fetchUserTypes,
    createUserType,
    updateUserType,
    deleteUserType
  };
}
