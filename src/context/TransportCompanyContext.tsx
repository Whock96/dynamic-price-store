
import React, { createContext, useContext, useState, useCallback } from 'react';
import { TransportCompany } from '@/types/types';
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

export const TransportCompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch transport companies from Supabase
  const fetchSupabaseData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('transport_companies')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching transport companies:', error);
        toast.error('Erro ao carregar transportadoras');
        return;
      }

      if (data) {
        const mappedCompanies = data.map(company => supabaseToTransportCompany(company as TransportCompanyDB));
        setTransportCompanies(mappedCompanies);
      }
    } catch (error) {
      console.error('Error in fetchSupabaseData:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get a record by ID
  const getTransportCompanyById = useCallback((id: string) => {
    return transportCompanies.find(transportCompany => transportCompany.id === id);
  }, [transportCompanies]);

  // Create a new record
  const addTransportCompany = async (transportCompanyData: Omit<TransportCompany, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Adding transport company with data:', transportCompanyData);
      
      // Prepare data for Supabase insert
      const supabaseData = {
        name: transportCompanyData.name,
        document: transportCompanyData.document,
        email: transportCompanyData.email || null,
        phone: transportCompanyData.phone || null,
        whatsapp: transportCompanyData.whatsapp || null
      };
      
      // Add to Supabase
      const { data, error } = await supabase
        .from('transport_companies')
        .insert(supabaseData)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error creating transport company:', error);
        toast.error('Erro ao adicionar transportadora');
        return null;
      }
      
      if (data) {
        const newCompany = supabaseToTransportCompany(data as TransportCompanyDB);
        setTransportCompanies(prev => [...prev, newCompany]);
        return newCompany;
      }
      
      return null;
    } catch (error) {
      console.error('Error adding transport company:', error);
      toast.error('Erro ao adicionar transportadora');
      return null;
    }
  };

  // Update an existing record
  const updateTransportCompany = async (id: string, transportCompanyData: Partial<TransportCompany>) => {
    try {
      console.log('Updating transport company with data:', transportCompanyData);
      
      // Prepare data for Supabase update
      const supabaseData: { [key: string]: any } = {};
      
      if ('name' in transportCompanyData) supabaseData.name = transportCompanyData.name;
      if ('document' in transportCompanyData) supabaseData.document = transportCompanyData.document;
      if ('email' in transportCompanyData) supabaseData.email = transportCompanyData.email || null;
      if ('phone' in transportCompanyData) supabaseData.phone = transportCompanyData.phone || null;
      if ('whatsapp' in transportCompanyData) supabaseData.whatsapp = transportCompanyData.whatsapp || null;
      
      // Update in Supabase
      const { data, error } = await supabase
        .from('transport_companies')
        .update(supabaseData)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error updating transport company:', error);
        toast.error('Erro ao atualizar transportadora');
        return null;
      }
      
      if (data) {
        const updatedCompany = supabaseToTransportCompany(data as TransportCompanyDB);
        setTransportCompanies(prev => 
          prev.map(company => company.id === id ? updatedCompany : company)
        );
        return updatedCompany;
      }
      
      return null;
    } catch (error) {
      console.error('Error updating transport company:', error);
      toast.error('Erro ao atualizar transportadora');
      return null;
    }
  };

  // Delete a record
  const deleteTransportCompany = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transport_companies')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting transport company:', error);
        toast.error('Erro ao excluir transportadora');
        return false;
      }

      setTransportCompanies(prev => prev.filter(company => company.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting transport company:', error);
      toast.error('Erro ao excluir transportadora');
      return false;
    }
  };

  // Refresh transport companies
  const refreshTransportCompanies = async () => {
    await fetchSupabaseData();
  };

  // Initialize data
  React.useEffect(() => {
    fetchSupabaseData();
  }, [fetchSupabaseData]);

  return (
    <TransportCompanyContext.Provider value={{ 
      transportCompanies, 
      isLoading,
      setTransportCompanies, 
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
