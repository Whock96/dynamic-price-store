
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSupabaseData } from '@/hooks/use-supabase-data';

export interface CompanyInfo {
  name: string;
  document: string; // CNPJ
  stateRegistration: string; // Inscrição Estadual
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website?: string;
}

interface CompanyContextType {
  companyInfo: CompanyInfo;
  setCompanyInfo: (info: CompanyInfo) => void;
  saveCompanyInfo: (info: CompanyInfo) => void;
  isLoading: boolean;
}

const initialCompanyInfo: CompanyInfo = {
  name: '',
  document: '',
  stateRegistration: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  email: '',
  website: ''
};

const COMPANY_INFO_STORAGE_KEY = 'ferplas-company-info';

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companyInfo, setCompanyInfoState] = useState<CompanyInfo>(initialCompanyInfo);
  
  // Fetch company data from Supabase if available
  const { data: companySettingsData, isLoading, fetchData } = useSupabaseData('company_settings');

  // This effect runs once on component mount
  useEffect(() => {
    // First try to load from Supabase
    if (companySettingsData && companySettingsData.length > 0) {
      // Map Supabase data format to our CompanyInfo format
      const settings = companySettingsData[0];
      const mappedInfo: CompanyInfo = {
        name: settings.name || '',
        document: settings.document || '',
        stateRegistration: settings.state_registration || '',
        address: settings.address || '',
        city: settings.city || '',
        state: settings.state || '',
        zipCode: settings.zip_code || '',
        phone: settings.phone || '',
        email: settings.email || '',
        website: settings.website || '',
      };
      setCompanyInfoState(mappedInfo);
      
      // Update localStorage with latest data from Supabase
      localStorage.setItem(COMPANY_INFO_STORAGE_KEY, JSON.stringify(mappedInfo));
    } 
    // If no data in Supabase, try localStorage as fallback
    else {
      const savedCompanyInfo = localStorage.getItem(COMPANY_INFO_STORAGE_KEY);
      
      if (savedCompanyInfo) {
        try {
          const parsedInfo = JSON.parse(savedCompanyInfo);
          setCompanyInfoState(parsedInfo);
        } catch (error) {
          console.error('Error loading company info from localStorage:', error);
        }
      }
    }
  }, [companySettingsData]);

  const saveCompanyInfo = async (info: CompanyInfo) => {
    try {
      // Save to localStorage
      localStorage.setItem(COMPANY_INFO_STORAGE_KEY, JSON.stringify(info));
      
      // Update context state
      setCompanyInfoState(info);
      
      // If we have company settings in Supabase, update them
      if (companySettingsData && companySettingsData.length > 0) {
        // Map our format to Supabase format
        const settingsId = companySettingsData[0].id;
        const mappedData = {
          name: info.name,
          document: info.document,
          state_registration: info.stateRegistration,
          address: info.address,
          city: info.city,
          state: info.state,
          zip_code: info.zipCode,
          phone: info.phone,
          email: info.email,
          website: info.website,
          updated_at: new Date().toISOString()
        };
        
        // Use our hook to update the record
        const { updateRecord } = useSupabaseData('company_settings');
        await updateRecord(settingsId, mappedData);
        
        // Refresh data
        fetchData();
      }
      
      toast.success('Dados da empresa salvos com sucesso!');
    } catch (error) {
      console.error('Error saving company info:', error);
      toast.error('Erro ao salvar informações da empresa');
    }
  };

  return (
    <CompanyContext.Provider value={{ 
      companyInfo, 
      setCompanyInfo: setCompanyInfoState, 
      saveCompanyInfo,
      isLoading
    }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
