
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

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
}

const initialCompanyInfo: CompanyInfo = {
  name: 'Ferplas Indústria e Comércio',
  document: '00.000.000/0000-00',
  stateRegistration: '000.000.000.000',
  address: 'Av. Principal, 1234',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '00000-000',
  phone: '(00) 0000-0000',
  email: 'contato@ferplas.com.br',
  website: 'www.ferplas.com.br'
};

const COMPANY_INFO_STORAGE_KEY = 'ferplas-company-info';

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companyInfo, setCompanyInfoState] = useState<CompanyInfo>(initialCompanyInfo);

  useEffect(() => {
    const savedCompanyInfo = localStorage.getItem(COMPANY_INFO_STORAGE_KEY);
    
    if (savedCompanyInfo) {
      try {
        const parsedInfo = JSON.parse(savedCompanyInfo);
        setCompanyInfoState(parsedInfo);
      } catch (error) {
        console.error('Error loading company info:', error);
      }
    }
  }, []);

  const saveCompanyInfo = (info: CompanyInfo) => {
    try {
      localStorage.setItem(COMPANY_INFO_STORAGE_KEY, JSON.stringify(info));
      setCompanyInfoState(info);
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
      saveCompanyInfo 
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
