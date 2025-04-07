
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

export function useSupabaseData<T>(tableName: string) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: fetchedData, error: fetchError } = await supabase
        .from(tableName)
        .select('*');
      
      if (fetchError) {
        throw fetchError;
      }
      
      setData(fetchedData || []);
      return fetchedData;
    } catch (err) {
      const postgrestError = err as PostgrestError;
      setError(postgrestError);
      console.error(`Error fetching data from ${tableName}:`, postgrestError);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getRecordById = async (id: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      return data as T;
    } catch (err) {
      const postgrestError = err as PostgrestError;
      console.error(`Error fetching record by ID from ${tableName}:`, postgrestError);
      return null;
    }
  };

  const createRecord = async (record: Partial<T>) => {
    try {
      const { data, error: insertError } = await supabase
        .from(tableName)
        .insert(record)
        .select()
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      await fetchData();
      return data as T;
    } catch (err) {
      const postgrestError = err as PostgrestError;
      console.error(`Error creating record in ${tableName}:`, postgrestError);
      throw err;
    }
  };

  const updateRecord = async (id: string, record: Partial<T>) => {
    try {
      const { data, error: updateError } = await supabase
        .from(tableName)
        .update(record)
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) {
        throw updateError;
      }
      
      await fetchData();
      return data as T;
    } catch (err) {
      const postgrestError = err as PostgrestError;
      console.error(`Error updating record in ${tableName}:`, postgrestError);
      throw err;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        throw deleteError;
      }
      
      await fetchData();
      return true;
    } catch (err) {
      const postgrestError = err as PostgrestError;
      console.error(`Error deleting record from ${tableName}:`, postgrestError);
      throw err;
    }
  };

  useEffect(() => {
    fetchData();
  }, [tableName]);

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
