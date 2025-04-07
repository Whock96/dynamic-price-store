
import React, { createContext, useContext } from 'react';

interface CompanyContextType {
  companyInfo: {
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
  };
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const companyInfo = {
    name: 'Company Name',
    document: 'Document',
    stateRegistration: 'State Registration',
    address: 'Address',
    city: 'City',
    state: 'State',
    zipCode: 'Zip Code',
    phone: 'Phone',
    email: 'Email',
    website: 'Website',
  };

  return (
    <CompanyContext.Provider value={{ companyInfo }}>
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
