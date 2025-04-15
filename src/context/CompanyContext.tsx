import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useSupabaseData } from '@/hooks/use-supabase-data';
import { supabase } from '@/integrations/supabase/client';

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
  saveCompanyInfo: (info: CompanyInfo) => Promise<void>;
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

export const CompanyProvider: React.FC<{ 
  children: React.ReactNode;
  initialData?: CompanyInfo;
}> = ({ 
  children,
  initialData 
}) => {
  const [companyInfo, setCompanyInfoState] = useState<CompanyInfo>(initialData || initialCompanyInfo);
  
  const { data: companySettingsData, isLoading, fetchData } = useSupabaseData('company_settings');

  useEffect(() => {
    if (companySettingsData && companySettingsData.length > 0) {
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
      localStorage.setItem(COMPANY_INFO_STORAGE_KEY, JSON.stringify(mappedInfo));
    } else {
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

  const saveCompanyInfo = useCallback(async (info: CompanyInfo) => {
    try {
      localStorage.setItem(COMPANY_INFO_STORAGE_KEY, JSON.stringify(info));
      setCompanyInfoState(info);
      
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
      
      console.log('Mapped data for Supabase:', mappedData);
      
      if (companySettingsData && companySettingsData.length > 0) {
        const settingsId = companySettingsData[0].id;
        console.log('Updating existing company settings with ID:', settingsId);
        const { error } = await supabase
          .from('company_settings')
          .update(mappedData)
          .eq('id', settingsId);
          
        if (error) throw error;
      } else {
        console.log('Creating new company settings record');
        const dataWithCreatedAt = {
          ...mappedData,
          created_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('company_settings')
          .insert(dataWithCreatedAt);
          
        if (error) throw error;
      }
      
      await fetchData();
      
      toast.success('Dados da empresa salvos com sucesso!');
    } catch (error) {
      console.error('Error saving company info:', error);
      toast.error('Erro ao salvar informações da empresa');
    }
  }, [companySettingsData, fetchData]);

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
