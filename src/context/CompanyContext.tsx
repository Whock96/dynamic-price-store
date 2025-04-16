
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useSupabaseData } from '@/hooks/use-supabase-data';
import { supabase } from '@/integrations/supabase/client';

export interface CompanyInfo {
  name: string;
  document: string;
  stateRegistration: string;
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
    console.log('CompanyContext: Checking for company data in database');
    
    if (companySettingsData && companySettingsData.length > 0) {
      console.log('CompanyContext: Found company settings in database:', companySettingsData);
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
      console.log('CompanyContext: Mapped company info from database:', mappedInfo);
      setCompanyInfoState(mappedInfo);
    } else {
      console.log('CompanyContext: No company settings found in database');
    }
  }, [companySettingsData]);

  const saveCompanyInfo = useCallback(async (info: CompanyInfo, showToast: boolean = true) => {
    try {
      console.log('Saving company info to database:', info);
      
      // Map data for Supabase
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
      
      // Check if we have a record to update
      const { data: existingData } = await supabase
        .from('company_settings')
        .select('id')
        .limit(1);
      
      if (existingData && existingData.length > 0) {
        // Update existing record
        const settingsId = existingData[0].id;
        console.log('Updating existing company settings with ID:', settingsId);
        const { error } = await supabase
          .from('company_settings')
          .update(mappedData)
          .eq('id', settingsId);
          
        if (error) {
          console.error('Error updating company settings:', error);
          throw error;
        }
      } else {
        // Create new record
        console.log('Creating new company settings record');
        const dataWithCreatedAt = {
          ...mappedData,
          created_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('company_settings')
          .insert(dataWithCreatedAt);
          
        if (error) {
          console.error('Error creating company settings:', error);
          throw error;
        }
      }
      
      await fetchData();
      setCompanyInfoState(info);
      
      if (showToast) {
        toast.success('Dados da empresa salvos com sucesso!');
      }
    } catch (error) {
      console.error('Error saving company info:', error);
      if (showToast) {
        toast.error('Erro ao salvar informações da empresa');
      }
    }
  }, [fetchData]);

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
