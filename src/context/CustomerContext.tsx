
import React, { createContext, useContext, useState } from 'react';
import { Customer } from '@/types/types';
import { useSupabaseData } from '@/hooks/use-supabase-data';
import { supabase, Tables } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define the type that maps to the Supabase table structure
type SupabaseCustomer = Tables<'customers'>;

interface CustomerContextType {
  customers: Customer[];
  isLoading: boolean;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  getCustomerById: (id: string) => Customer | undefined;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Customer | null>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<Customer | null>;
  deleteCustomer: (id: string) => Promise<boolean>;
  refreshCustomers: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

// Função para converter o formato Supabase para nosso modelo frontend
const supabaseToCustomer = (supabaseCustomer: SupabaseCustomer): Customer => ({
  id: supabaseCustomer.id,
  companyName: supabaseCustomer.company_name,
  document: supabaseCustomer.document,
  salesPersonId: supabaseCustomer.sales_person_id,
  street: supabaseCustomer.street,
  number: supabaseCustomer.number || '',
  noNumber: supabaseCustomer.no_number,
  complement: supabaseCustomer.complement || '',
  city: supabaseCustomer.city,
  state: supabaseCustomer.state,
  zipCode: supabaseCustomer.zip_code,
  phone: supabaseCustomer.phone || '',
  email: supabaseCustomer.email || '',
  defaultDiscount: Number(supabaseCustomer.default_discount),
  maxDiscount: Number(supabaseCustomer.max_discount),
  createdAt: new Date(supabaseCustomer.created_at),
  updatedAt: new Date(supabaseCustomer.updated_at),
});

// Função para converter nosso modelo frontend para o formato Supabase
const customerToSupabase = (customer: Partial<Customer>): Partial<SupabaseCustomer> => {
  const result: Partial<SupabaseCustomer> = {};
  
  if ('companyName' in customer) result.company_name = customer.companyName;
  if ('document' in customer) result.document = customer.document;
  if ('salesPersonId' in customer) result.sales_person_id = customer.salesPersonId;
  if ('street' in customer) result.street = customer.street;
  if ('number' in customer) result.number = customer.number;
  if ('noNumber' in customer) result.no_number = customer.noNumber;
  if ('complement' in customer) result.complement = customer.complement;
  if ('city' in customer) result.city = customer.city;
  if ('state' in customer) result.state = customer.state;
  if ('zipCode' in customer) result.zip_code = customer.zipCode;
  if ('phone' in customer) result.phone = customer.phone;
  if ('email' in customer) result.email = customer.email;
  if ('defaultDiscount' in customer) result.default_discount = customer.defaultDiscount;
  if ('maxDiscount' in customer) result.max_discount = customer.maxDiscount;
  
  return result;
};

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Removemos a lógica de verificação de localStorage vs Supabase
  // Agora sempre usamos Supabase
  const [localCustomers, setLocalCustomers] = useState<Customer[]>([]);

  // Use our custom hook for Supabase data
  const { 
    data: supabaseCustomers, 
    isLoading,
    createRecord,
    updateRecord,
    deleteRecord,
    getRecordById: getSupabaseCustomerById,
    fetchData: refreshData
  } = useSupabaseData<SupabaseCustomer>('customers', {
    orderBy: { column: 'company_name', ascending: true }
  });

  // Convert Supabase customers to our frontend model
  const customers = React.useMemo(() => {
    return supabaseCustomers.map(supabaseToCustomer);
  }, [supabaseCustomers]);

  const refreshCustomers = async () => {
    try {
      await refreshData();
    } catch (error) {
      console.error('Error refreshing customers:', error);
    }
  };

  const getCustomerById = (id: string) => {
    return customers.find(customer => customer.id === id);
  };

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Add to Supabase
      const supabaseData = customerToSupabase(customerData);
      const createdCustomer = await createRecord(supabaseData as any);
      
      if (createdCustomer) {
        await refreshCustomers();
        return supabaseToCustomer(createdCustomer);
      }
      return null;
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Erro ao adicionar cliente');
      return null;
    }
  };

  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
    try {
      // Update in Supabase
      const supabaseData = customerToSupabase(customerData);
      const updatedCustomer = await updateRecord(id, supabaseData);
      
      if (updatedCustomer) {
        await refreshCustomers();
        return supabaseToCustomer(updatedCustomer);
      }
      return null;
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Erro ao atualizar cliente');
      return null;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      // Delete from Supabase
      const result = await deleteRecord(id);
      if (result) {
        await refreshCustomers();
      }
      return result;
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Erro ao excluir cliente');
      return false;
    }
  };

  return (
    <CustomerContext.Provider value={{ 
      customers, 
      isLoading,
      setCustomers: setLocalCustomers, 
      getCustomerById, 
      addCustomer, 
      updateCustomer,
      deleteCustomer,
      refreshCustomers
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
