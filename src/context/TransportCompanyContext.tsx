
import React, { createContext, useContext, useState, useCallback } from 'react';
import { TransportCompany } from '@/types/types';
import { useSupabaseData } from '@/hooks/use-supabase-data';
import { supabase, Tables } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define the type that maps to the Supabase table structure
type SupabaseTransportCompany = Tables<'transport_companies'>;

interface TransportCompanyContextType {
  transportCompanies: TransportCompany[];
  isLoading: boolean;
  getTransportCompanyById: (id: string) => TransportCompany | undefined;
  addTransportCompany: (company: Omit<TransportCompany, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TransportCompany | null>;
  updateTransportCompany: (id: string, company: Partial<TransportCompany>) => Promise<TransportCompany | null>;
  deleteTransportCompany: (id: string) => Promise<boolean>;
  refreshTransportCompanies: () => Promise<void>;
}

const TransportCompanyContext = createContext<TransportCompanyContextType | undefined>(undefined);

// Function to convert from Supabase format to our frontend model
const supabaseToTransportCompany = (supabaseCompany: SupabaseTransportCompany): TransportCompany => ({
  id: supabaseCompany.id,
  name: supabaseCompany.name,
  document: supabaseCompany.document,
  email: supabaseCompany.email || '',
  phone: supabaseCompany.phone || '',
  whatsapp: supabaseCompany.whatsapp || '',
  createdAt: new Date(supabaseCompany.created_at),
  updatedAt: new Date(supabaseCompany.updated_at || supabaseCompany.created_at),
});

// Function to convert from our frontend model to Supabase format
const transportCompanyToSupabase = (company: Partial<TransportCompany>): Partial<SupabaseTransportCompany> => {
  const result: Partial<SupabaseTransportCompany> = {};
  
  if ('name' in company) result.name = company.name;
  if ('document' in company) result.document = company.document;
  if ('email' in company) result.email = company.email;
  if ('phone' in company) result.phone = company.phone;
  if ('whatsapp' in company) result.whatsapp = company.whatsapp;
  
  return result;
};

export const TransportCompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use our custom hook for Supabase data
  const { 
    data: supabaseTransportCompanies, 
    isLoading,
    createRecord,
    updateRecord,
    deleteRecord,
    getRecordById: getSupabaseTransportCompanyById,
    fetchData: fetchSupabaseData
  } = useSupabaseData<SupabaseTransportCompany>('transport_companies', {
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
    return transportCompanies.find(company => company.id === id);
  }, [transportCompanies]);

  const addTransportCompany = async (companyData: Omit<TransportCompany, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Adding transport company with data:', companyData);
      
      // Add to Supabase
      const supabaseData = transportCompanyToSupabase(companyData);
      console.log('Final Supabase data for insert:', supabaseData);
      
      const createdCompany = await createRecord(supabaseData as any);
      
      if (createdCompany) {
        console.log('Created transport company record:', createdCompany);
        await refreshTransportCompanies();
        return supabaseToTransportCompany(createdCompany);
      }
      return null;
    } catch (error) {
      console.error('Error adding transport company:', error);
      toast.error('Erro ao adicionar transportadora');
      return null;
    }
  };

  const updateTransportCompany = async (id: string, companyData: Partial<TransportCompany>) => {
    try {
      console.log('Updating transport company with data:', companyData);
      
      // Update in Supabase
      const supabaseData = transportCompanyToSupabase(companyData);
      console.log('Final Supabase data for update:', supabaseData);
      
      const updatedCompany = await updateRecord(id, supabaseData);
      
      if (updatedCompany) {
        console.log('Updated transport company record:', updatedCompany);
        await refreshTransportCompanies();
        return supabaseToTransportCompany(updatedCompany);
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
