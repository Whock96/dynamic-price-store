
import { useState, useEffect } from 'react';
import { supabase, Tables } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

// Define a type for the valid table names
type TableNames = keyof Database['public']['Tables'];

export const useSupabaseData = <T extends Record<string, any>>(
  tableName: string,
  initialFilters?: { column: string; value: any }[],
  orderBy?: { column: string; ascending?: boolean }
) => {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use type assertion to handle the dynamic table name
      let query = supabase.from(tableName as any).select('*');

      if (initialFilters) {
        initialFilters.forEach(({ column, value }) => {
          query = query.eq(column, value);
        });
      }

      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending });
      }

      const { data: responseData, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError);
      } else if (responseData) {
        // Use type assertion to avoid type conflicts
        setData(responseData as unknown as T[]);
      }
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const createRecord = async (record: Omit<T, 'id'>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: createdRecord, error: createError } = await supabase
        .from(tableName as any)
        .insert([record as any])
        .select()
        .single();

      if (createError) {
        setError(createError);
        throw createError;
      }

      await fetchData();
      // Use proper type conversion with unknown as intermediate step
      return (createdRecord as unknown) as T;
    } catch (e) {
      setError(e as Error);
      return null as any;
    } finally {
      setIsLoading(false);
    }
  };

  const updateRecord = async (id: string, data: Partial<T>) => {
    try {
      // Para depurar o problema de conversão de números
      console.log(`Atualizando registro em ${tableName}:`, data);
      
      const { data: updatedRecord, error } = await supabase
        .from(tableName as any)
        .update(data as any)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating record in ${tableName}:`, error);
        throw error;
      }

      await fetchData();
      // Use proper type conversion with unknown as intermediate step
      return (updatedRecord as unknown) as T;
    } catch (error) {
      console.error(`Error updating record in ${tableName}:`, error);
      throw error;
    }
  };

  const deleteRecord = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', id);

      if (deleteError) {
        setError(deleteError);
        return false;
      }

      await fetchData();
      return true;
    } catch (e) {
      setError(e as Error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getRecordById = async (id: string) => {
    try {
      const { data: record, error } = await supabase
        .from(tableName as any)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      // Use proper type conversion with unknown as intermediate step
      return (record as unknown) as T;
    } catch (error) {
      console.error(`Error getting record from ${tableName}:`, error);
      return null;
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
};
