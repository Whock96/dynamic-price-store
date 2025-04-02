import React, { createContext, useContext, useState, useEffect } from 'react';
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
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'ferplas_customers';

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
  const [useLocalStorage, setUseLocalStorage] = useState(true);
  const [localCustomers, setLocalCustomers] = useState<Customer[]>(() => {
    try {
      const storedCustomers = localStorage.getItem(LOCAL_STORAGE_KEY);
      
      if (storedCustomers) {
        const parsedData = JSON.parse(storedCustomers) as Customer[];
        return parsedData.map(customer => ({
          ...customer,
          createdAt: new Date(customer.createdAt),
          updatedAt: new Date(customer.updatedAt)
        }));
      }

      return [];
    } catch (error) {
      console.error("Error loading customers from localStorage:", error);
      return [];
    }
  });

  // Use our custom hook for Supabase data
  const { 
    data: supabaseCustomers, 
    isLoading,
    createRecord,
    updateRecord,
    deleteRecord,
    getRecordById: getSupabaseCustomerById
  } = useSupabaseData<SupabaseCustomer>('customers', {
    orderBy: { column: 'company_name', ascending: true }
  });

  // Convert Supabase customers to our frontend model
  const customers = React.useMemo(() => {
    // If we're using localStorage, return the local customers
    if (useLocalStorage) {
      return localCustomers;
    }

    // Otherwise, convert Supabase customers to our model
    return supabaseCustomers.map(supabaseToCustomer);
  }, [useLocalStorage, localCustomers, supabaseCustomers]);

  // Save local customers to localStorage whenever they change
  useEffect(() => {
    if (useLocalStorage) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localCustomers));
      } catch (error) {
        console.error("Error saving customers to localStorage:", error);
      }
    }
  }, [localCustomers, useLocalStorage]);

  // Check if we should switch to using Supabase
  useEffect(() => {
    const checkSupabase = async () => {
      try {
        const { count } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });
        
        // If there are records in Supabase, switch to using it
        if (count && count > 0) {
          setUseLocalStorage(false);
          console.log('Using Supabase for customers data');
        } else {
          console.log('Using localStorage for customers data');
        }
      } catch (error) {
        console.error('Error checking Supabase customers:', error);
      }
    };

    checkSupabase();
  }, []);

  const getCustomerById = (id: string) => {
    return customers.find(customer => customer.id === id);
  };

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (useLocalStorage) {
        // Add to localStorage
        const newCustomer: Customer = {
          ...customerData,
          id: `customer-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        setLocalCustomers(prev => [...prev, newCustomer]);
        return newCustomer;
      } else {
        // Add to Supabase
        const supabaseData = customerToSupabase(customerData);
        const createdCustomer = await createRecord(supabaseData as any);
        return createdCustomer ? supabaseToCustomer(createdCustomer) : null;
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Erro ao adicionar cliente');
      return null;
    }
  };

  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
    try {
      if (useLocalStorage) {
        // Update in localStorage
        setLocalCustomers(prev => 
          prev.map(customer => 
            customer.id === id 
              ? { ...customer, ...customerData, updatedAt: new Date() } 
              : customer
          )
        );
        
        return getCustomerById(id) || null;
      } else {
        // Update in Supabase
        const supabaseData = customerToSupabase(customerData);
        const updatedCustomer = await updateRecord(id, supabaseData);
        return updatedCustomer ? supabaseToCustomer(updatedCustomer) : null;
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Erro ao atualizar cliente');
      return null;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      if (useLocalStorage) {
        // Delete from localStorage
        setLocalCustomers(prev => prev.filter(customer => customer.id !== id));
        return true;
      } else {
        // Delete from Supabase
        return await deleteRecord(id);
      }
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
