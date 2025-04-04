
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define the table names explicitly without recursive types
type TableName = 
  | 'products' 
  | 'customers' 
  | 'orders' 
  | 'categories' 
  | 'company_settings' 
  | 'discount_options' 
  | 'order_discounts' 
  | 'order_items' 
  | 'subcategories'
  | 'users'
  | 'user_types'
  | 'permissions'
  | 'user_type_permissions';

export function useSupabaseData<T extends Record<string, any>>(
  tableName: TableName, 
  options: {
    initialData?: T[],
    select?: string,
    orderBy?: { column: string, ascending: boolean },
    joinTable?: string,
    filterKey?: string,
    filterValue?: string | number,
    isActive?: boolean, // Filter by is_active
  } = {}
) {
  const [data, setData] = useState<T[]>(options.initialData || []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Simplified fetch data function with explicit type casting
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use any type to avoid TypeScript recursion issues
      let query: any = supabase.from(tableName).select(options.select || '*');

      // Add join table if needed
      if (options.joinTable) {
        query = query.select(`*, ${options.joinTable}(*)`);
      }

      // Add filtering if needed
      if (options.filterKey && options.filterValue !== undefined) {
        query = query.eq(options.filterKey, options.filterValue);
      }

      // Add active filtering if needed - check if the table has this column
      if (options.isActive !== undefined) {
        // Only apply is_active filter for tables that actually have this column
        // user_types table doesn't have an is_active column
        if (tableName !== 'permissions' && tableName !== 'user_types') {
          query = query.eq('is_active', options.isActive);
        }
      }

      // Add ordering if needed
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
      }

      const { data: responseData, error: responseError } = await query;

      if (responseError) throw responseError;

      // Use explicit type casting to avoid TypeScript recursion
      setData(responseData as unknown as T[]);
      return responseData as unknown as T[];
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error(`Error fetching data from ${tableName}:`, error);
      toast.error(`Erro ao carregar dados: ${error.message}`);
      return [] as T[];
    } finally {
      setIsLoading(false);
    }
  }, [tableName, options.select, options.filterKey, options.filterValue, options.joinTable, options.orderBy, options.isActive]);

  // Create a new record
  const createRecord = async (record: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: createdData, error: createError } = await supabase
        .from(tableName)
        .insert(record as any)
        .select();

      if (createError) throw createError;

      // Refetch to get the full data with any joins
      fetchData();
      
      toast.success('Registro criado com sucesso');
      return createdData?.[0] as unknown as T;
    } catch (err) {
      const error = err as Error;
      console.error(`Error creating record in ${tableName}:`, error);
      toast.error(`Erro ao criar registro: ${error.message}`);
      return null;
    }
  };

  // Update an existing record
  const updateRecord = async (id: string, record: Partial<T>) => {
    try {
      // Convert between updatedAt and updated_at if needed
      const recordToUpdate: any = { ...record };
      
      // Ensure we're using the right field based on the table format
      if (tableName === 'user_types' && recordToUpdate.updatedAt && !recordToUpdate.updated_at) {
        recordToUpdate.updated_at = recordToUpdate.updatedAt instanceof Date 
          ? recordToUpdate.updatedAt.toISOString() 
          : recordToUpdate.updatedAt;
        delete recordToUpdate.updatedAt;
      } else if (tableName !== 'user_types' && !recordToUpdate.updated_at) {
        recordToUpdate.updated_at = new Date().toISOString();
      }

      const { data: updatedData, error: updateError } = await supabase
        .from(tableName)
        .update(recordToUpdate)
        .eq('id', id)
        .select();

      if (updateError) throw updateError;

      // Optimistically update local state
      setData(prevData => 
        prevData.map(item => 
          (item as any).id === id ? { ...item, ...record } : item
        )
      );

      toast.success('Registro atualizado com sucesso');
      return updatedData?.[0] as unknown as T;
    } catch (err) {
      const error = err as Error;
      console.error(`Error updating record in ${tableName}:`, error);
      toast.error(`Erro ao atualizar registro: ${error.message}`);
      return null;
    }
  };

  // Delete a record
  const deleteRecord = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Optimistically update local state
      setData(prevData => 
        prevData.filter(item => (item as any).id !== id)
      );

      toast.success('Registro excluído com sucesso');
      return true;
    } catch (err) {
      const error = err as Error;
      console.error(`Error deleting record from ${tableName}:`, error);
      toast.error(`Erro ao excluir registro: ${error.message}`);
      return false;
    }
  };

  // Get a record by ID
  const getRecordById = useCallback((id: string) => {
    return data.find(item => (item as any).id === id);
  }, [data]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.filterKey, options.filterValue, options.isActive]);

  return {
    data,
    isLoading,
    error,
    fetchData,
    createRecord,
    updateRecord,
    deleteRecord,
    getRecordById
  };
}
