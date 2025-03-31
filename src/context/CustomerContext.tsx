
import React, { createContext, useContext, useState } from 'react';
import { Customer } from '@/types/types';

// Initial mock data for customers - with fixed data instead of random
const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'customer-1',
    companyName: 'Cliente 1 Ltda.',
    document: '12345678901',
    salesPersonId: '1',
    street: 'Rua 1',
    number: '100',
    noNumber: false,
    complement: 'Sala 1',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01000-000',
    phone: '(11) 99999-1111',
    email: 'cliente1@example.com',
    defaultDiscount: 5,
    maxDiscount: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'customer-2',
    companyName: 'Cliente 2 Ltda.',
    document: '23456789012',
    salesPersonId: '2',
    street: 'Rua 2',
    number: '110',
    noNumber: false,
    complement: '',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zipCode: '20000-000',
    phone: '(21) 99999-2222',
    email: 'cliente2@example.com',
    defaultDiscount: 3,
    maxDiscount: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'customer-3',
    companyName: 'Cliente 3 Ltda.',
    document: '34567890123',
    salesPersonId: '3',
    street: 'Rua 3',
    number: '120',
    noNumber: false,
    complement: 'Sala 3',
    city: 'Belo Horizonte',
    state: 'MG',
    zipCode: '30000-000',
    phone: '(31) 99999-3333',
    email: 'cliente3@example.com',
    defaultDiscount: 2,
    maxDiscount: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'customer-4',
    companyName: 'Cliente 4 Ltda.',
    document: '45678901234',
    salesPersonId: '1',
    street: 'Rua 4',
    number: '130',
    noNumber: false,
    complement: '',
    city: 'Curitiba',
    state: 'PR',
    zipCode: '40000-000',
    phone: '(41) 99999-4444',
    email: 'cliente4@example.com',
    defaultDiscount: 4,
    maxDiscount: 14,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'customer-5',
    companyName: 'Cliente 5 Ltda.',
    document: '56789012345',
    salesPersonId: '2',
    street: 'Rua 5',
    number: '140',
    noNumber: false,
    complement: 'Sala 5',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01001-000',
    phone: '(11) 99999-5555',
    email: 'cliente5@example.com',
    defaultDiscount: 6,
    maxDiscount: 16,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'customer-6',
    companyName: 'Cliente 6 Ltda.',
    document: '67890123456',
    salesPersonId: '3',
    street: 'Rua 6',
    number: '150',
    noNumber: false,
    complement: '',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zipCode: '20001-000',
    phone: '(21) 99999-6666',
    email: 'cliente6@example.com',
    defaultDiscount: 7,
    maxDiscount: 17,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'customer-7',
    companyName: 'Cliente 7 Ltda.',
    document: '78901234567',
    salesPersonId: '1',
    street: 'Rua 7',
    number: '160',
    noNumber: false,
    complement: 'Sala 7',
    city: 'Belo Horizonte',
    state: 'MG',
    zipCode: '30001-000',
    phone: '(31) 99999-7777',
    email: 'cliente7@example.com',
    defaultDiscount: 8,
    maxDiscount: 18,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'customer-8',
    companyName: 'Cliente 8 Ltda.',
    document: '89012345678',
    salesPersonId: '2',
    street: 'Rua 8',
    number: '170',
    noNumber: false,
    complement: '',
    city: 'Curitiba',
    state: 'PR',
    zipCode: '40001-000',
    phone: '(41) 99999-8888',
    email: 'cliente8@example.com',
    defaultDiscount: 2,
    maxDiscount: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'customer-9',
    companyName: 'Cliente 9 Ltda.',
    document: '90123456789',
    salesPersonId: '3',
    street: 'Rua 9',
    number: '180',
    noNumber: false,
    complement: 'Sala 9',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01002-000',
    phone: '(11) 99999-9999',
    email: 'cliente9@example.com',
    defaultDiscount: 1,
    maxDiscount: 11,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'customer-10',
    companyName: 'Cliente 10 Ltda.',
    document: '01234567890',
    salesPersonId: '1',
    street: 'Rua 10',
    number: '190',
    noNumber: false,
    complement: '',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zipCode: '20002-000',
    phone: '(21) 99999-0000',
    email: 'cliente10@example.com',
    defaultDiscount: 3,
    maxDiscount: 13,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

interface CustomerContextType {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  getCustomerById: (id: string) => Customer | undefined;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);

  const getCustomerById = (id: string) => {
    return customers.find(customer => customer.id === id);
  };

  const addCustomer = (customer: Customer) => {
    setCustomers(prev => [...prev, customer]);
  };

  const updateCustomer = (id: string, customerData: Partial<Customer>) => {
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === id ? { ...customer, ...customerData, updatedAt: new Date() } : customer
      )
    );
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(customer => customer.id !== id));
  };

  return (
    <CustomerContext.Provider value={{ 
      customers, 
      setCustomers, 
      getCustomerById, 
      addCustomer, 
      updateCustomer,
      deleteCustomer
    }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomers = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
};
