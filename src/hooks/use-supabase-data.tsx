
import { useState, useEffect, useCallback } from 'react';
import { supabase, Tables } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

// Define the table names as a union type from the Supabase schema
type TableName = keyof Database['public']['Tables'];

// Define a more specific return type for the query to avoid infinite type instantiation
type QueryResult<T> = T[] | null;

// Hook for CRUD operations with Supabase
export function useSupabaseData<T extends Record<string, any>>(
  tableName: TableName, 
  options: {
    initialData?: T[],
    select?: string,
    orderBy?: { column: string, ascending: boolean },
    joinTable?: string,
    filterKey?: string,
    filterValue?: string | number,
  } = {}
) {
  const [data, setData] = useState<T[]>(options.initialData || []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use a generic approach that avoids the type issues but maintains safety
      let query = supabase
        .from(tableName)
        .select(options.select || '*') as any;

      // Add join table if needed
      if (options.joinTable) {
        // Cast to any to avoid the infinite type instantiation
        query = query.select(`*, ${options.joinTable}(*)`) as any;
      }

      // Add filtering if needed
      if (options.filterKey && options.filterValue !== undefined) {
        query = query.eq(options.filterKey, options.filterValue);
      }

      // Add ordering if needed
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
      }

      const { data: responseData, error: responseError } = await query;

      if (responseError) {
        throw responseError;
      }

      // Use explicit type assertion with a simpler type
      const typedResponse = responseData as unknown as T[];
      setData(typedResponse);
      return typedResponse;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error(`Error fetching data from ${tableName}:`, error);
      toast.error(`Erro ao carregar dados: ${error.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [tableName, options.select, options.filterKey, options.filterValue, options.joinTable, options.orderBy]);

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
      // Add updated_at timestamp
      const recordWithTimestamp = {
        ...record,
        updated_at: new Date().toISOString()
      };

      const { data: updatedData, error: updateError } = await supabase
        .from(tableName)
        .update(recordWithTimestamp as any)
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
  }, [options.filterKey, options.filterValue]);

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
