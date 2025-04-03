
import { supabase, Tables } from '@/integrations/supabase/client';
import { Product, Category, Customer } from '@/types/types';

// Helper function to map local product data to Supabase schema
export const mapProductToSupabase = (product: Product): Partial<Tables<'products'>> => {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    list_price: product.listPrice, // changed from price to listPrice
    weight: product.weight,
    quantity: product.quantity,
    quantity_per_volume: product.quantityPerVolume,
    width: product.dimensions.width,
    height: product.dimensions.height,
    length: product.dimensions.length,
    cubic_volume: product.cubicVolume, // changed from dimensions.cubicVolume to cubicVolume
    category_id: product.categoryId,
    subcategory_id: product.subcategoryId,
    image_url: product.imageUrl,
    mva: product.mva,
  };
};

// Export your other helper functions here
export const migrateProductsToSupabase = async (products: Product[]): Promise<boolean> => {
  try {
    console.log(`Migrando ${products.length} produtos para o Supabase`);
    
    for (const product of products) {
      const mappedProduct = mapProductToSupabase(product);
      
      // Ensure name is present since it's required in the database schema
      if (!mappedProduct.name) {
        console.error(`Produto ${product.id} não possui nome definido`);
        return false;
      }
      
      const { error } = await supabase
        .from('products')
        .upsert(mappedProduct as any, { 
          onConflict: 'id',
          ignoreDuplicates: false,
        });
      
      if (error) {
        console.error(`Erro ao migrar produto ${product.id}:`, error);
        return false;
      }
    }
    
    console.log('Todos os produtos foram migrados com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro durante a migração de produtos:', error);
    return false;
  }
};

// Add stubs for the other migration functions that might be referenced
export const migrateCategoriesToSupabase = async (categories: Category[]): Promise<boolean> => {
  // Implementation would go here
  return true;
};

export const migrateCustomersToSupabase = async (customers: Customer[]): Promise<boolean> => {
  // Implementation would go here
  return true;
};
