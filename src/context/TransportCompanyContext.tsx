
import React, { createContext, useContext, useState, useCallback } from 'react';
import { TransportCompany } from '@/types/types';
import { useSupabaseData } from '@/hooks/use-supabase-data';
import { Tables } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { supabaseToTransportCompany, transportCompanyToSupabase } from '@/utils/transport-company-adapter';

// Define the context type
interface TransportCompanyContextType {
  transportCompanies: TransportCompany[];
  isLoading: boolean;
  getTransportCompanyById: (id: string) => TransportCompany | undefined;
  addTransportCompany: (company: Omit<TransportCompany, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TransportCompany | null>;
  updateTransportCompany: (id: string, company: Partial<TransportCompany>) => Promise<TransportCompany | null>;
  deleteTransportCompany: (id: string) => Promise<boolean>;
  refreshTransportCompanies: () => Promise<void>;
}

// Create the context
const TransportCompanyContext = createContext<TransportCompanyContextType | undefined>(undefined);

// Create the provider component
export const TransportCompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use the Supabase data hook for transport companies
  const { 
    data: supabaseCompanies, 
    isLoading,
    createRecord,
    updateRecord,
    deleteRecord,
    fetchData: fetchSupabaseData
  } = useSupabaseData<Tables<'transport_companies'>>('transport_companies', {
    orderBy: { column: 'name', ascending: true }
  });

  // Convert Supabase data to our frontend model
  const transportCompanies = React.useMemo(() => {
    return supabaseCompanies.map(supabaseToTransportCompany);
  }, [supabaseCompanies]);

  // Function to refresh data
  const refreshTransportCompanies = useCallback(async () => {
    try {
      await fetchSupabaseData();
    } catch (error) {
      console.error('Error refreshing transport companies:', error);
    }
  }, [fetchSupabaseData]);

  // Get company by ID
  const getTransportCompanyById = useCallback((id: string) => {
    return transportCompanies.find(company => company.id === id);
  }, [transportCompanies]);

  // Add a new transport company
  const addTransportCompany = async (companyData: Omit<TransportCompany, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Adding transport company with data:', companyData);
      
      // Convert to Supabase format
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

  // Update an existing transport company
  const updateTransportCompany = async (id: string, companyData: Partial<TransportCompany>) => {
    try {
      console.log('Updating transport company with data:', companyData);
      
      // Convert to Supabase format
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

  // Delete a transport company
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

// Hook to use the transport company context
export const useTransportCompanies = () => {
  const context = useContext(TransportCompanyContext);
  if (context === undefined) {
    throw new Error('useTransportCompanies must be used within a TransportCompanyProvider');
  }
  return context;
};
