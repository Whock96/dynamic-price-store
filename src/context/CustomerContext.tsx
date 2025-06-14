import React, { createContext, useContext, useState, useCallback } from 'react';
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
  neighborhood: supabaseCustomer.neighborhood || '',
  city: supabaseCustomer.city,
  state: supabaseCustomer.state,
  zipCode: supabaseCustomer.zip_code,
  phone: supabaseCustomer.phone || '',
  email: supabaseCustomer.email || '',
  whatsapp: supabaseCustomer.whatsapp || '',
  stateRegistration: supabaseCustomer.state_registration || '',
  defaultDiscount: Number(supabaseCustomer.default_discount),
  maxDiscount: Number(supabaseCustomer.max_discount),
  createdAt: new Date(supabaseCustomer.created_at),
  updatedAt: new Date(supabaseCustomer.updated_at),
  registerDate: new Date(supabaseCustomer.register_date),
  transportCompanyId: supabaseCustomer.transport_company_id || undefined,
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
  if ('neighborhood' in customer) result.neighborhood = customer.neighborhood;
  if ('city' in customer) result.city = customer.city;
  if ('state' in customer) result.state = customer.state;
  if ('zipCode' in customer) result.zip_code = customer.zipCode;
  if ('phone' in customer) result.phone = customer.phone;
  if ('email' in customer) result.email = customer.email;
  if ('whatsapp' in customer) result.whatsapp = customer.whatsapp;
  if ('stateRegistration' in customer) result.state_registration = customer.stateRegistration;
  if ('defaultDiscount' in customer) result.default_discount = customer.defaultDiscount;
  if ('maxDiscount' in customer) result.max_discount = customer.maxDiscount;
  if ('registerDate' in customer) result.register_date = customer.registerDate instanceof Date 
    ? customer.registerDate.toISOString().split('T')[0] 
    : customer.registerDate;
  
  if ('transportCompanyId' in customer) {
    result.transport_company_id = customer.transportCompanyId === 'none' || customer.transportCompanyId === undefined 
      ? null 
      : customer.transportCompanyId;
    console.log('Setting transport_company_id in Supabase to:', result.transport_company_id);
  }
  
  return result;
};

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [localCustomers, setLocalCustomers] = useState<Customer[]>([]);

  const { 
    data: supabaseCustomers, 
    isLoading,
    createRecord,
    updateRecord,
    deleteRecord,
    getRecordById: getSupabaseCustomerById,
    fetchData: fetchSupabaseData
  } = useSupabaseData<SupabaseCustomer>('customers', {
    orderBy: { column: 'company_name', ascending: true }
  });

  const customers = React.useMemo(() => {
    return supabaseCustomers.map(supabaseToCustomer);
  }, [supabaseCustomers]);

  const refreshCustomers = useCallback(async () => {
    try {
      await fetchSupabaseData();
    } catch (error) {
      console.error('Error refreshing customers:', error);
    }
  }, [fetchSupabaseData]);

  const getCustomerById = useCallback((id: string) => {
    return customers.find(customer => customer.id === id);
  }, [customers]);

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Adding customer with data:', customerData);
      
      if (!customerData.salesPersonId) {
        toast.error('Erro: Um vendedor deve ser selecionado');
        return null;
      }
      
      const supabaseData = customerToSupabase(customerData);
      
      supabaseData.sales_person_id = customerData.salesPersonId;
      
      console.log('Final Supabase data for insert:', supabaseData);
      
      const createdCustomer = await createRecord(supabaseData as any);
      
      if (createdCustomer) {
        console.log('Created customer record:', createdCustomer);
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
      console.log('Updating customer with data:', customerData);
      
      if ('salesPersonId' in customerData && !customerData.salesPersonId) {
        console.error('salesPersonId cannot be empty - this is a required field');
        toast.error('Erro: Um vendedor deve ser selecionado');
        return null;
      }
      
      const supabaseData = customerToSupabase(customerData);
      
      if (customerData.salesPersonId) {
        console.log('Setting sales_person_id to:', customerData.salesPersonId);
        supabaseData.sales_person_id = customerData.salesPersonId;
      }
      
      console.log('Transport company ID being saved:', customerData.transportCompanyId, 
                  'Transformed to:', supabaseData.transport_company_id);
      
      console.log('Final Supabase data for update:', supabaseData);
      
      const updatedCustomer = await updateRecord(id, supabaseData);
      
      if (updatedCustomer) {
        console.log('Updated customer record:', updatedCustomer);
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
