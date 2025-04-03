
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

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

    let query = supabase.from(tableName).select('*');

    if (initialFilters) {
      initialFilters.forEach(({ column, value }) => {
        query = query.eq(column, value);
      });
    }

    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending });
    }

    try {
      const { data: responseData, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError);
      } else if (responseData) {
        setData(responseData as T[]);
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
      const { error: createError } = await supabase
        .from(tableName)
        .insert([record]);

      if (createError) {
        setError(createError);
        throw createError;
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

  const updateRecord = async (id: string, data: Partial<T>) => {
    try {
      // Para depurar o problema de conversão de números
      console.log(`Atualizando registro em ${tableName}:`, data);
      
      const { error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id);

      if (error) {
        console.error(`Error updating record in ${tableName}:`, error);
        throw error;
      }

      await fetchData();
      return true;
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
        .from(tableName)
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
    deleteRecord
  };
};
