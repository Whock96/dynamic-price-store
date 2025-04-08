
import { Tables } from '@/integrations/supabase/client';

// Define the table names explicitly without recursive types
export type TableName = 
  | 'products' 
  | 'customers' 
  | 'orders' 
  | 'categories' 
  | 'company_settings' 
  | 'discount_options' 
  | 'order_discounts' 
  | 'order_items' 
  | 'subcategories'
  | 'users'
  | 'user_types'
  | 'permissions'
  | 'user_type_permissions'
  | 'transport_companies';

export type OrderByOption = {
  column: string;
  ascending: boolean;
};

export type FilterOption = {
  key: string;
  value: string | number;
};

export interface SupabaseDataOptions<T> {
  initialData?: T[];
  select?: string;
  orderBy?: OrderByOption;
  joinTable?: string;
  filterKey?: string;
  filterValue?: string | number;
  filters?: FilterOption[]; // Support for multiple filters
  isActive?: boolean;
  cacheTimeout?: number; // Time in ms to expire the cache
}
