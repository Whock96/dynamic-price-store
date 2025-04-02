
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
    listPrice: Number(supabaseProduct.list_price) || 0,
    weight: Number(supabaseProduct.weight) || 0,
    quantity: Number(supabaseProduct.quantity) || 0,
    quantityPerVolume: Number(supabaseProduct.quantity_per_volume) || 1,
    dimensions: {
      width: Number(supabaseProduct.width) || 0,
      height: Number(supabaseProduct.height) || 0,
      length: Number(supabaseProduct.length) || 0,
    },
    cubicVolume: Number(supabaseProduct.cubic_volume) || 0,
    categoryId: supabaseProduct.category_id || "",
    subcategoryId: supabaseProduct.subcategory_id || "",
    imageUrl: supabaseProduct.image_url || "",
    createdAt: new Date(supabaseProduct.created_at),
    updatedAt: new Date(supabaseProduct.updated_at),
  };
};
