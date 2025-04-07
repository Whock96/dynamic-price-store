
import React, { createContext, useContext, useState, useCallback } from 'react';
import { TransportCompany } from '@/types/types';
import { useSupabaseData } from '@/hooks/use-supabase-data';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TransportCompanyContextType {
  transportCompanies: TransportCompany[];
  isLoading: boolean;
  setTransportCompanies: React.Dispatch<React.SetStateAction<TransportCompany[]>>;
  getTransportCompanyById: (id: string) => TransportCompany | undefined;
  addTransportCompany: (transportCompany: Omit<TransportCompany, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TransportCompany | null>;
  updateTransportCompany: (id: string, transportCompany: Partial<TransportCompany>) => Promise<TransportCompany | null>;
  deleteTransportCompany: (id: string) => Promise<boolean>;
  refreshTransportCompanies: () => Promise<void>;
}

const TransportCompanyContext = createContext<TransportCompanyContextType | undefined>(undefined);

// Define the type that maps to the Supabase table structure
type TransportCompanyDB = {
  id: string;
  name: string;
  document: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  created_at: string;
  updated_at: string;
};

// Function to convert the Supabase format to our frontend model
const supabaseToTransportCompany = (supabaseTransportCompany: TransportCompanyDB): TransportCompany => ({
  id: supabaseTransportCompany.id,
  name: supabaseTransportCompany.name,
  document: supabaseTransportCompany.document,
  email: supabaseTransportCompany.email || '',
  phone: supabaseTransportCompany.phone || '',
  whatsapp: supabaseTransportCompany.whatsapp || '',
  createdAt: new Date(supabaseTransportCompany.created_at),
  updatedAt: new Date(supabaseTransportCompany.updated_at),
});

// Function to convert our frontend model to the Supabase format
const transportCompanyToSupabase = (transportCompany: Partial<TransportCompany>): Partial<TransportCompanyDB> => {
  const result: Partial<TransportCompanyDB> = {};
  
  if ('name' in transportCompany) result.name = transportCompany.name;
  if ('document' in transportCompany) result.document = transportCompany.document;
  if ('email' in transportCompany) result.email = transportCompany.email;
  if ('phone' in transportCompany) result.phone = transportCompany.phone;
  if ('whatsapp' in transportCompany) result.whatsapp = transportCompany.whatsapp;
  
  return result;
};

export const TransportCompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [localTransportCompanies, setLocalTransportCompanies] = useState<TransportCompany[]>([]);

  // Use our custom hook for Supabase data
  const { 
    data: supabaseTransportCompanies, 
    isLoading,
    createRecord,
    updateRecord,
    deleteRecord,
    getRecordById: getSupabaseTransportCompanyById,
    fetchData: fetchSupabaseData
  } = useSupabaseData<TransportCompanyDB>('transport_companies', {
    orderBy: { column: 'name', ascending: true }
  });

  // Convert Supabase transport companies to our frontend model
  const transportCompanies = React.useMemo(() => {
    return supabaseTransportCompanies.map(supabaseToTransportCompany);
  }, [supabaseTransportCompanies]);

  const refreshTransportCompanies = useCallback(async () => {
    try {
      await fetchSupabaseData();
    } catch (error) {
      console.error('Error refreshing transport companies:', error);
    }
  }, [fetchSupabaseData]);

  const getTransportCompanyById = useCallback((id: string) => {
    return transportCompanies.find(transportCompany => transportCompany.id === id);
  }, [transportCompanies]);

  const addTransportCompany = async (transportCompanyData: Omit<TransportCompany, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Adding transport company with data:', transportCompanyData);
      
      // Add to Supabase
      const supabaseData = transportCompanyToSupabase(transportCompanyData);
      
      console.log('Final Supabase data for insert:', supabaseData);
      
      const createdTransportCompany = await createRecord(supabaseData as any);
      
      if (createdTransportCompany) {
        console.log('Created transport company record:', createdTransportCompany);
        await refreshTransportCompanies();
        return supabaseToTransportCompany(createdTransportCompany as TransportCompanyDB);
      }
      return null;
    } catch (error) {
      console.error('Error adding transport company:', error);
      toast.error('Erro ao adicionar transportadora');
      return null;
    }
  };

  const updateTransportCompany = async (id: string, transportCompanyData: Partial<TransportCompany>) => {
    try {
      console.log('Updating transport company with data:', transportCompanyData);
      
      // Update in Supabase
      const supabaseData = transportCompanyToSupabase(transportCompanyData);
      
      console.log('Final Supabase data for update:', supabaseData);
      
      const updatedTransportCompany = await updateRecord(id, supabaseData);
      
      if (updatedTransportCompany) {
        console.log('Updated transport company record:', updatedTransportCompany);
        await refreshTransportCompanies();
        return supabaseToTransportCompany(updatedTransportCompany as TransportCompanyDB);
      }
      return null;
    } catch (error) {
      console.error('Error updating transport company:', error);
      toast.error('Erro ao atualizar transportadora');
      return null;
    }
  };

  const deleteTransportCompany = async (id: string) => {
    try {
      // Delete from Supabase
      const result = await deleteRecord(id);
      if (result) {
        await refreshTransportCompanies();
      }
      return result;
    } catch (error) {
      console.error('Error deleting transport company:', error);
      toast.error('Erro ao excluir transportadora');
      return false;
    }
  };

  return (
    <TransportCompanyContext.Provider value={{ 
      transportCompanies, 
      isLoading,
      setTransportCompanies: setLocalTransportCompanies, 
      getTransportCompanyById, 
      addTransportCompany, 
      updateTransportCompany,
      deleteTransportCompany,
      refreshTransportCompanies
    }}>
      {children}
    </TransportCompanyContext.Provider>
  );
};

export const useTransportCompanies = () => {
  const context = useContext(TransportCompanyContext);
  if (context === undefined) {
    throw new Error('useTransportCompanies must be used within a TransportCompanyProvider');
  }
  return context;
};
