
import React, { createContext, useContext, useState } from 'react';
import { Customer } from '@/types/types';

interface CustomerContextType {
  customers: Customer[];
  addCustomer?: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Customer | null>;
  updateCustomer?: (id: string, customer: Partial<Customer>) => Promise<Customer | null>;
  deleteCustomer?: (id: string) => Promise<boolean>;
  getCustomerById?: (id: string) => Customer | undefined;
  isLoading?: boolean;
}

const CustomerContext = createContext<CustomerContextType>({
  customers: []
});

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);

  return (
    <CustomerContext.Provider value={{ customers }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomers = () => {
  return useContext(CustomerContext);
};
