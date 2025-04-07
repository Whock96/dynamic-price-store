import { Customer, Product, Category, Subcategory } from '@/types/types';
import { supabase } from '@/integrations/supabase/client';
import { useCustomers } from '@/context/CustomerContext';
import { useProducts } from '@/context/ProductContext';
import { toast } from 'sonner';

// Função para migrar dados de clientes do localStorage para o Supabase
export const migrateCustomersToSupabase = async (customers: Customer[]) => {
  if (!customers || customers.length === 0) return;
  
  try {
    // Converter o formato do cliente para o formato do Supabase
    const supabaseCustomers = customers.map(customer => ({
      id: customer.id,
      company_name: customer.companyName,
      document: customer.document,
      sales_person_id: customer.salesPersonId || 'default-salesperson-id', // Ensure we always have a value
      street: customer.street,
      number: customer.number,
      no_number: customer.noNumber,
      complement: customer.complement,
      city: customer.city,
      state: customer.state,
      zip_code: customer.zipCode,
      phone: customer.phone,
      email: customer.email,
      whatsapp: customer.whatsapp || '', // Ensure whatsapp has a default value
      default_discount: customer.defaultDiscount,
      max_discount: customer.maxDiscount,
      created_at: customer.createdAt.toISOString(),
      updated_at: customer.updatedAt.toISOString(),
      register_date: customer.registerDate 
        ? customer.registerDate.toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0], // Ensure register_date has a default value
    }));
    
    // Verifique se já existem registros com os mesmos IDs
    for (const customer of supabaseCustomers) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('id', customer.id)
        .single();
      
      if (existingCustomer) {
        // O cliente já existe, então atualize-o
        const { error: updateError } = await supabase
          .from('customers')
          .update(customer)
          .eq('id', customer.id);
        
        if (updateError) throw updateError;
      } else {
        // O cliente não existe, então insira-o
        const { error: insertError } = await supabase
          .from('customers')
          .insert(customer);
        
        if (insertError) throw insertError;
      }
    }
    
    toast.success(`${supabaseCustomers.length} clientes migrados para o Supabase`);
    return true;
  } catch (error) {
    console.error('Erro ao migrar clientes para o Supabase:', error);
    toast.error('Erro ao migrar clientes para o Supabase');
    return false;
  }
};

// Função para migrar categorias e subcategorias do localStorage para o Supabase
export const migrateCategoriesToSupabase = async (categories: Category[]) => {
  if (!categories || categories.length === 0) return;
  
  try {
    // Categorias
    for (const category of categories) {
      const categoryData = {
        id: category.id,
        name: category.name,
        description: category.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Verificar se a categoria já existe
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('id', category.id)
        .single();
      
      if (existingCategory) {
        // A categoria já existe, então atualize-a
        const { error: updateError } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', category.id);
        
        if (updateError) throw updateError;
      } else {
        // A categoria não existe, então insira-a
        const { error: insertError } = await supabase
          .from('categories')
          .insert(categoryData);
        
        if (insertError) throw insertError;
      }
      
      // Subcategorias
      for (const subcategory of category.subcategories) {
        const subcategoryData = {
          id: subcategory.id,
          name: subcategory.name,
          description: subcategory.description,
          category_id: category.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        // Verificar se a subcategoria já existe
        const { data: existingSubcategory } = await supabase
          .from('subcategories')
          .select('id')
          .eq('id', subcategory.id)
          .single();
        
        if (existingSubcategory) {
          // A subcategoria já existe, então atualize-a
          const { error: updateError } = await supabase
            .from('subcategories')
            .update(subcategoryData)
            .eq('id', subcategory.id);
          
          if (updateError) throw updateError;
        } else {
          // A subcategoria não existe, então insira-a
          const { error: insertError } = await supabase
            .from('subcategories')
            .insert(subcategoryData);
          
          if (insertError) throw insertError;
        }
      }
    }
    
    toast.success(`${categories.length} categorias migradas para o Supabase`);
    return true;
  } catch (error) {
    console.error('Erro ao migrar categorias para o Supabase:', error);
    toast.error('Erro ao migrar categorias para o Supabase');
    return false;
  }
};

// Função para migrar produtos do localStorage para o Supabase
export const migrateProductsToSupabase = async (products: Product[]) => {
  if (!products || products.length === 0) return;
  
  try {
    // Converter o formato do produto para o formato do Supabase
    const supabaseProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      list_price: product.listPrice,
      weight: product.weight,
      quantity: product.quantity,
      quantity_per_volume: product.quantityPerVolume,
      width: product.dimensions.width,
      height: product.dimensions.height,
      length: product.dimensions.length,
      cubic_volume: product.cubicVolume,
      category_id: product.categoryId,
      subcategory_id: product.subcategoryId,
      image_url: product.imageUrl,
      created_at: product.createdAt.toISOString(),
      updated_at: product.updatedAt.toISOString(),
    }));
    
    // Verificar se já existem produtos com os mesmos IDs
    for (const product of supabaseProducts) {
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('id', product.id)
        .single();
      
      if (existingProduct) {
        // O produto já existe, então atualize-o
        const { error: updateError } = await supabase
          .from('products')
          .update(product)
          .eq('id', product.id);
        
        if (updateError) throw updateError;
      } else {
        // O produto não existe, então insira-o
        const { error: insertError } = await supabase
          .from('products')
          .insert(product);
        
        if (insertError) throw insertError;
      }
    }
    
    toast.success(`${supabaseProducts.length} produtos migrados para o Supabase`);
    return true;
  } catch (error) {
    console.error('Erro ao migrar produtos para o Supabase:', error);
    toast.error('Erro ao migrar produtos para o Supabase');
    return false;
  }
};

// Componente para migrar todos os dados para o Supabase
export const MigrateAllData = () => {
  // Make sure we're properly accessing the context with useProducts()
  const { customers } = useCustomers();
  const { products, categories } = useProducts();
  
  const handleMigrateAll = async () => {
    toast.info('Iniciando migração de dados para o Supabase...');
    
    // Migrar categorias primeiro (já que os produtos dependem delas)
    const categoriesMigrated = await migrateCategoriesToSupabase(categories);
    
    // Se as categorias foram migradas com sucesso, migre os produtos
    if (categoriesMigrated) {
      const productsMigrated = await migrateProductsToSupabase(products);
    }
    
    // Migrar clientes
    const customersMigrated = await migrateCustomersToSupabase(customers);
    
    if (categoriesMigrated && customersMigrated) {
      toast.success('Todos os dados foram migrados com sucesso para o Supabase!');
    }
  };
  
  return { handleMigrateAll };
};
