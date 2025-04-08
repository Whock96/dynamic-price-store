
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

type OrderByOption = {
  column: string;
  ascending: boolean;
};

type FilterOption = {
  key: string;
  value: string | number;
};

interface SupabaseDataOptions<T> {
  initialData?: T[];
  select?: string;
  orderBy?: OrderByOption;
  joinTable?: string;
  filterKey?: string;
  filterValue?: string | number;
  filters?: FilterOption[]; // Suporte para múltiplos filtros
  isActive?: boolean;
  cacheTimeout?: number; // Tempo em ms para expirar o cache
}

// Implementar uma memória cache simples
interface CacheItem<T> {
  data: T[];
  timestamp: number;
  queryKey: string;
}

// Cache global para compartilhar entre instâncias do hook
const globalCache: Record<string, CacheItem<any>> = {};

// Helper para gerar uma chave de cache baseada nas opções
const generateCacheKey = (tableName: string, options: any): string => {
  return `${tableName}-${JSON.stringify(options)}`;
};

export function useSupabaseData<T extends Record<string, any>>(
  tableName: TableName, 
  options: SupabaseDataOptions<T> = {}
) {
  const [data, setData] = useState<T[]>(options.initialData || []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const optionsRef = useRef(options);
  const initialFetchDoneRef = useRef(false);
  
  // Cache timeout padronizado (30 segundos) ou personalizado
  const cacheTimeout = options.cacheTimeout || 30000;
  
  // Gere uma chave de cache baseada no tableName e nas opções
  const cacheKey = useMemo(() => 
    generateCacheKey(tableName, {
      select: options.select,
      orderBy: options.orderBy,
      joinTable: options.joinTable,
      filterKey: options.filterKey,
      filterValue: options.filterValue,
      filters: options.filters,
      isActive: options.isActive
    }), 
    [tableName, options.select, options.orderBy, options.joinTable, 
     options.filterKey, options.filterValue, options.filters, options.isActive]
  );

  // Simplified fetch data function with explicit type casting and cache support
  const fetchData = useCallback(async (skipCache = false) => {
    // Verificar se há dados em cache válidos
    if (!skipCache && globalCache[cacheKey]) {
      const cachedItem = globalCache[cacheKey];
      const now = Date.now();
      
      if (now - cachedItem.timestamp < cacheTimeout) {
        console.log(`Using cached data for ${tableName}`);
        setData(cachedItem.data as T[]);
        setIsLoading(false);
        setError(null);
        return cachedItem.data;
      }
    }
    
    setIsLoading(true);
    setError(null);
    console.log(`Fetching data from ${tableName} table...`);

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
      
      // Suporte para múltiplos filtros
      if (options.filters && options.filters.length > 0) {
        options.filters.forEach(filter => {
          query = query.eq(filter.key, filter.value);
        });
      }

      // Add active filtering if needed - check if the table has this column
      if (options.isActive !== undefined) {
        // Only apply is_active filter for tables that actually have this column
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

      console.log(`Successfully fetched ${responseData.length} records from ${tableName}`);
      
      // Save to cache
      globalCache[cacheKey] = {
        data: responseData,
        timestamp: Date.now(),
        queryKey: cacheKey
      };
      
      // Update state with the fetched data
      setData(responseData as unknown as T[]);
      setIsLoading(false);
      return responseData as unknown as T[];
    } catch (err) {
      const error = err as Error;
      setError(error);
      setIsLoading(false);
      console.error(`Error fetching data from ${tableName}:`, error);
      toast.error(`Erro ao carregar dados: ${error.message}`);
      return [] as T[];
    }
  }, [tableName, cacheKey, cacheTimeout, options.select, options.filterKey, options.filterValue, 
      options.filters, options.joinTable, options.orderBy, options.isActive]);

  // Função para limpar o cache
  const clearCache = useCallback(() => {
    delete globalCache[cacheKey];
    console.log(`Cache cleared for ${tableName}`);
  }, [cacheKey, tableName]);

  // Create a new record with optimized code
  const createRecord = async (record: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log(`Creating record in ${tableName}:`, record);
      
      // Prepare the record for Supabase by converting camelCase to snake_case
      const recordToCreate: Record<string, any> = prepareRecordForSupabase(record);
      
      console.log('Prepared record to create:', recordToCreate);

      const { data: createdData, error: createError } = await supabase
        .from(tableName)
        .insert(recordToCreate)
        .select();

      if (createError) {
        console.error('Supabase error details:', createError);
        throw createError;
      }

      console.log('Created data:', createdData);
      
      // Clear cache to ensure fresh data
      clearCache();
      
      // Refetch data to update the view
      await fetchData(true);
      
      toast.success('Registro criado com sucesso');
      return createdData?.[0] as unknown as T;
    } catch (err) {
      const error = err as Error;
      console.error(`Error creating record in ${tableName}:`, error);
      toast.error(`Erro ao criar registro: ${error.message}`);
      return null;
    }
  };

  // Update an existing record with optimized code
  const updateRecord = async (id: string, record: Partial<T>) => {
    try {
      console.log(`Updating record in ${tableName}:`, id, record);
      
      // Convert between camelCase and snake_case if needed
      const recordToUpdate: Record<string, any> = prepareRecordForSupabase(record);
      
      // Ensure updated_at field is set
      if (recordToUpdate.updated_at === undefined) {
        recordToUpdate.updated_at = new Date().toISOString();
      }

      console.log('Prepared record to update:', recordToUpdate);

      const { data: updatedData, error: updateError } = await supabase
        .from(tableName)
        .update(recordToUpdate)
        .eq('id', id)
        .select();

      if (updateError) {
        console.error('Supabase error details:', updateError);
        throw updateError;
      }

      console.log('Updated data:', updatedData);

      // Clear cache for this query
      clearCache();
      
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

  // Delete a record with improved error handling
  const deleteRecord = async (id: string) => {
    try {
      console.log(`Deleting record from ${tableName}:`, id);
      
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      // Clear cache
      clearCache();

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

  // Helper function to prepare records for Supabase
  const prepareRecordForSupabase = (record: Record<string, any>): Record<string, any> => {
    const result: Record<string, any> = { ...record };
    
    // Handle common conversions
    if (result.createdAt !== undefined && result.created_at === undefined) {
      result.created_at = result.createdAt instanceof Date 
        ? result.createdAt.toISOString() 
        : result.createdAt;
      delete result.createdAt;
    }
    
    if (result.updatedAt !== undefined && result.updated_at === undefined) {
      result.updated_at = result.updatedAt instanceof Date 
        ? result.updatedAt.toISOString() 
        : result.updatedAt;
      delete result.updatedAt;
    }
    
    // Handle table-specific conversions
    if (tableName === 'customers') {
      // Handle salesPersonId specifically
      if (result.salesPersonId !== undefined) {
        result.sales_person_id = result.salesPersonId;
        delete result.salesPersonId;
      }
      
      // Handle other customer-specific conversions
      if (result.companyName !== undefined) {
        result.company_name = result.companyName;
        delete result.companyName;
      }
      
      if (result.zipCode !== undefined) {
        result.zip_code = result.zipCode;
        delete result.zipCode;
      }
      
      if (result.noNumber !== undefined) {
        result.no_number = result.noNumber;
        delete result.noNumber;
      }
      
      if (result.defaultDiscount !== undefined) {
        result.default_discount = result.defaultDiscount;
        delete result.defaultDiscount;
      }
      
      if (result.maxDiscount !== undefined) {
        result.max_discount = result.maxDiscount;
        delete result.maxDiscount;
      }
      
      if (result.stateRegistration !== undefined) {
        result.state_registration = result.stateRegistration;
        delete result.stateRegistration;
      }
    }
    
    // Ensure timestamps are set
    if (!result.created_at && result.id === undefined) {
      result.created_at = new Date().toISOString();
    }
    
    if (!result.updated_at) {
      result.updated_at = new Date().toISOString();
    }
    
    // Never send an empty ID, let Supabase generate one
    if (result.id === undefined || result.id === null || result.id === '') {
      delete result.id;
    }
    
    return result;
  };

  // Get a record by ID with enhanced performance
  const getRecordById = useCallback((id: string) => {
    return data.find(item => (item as any).id === id);
  }, [data]);

  // Function to check if options have changed
  const haveOptionsChanged = useCallback(() => {
    // Deep comparison for specific option properties
    const prev = optionsRef.current;
    
    if (
      options.filterKey !== prev.filterKey ||
      options.filterValue !== prev.filterValue ||
      options.isActive !== prev.isActive ||
      options.select !== prev.select ||
      options.joinTable !== prev.joinTable
    ) {
      return true;
    }
    
    // Compare filter arrays
    if (Array.isArray(options.filters) !== Array.isArray(prev.filters)) {
      return true;
    }
    
    if (Array.isArray(options.filters) && Array.isArray(prev.filters)) {
      if (options.filters.length !== prev.filters.length) {
        return true;
      }
      
      for (let i = 0; i < options.filters.length; i++) {
        if (
          options.filters[i].key !== prev.filters[i].key ||
          options.filters[i].value !== prev.filters[i].value
        ) {
          return true;
        }
      }
    }
    
    // Deep comparison for orderBy object
    if (options.orderBy && prev.orderBy) {
      return (
        options.orderBy.column !== prev.orderBy.column ||
        options.orderBy.ascending !== prev.orderBy.ascending
      );
    }
    
    // One has orderBy and the other doesn't
    if ((!options.orderBy && prev.orderBy) || (options.orderBy && !prev.orderBy)) {
      return true;
    }
    
    return false;
  }, [options, optionsRef]);

  // Initial data fetch only once
  useEffect(() => {
    if (!initialFetchDoneRef.current) {
      console.log(`Initial fetch for ${tableName} - initialFetchDoneRef: ${initialFetchDoneRef.current}`);
      fetchData();
      initialFetchDoneRef.current = true;
      optionsRef.current = { ...options };
    }
  }, [tableName, fetchData]);

  // This separate effect handles option changes only after initial fetch
  useEffect(() => {
    if (initialFetchDoneRef.current && haveOptionsChanged()) {
      console.log(`Options changed for ${tableName}, re-fetching data`);
      fetchData();
      optionsRef.current = { ...options };
    }
  }, [
    options.filterKey, 
    options.filterValue, 
    options.isActive,
    options.select,
    options.joinTable,
    options.orderBy?.column,
    options.orderBy?.ascending,
    options.filters,
    haveOptionsChanged,
    fetchData,
    tableName
  ]);

  return {
    data,
    isLoading,
    error,
    fetchData,
    createRecord,
    updateRecord,
    deleteRecord,
    getRecordById,
    clearCache, // Expor a função para limpar o cache
    refresh: () => fetchData(true) // Adicionar um método de conveniência para forçar atualização
  };
}
