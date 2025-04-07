
import React, { createContext, useContext, useState } from 'react';

interface CompanyInfo {
  id?: string;
  name: string;
  document: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website?: string;
  stateRegistration?: string;
}

interface CompanyContextType {
  companyInfo: CompanyInfo;
  saveCompanyInfo?: (info: CompanyInfo) => Promise<CompanyInfo | null>;
  isLoading?: boolean;
}

const defaultCompanyInfo: CompanyInfo = {
  name: '',
  document: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  email: '',
};

const CompanyContext = createContext<CompanyContextType>({
  companyInfo: defaultCompanyInfo
});

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(defaultCompanyInfo);

  return (
    <CompanyContext.Provider value={{ companyInfo }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  return useContext(CompanyContext);
};

export type { CompanyInfo };
