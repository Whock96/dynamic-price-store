
import { useAuth } from '@/context/AuthContext';

/**
 * Custom hook to check if a user is a specific salesperson type
 * and provide the current user ID for filtering
 */
export function useSalespersonFilter() {
  const { user } = useAuth();
  
  // Check if user is a specific salesperson type (by UUID)
  const isSalespersonType = user?.userTypeId === 'c5ee0433-3faf-46a4-a516-be7261bfe575';
  
  // Fallback check for role-based salesperson (for backward compatibility)
  const isSalesperson = user?.role === 'salesperson';
  
  // The ID to use for filtering, converted to string for consistency
  const userId = user?.id ? String(user.id) : null;
  
  // Function to apply filter to a Supabase query for user_id
  const applyUserFilter = (query: any) => {
    if (isSalespersonType && userId) {
      return query.eq('user_id', userId);
    }
    return query;
  };
  
  // Function to apply filter to a Supabase query for sales_person_id
  const applySalesPersonFilter = (query: any) => {
    if (isSalespersonType && userId) {
      return query.eq('sales_person_id', userId);
    }
    return query;
  };
  
  return {
    isSalespersonType,
    isSalesperson,
    userId,
    applyUserFilter,
    applySalesPersonFilter
  };
}
