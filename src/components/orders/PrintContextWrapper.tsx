
import React from 'react';
import { CompanyProvider } from '@/context/CompanyContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';
import { CompanyInfo } from '@/types/types';

interface PrintContextWrapperProps {
  children: React.ReactNode;
  companyInfo: CompanyInfo;
}

export const PrintContextWrapper: React.FC<PrintContextWrapperProps> = ({ 
  children,
  companyInfo 
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <CompanyProvider initialData={companyInfo}>
        {children}
      </CompanyProvider>
    </QueryClientProvider>
  );
};
