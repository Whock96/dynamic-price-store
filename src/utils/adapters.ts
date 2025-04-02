
import { Tables } from "@/integrations/supabase/client";
import { Product } from "@/types/types";

/**
 * Converts a Supabase product record to our application's Product interface
 */
export const supabaseProductToAppProduct = (supabaseProduct: Tables<'products'>): Product => {
  return {
    id: supabaseProduct.id,
    name: supabaseProduct.name,
    description: supabaseProduct.description || "",
    listPrice: supabaseProduct.list_price,
    weight: supabaseProduct.weight,
    quantity: supabaseProduct.quantity,
    quantityPerVolume: supabaseProduct.quantity_per_volume,
    dimensions: {
      width: supabaseProduct.width,
      height: supabaseProduct.height,
      length: supabaseProduct.length,
    },
    cubicVolume: supabaseProduct.cubic_volume,
    categoryId: supabaseProduct.category_id || "",
    subcategoryId: supabaseProduct.subcategory_id || "",
    imageUrl: supabaseProduct.image_url || "",
    createdAt: new Date(supabaseProduct.created_at),
    updatedAt: new Date(supabaseProduct.updated_at),
  };
};
