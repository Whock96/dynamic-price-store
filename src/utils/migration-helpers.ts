
import { Customer, Product, Category } from '@/types/types';
import { supabase, Tables } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Helper function to migrate customers from local state to Supabase
export const migrateCustomersToSupabase = async (customers: Customer[]): Promise<boolean> => {
  try {
    console.log(`Starting migration of ${customers.length} customers to Supabase...`);
    
    let successCount = 0;
    
    for (const customer of customers) {
      // Convert customer to Supabase format
      const supabaseCustomer = {
        id: customer.id,
        company_name: customer.companyName,
        document: customer.document,
        sales_person_id: customer.salesPersonId,
        street: customer.street,
        number: customer.number,
        no_number: customer.noNumber,
        complement: customer.complement || '',
        city: customer.city,
        state: customer.state,
        zip_code: customer.zipCode,
        phone: customer.phone || '',
        email: customer.email || '',
        default_discount: customer.defaultDiscount || 0,
        max_discount: customer.maxDiscount || 0
      };
      
      // Try to insert, if it fails with duplicate key, update instead
      const { error: insertError } = await supabase
        .from('customers')
        .upsert(supabaseCustomer, {
          onConflict: 'id',
          ignoreDuplicates: false
        });
      
      if (insertError) {
        console.error(`Error migrating customer ${customer.id}:`, insertError);
      } else {
        successCount++;
      }
    }
    
    console.log(`Successfully migrated ${successCount}/${customers.length} customers`);
    return successCount > 0;
  } catch (error) {
    console.error('Error in customer migration:', error);
    return false;
  }
};

// Helper function to migrate categories from local state to Supabase
export const migrateCategoriesToSupabase = async (categories: Category[]): Promise<boolean> => {
  try {
    console.log(`Starting migration of ${categories.length} categories to Supabase...`);
    
    let successCount = 0;
    
    for (const category of categories) {
      // Convert category to Supabase format
      const supabaseCategory = {
        id: category.id,
        name: category.name,
        description: category.description || null
      };
      
      // Try to insert, if it fails with duplicate key, update instead
      const { error: insertError } = await supabase
        .from('categories')
        .upsert(supabaseCategory, {
          onConflict: 'id',
          ignoreDuplicates: false
        });
      
      if (insertError) {
        console.error(`Error migrating category ${category.id}:`, insertError);
      } else {
        successCount++;
      }
      
      // If the category has subcategories, migrate them as well
      if (category.subcategories && category.subcategories.length > 0) {
        for (const subcategory of category.subcategories) {
          const supabaseSubcategory = {
            id: subcategory.id,
            name: subcategory.name,
            description: subcategory.description || null,
            category_id: category.id
          };
          
          const { error: subcatError } = await supabase
            .from('subcategories')
            .upsert(supabaseSubcategory, {
              onConflict: 'id',
              ignoreDuplicates: false
            });
          
          if (subcatError) {
            console.error(`Error migrating subcategory ${subcategory.id}:`, subcatError);
          }
        }
      }
    }
    
    console.log(`Successfully migrated ${successCount}/${categories.length} categories`);
    return successCount > 0;
  } catch (error) {
    console.error('Error in category migration:', error);
    return false;
  }
};

// Helper function to migrate products from local state to Supabase
export const migrateProductsToSupabase = async (products: Product[]): Promise<boolean> => {
  try {
    console.log(`Starting migration of ${products.length} products to Supabase...`);
    
    let successCount = 0;
    
    for (const product of products) {
      // Convert product to Supabase format
      const supabaseProduct = {
        id: product.id,
        name: product.name,
        description: product.description || null,
        list_price: product.price,
        weight: product.weight || 0,
        quantity: product.quantity || 0,
        quantity_per_volume: product.quantityPerVolume || 1,
        width: product.dimensions?.width || 0,
        height: product.dimensions?.height || 0,
        length: product.dimensions?.length || 0,
        cubic_volume: product.dimensions?.cubicVolume || 0,
        category_id: product.categoryId || null,
        subcategory_id: product.subcategoryId || null,
        image_url: product.imageUrl || 'https://via.placeholder.com/150',
        mva: product.mva || 39
      };
      
      // Try to insert, if it fails with duplicate key, update instead
      const { error: insertError } = await supabase
        .from('products')
        .upsert(supabaseProduct, {
          onConflict: 'id',
          ignoreDuplicates: false
        });
      
      if (insertError) {
        console.error(`Error migrating product ${product.id}:`, insertError);
      } else {
        successCount++;
      }
    }
    
    console.log(`Successfully migrated ${successCount}/${products.length} products`);
    return successCount > 0;
  } catch (error) {
    console.error('Error in product migration:', error);
    return false;
  }
};
