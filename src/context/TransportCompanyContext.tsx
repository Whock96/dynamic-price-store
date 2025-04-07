
import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TransportCompany } from '@/types/types';

interface TransportCompanyContextType {
  companies: TransportCompany[];
  isLoading: boolean;
  error: string | null;
  getCompanyById: (id: string) => TransportCompany | undefined;
  addCompany: (company: Omit<TransportCompany, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TransportCompany | null>;
  updateCompany: (id: string, company: Partial<TransportCompany>) => Promise<TransportCompany | null>;
  deleteCompany: (id: string) => Promise<boolean>;
  refreshCompanies: () => Promise<void>;
}

// Function to convert Supabase format to our frontend model
const supabaseToTransportCompany = (supabaseCompany: any): TransportCompany => ({
  id: supabaseCompany.id,
  name: supabaseCompany.name,
  document: supabaseCompany.document,
  phone: supabaseCompany.phone || '',
  email: supabaseCompany.email || '',
  whatsapp: supabaseCompany.whatsapp || '',
  createdAt: new Date(supabaseCompany.created_at),
  updatedAt: new Date(supabaseCompany.updated_at),
});

// Function to convert our frontend model to Supabase format
const transportCompanyToSupabase = (company: Partial<TransportCompany>): Record<string, any> => {
  const result: Record<string, any> = {};
  
  if ('name' in company) result.name = company.name;
  if ('document' in company) result.document = company.document;
  if ('phone' in company) result.phone = company.phone;
  if ('email' in company) result.email = company.email;
  if ('whatsapp' in company) result.whatsapp = company.whatsapp;
  
  return result;
};

const TransportCompanyContext = createContext<TransportCompanyContextType | undefined>(undefined);

export const TransportCompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<TransportCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Since we need to query a custom table, we'll use raw SQL
      const { data, error } = await supabase
        .from('transport_companies')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching transport companies:', error);
        setError(`Erro ao buscar transportadoras: ${error.message}`);
        return;
      }
      
      setCompanies((data || []).map(supabaseToTransportCompany));
    } catch (err: any) {
      console.error('Error in fetchCompanies:', err);
      setError('Ocorreu um erro ao buscar as transportadoras');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  React.useEffect(() => {
    fetchCompanies();
  }, []);

  const refreshCompanies = useCallback(async () => {
    await fetchCompanies();
  }, []);

  const getCompanyById = useCallback((id: string) => {
    return companies.find(company => company.id === id);
  }, [companies]);

  const addCompany = async (companyData: Omit<TransportCompany, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      
      // Convert to Supabase format
      const supabaseData = transportCompanyToSupabase(companyData as TransportCompany);
      
      // Ensure required fields
      if (!companyData.name || !companyData.document) {
        toast.error('Nome e CNPJ são campos obrigatórios');
        return null;
      }
      
      // Add to database using raw SQL
      const { data, error } = await supabase
        .from('transport_companies')
        .insert({
          name: companyData.name,
          document: companyData.document,
          phone: companyData.phone,
          email: companyData.email,
          whatsapp: companyData.whatsapp
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error adding transport company:', error);
        toast.error(`Erro ao adicionar transportadora: ${error.message}`);
        setError(error.message);
        return null;
      }
      
      const newCompany = supabaseToTransportCompany(data);
      setCompanies(prev => [...prev, newCompany]);
      toast.success('Transportadora adicionada com sucesso');
      return newCompany;
    } catch (err: any) {
      console.error('Error in addCompany:', err);
      setError(err.message || 'Ocorreu um erro ao adicionar a transportadora');
      toast.error('Erro ao adicionar transportadora');
      return null;
    }
  };

  const updateCompany = async (id: string, companyData: Partial<TransportCompany>) => {
    try {
      setError(null);
      
      // Convert to Supabase format
      const supabaseData = transportCompanyToSupabase(companyData);
      
      // Update using raw SQL
      const { data, error } = await supabase
        .from('transport_companies')
        .update(supabaseData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating transport company:', error);
        toast.error(`Erro ao atualizar transportadora: ${error.message}`);
        setError(error.message);
        return null;
      }
      
      const updatedCompany = supabaseToTransportCompany(data);
      setCompanies(prev => 
        prev.map(company => company.id === id ? updatedCompany : company)
      );
      toast.success('Transportadora atualizada com sucesso');
      return updatedCompany;
    } catch (err: any) {
      console.error('Error in updateCompany:', err);
      setError(err.message || 'Ocorreu um erro ao atualizar a transportadora');
      toast.error('Erro ao atualizar transportadora');
      return null;
    }
  };

  const deleteCompany = async (id: string) => {
    try {
      setError(null);
      
      // Delete using raw SQL
      const { error } = await supabase
        .from('transport_companies')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting transport company:', error);
        toast.error(`Erro ao excluir transportadora: ${error.message}`);
        setError(error.message);
        return false;
      }
      
      setCompanies(prev => prev.filter(company => company.id !== id));
      toast.success('Transportadora excluída com sucesso');
      return true;
    } catch (err: any) {
      console.error('Error in deleteCompany:', err);
      setError(err.message || 'Ocorreu um erro ao excluir a transportadora');
      toast.error('Erro ao excluir transportadora');
      return false;
    }
  };

  return (
    <TransportCompanyContext.Provider value={{ 
      companies, 
      isLoading,
      error,
      getCompanyById, 
      addCompany, 
      updateCompany,
      deleteCompany,
      refreshCompanies
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
