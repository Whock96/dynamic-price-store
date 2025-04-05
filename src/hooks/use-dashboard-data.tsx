
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSalespersonFilter } from './use-salesperson-filter';
import { toast } from 'sonner';

export function useDashboardData() {
  const { isSalespersonType, userId, applyUserFilter, applySalesPersonFilter } = useSalespersonFilter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dashboardData, setDashboardData] = useState({
    totalSales: 0,
    customerCount: 0,
    orderCount: 0,
    productCount: 0,
    recentOrders: [] as any[]
  });

  useEffect(() => {
    let isMounted = true; // Track if component is mounted
    
    const fetchDashboardData = async () => {
      if (!isMounted) return; // Skip if component is unmounted
      
      setIsLoading(true);
      setError(null); // Reset error state
      
      try {
        console.log("useDashboardData - Fetching data for user:", userId);
        console.log("useDashboardData - Is specific salesperson type:", isSalespersonType);

        // Get customer count with filtering for specific salesperson type
        let customerQuery = supabase.from('customers').select('*', { count: 'exact', head: true });
        
        // Only apply filter if user is specific salesperson type
        if (isSalespersonType && userId) {
          console.log("useDashboardData - Applying sales_person_id filter for customers:", userId);
          customerQuery = customerQuery.eq('sales_person_id', userId);
        } else {
          console.log("useDashboardData - Not applying filter for customers, showing all");
        }
        
        const { count: customerCount, error: customerError } = await customerQuery;
        
        if (customerError) throw customerError;

        // Get order count and total sales with filtering
        let ordersQuery = supabase.from('orders').select('*');
        
        // Only apply filter if user is specific salesperson type
        if (isSalespersonType && userId) {
          console.log("useDashboardData - Applying user_id filter for orders:", userId);
          ordersQuery = ordersQuery.eq('user_id', userId);
        } else {
          console.log("useDashboardData - Not applying filter for orders, showing all");
        }
        
        const { data: orders, error: ordersError } = await ordersQuery;
        
        if (ordersError) throw ordersError;
        
        const totalSales = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
        const orderCount = orders?.length || 0;
        
        // Get product count - no need to filter products by salesperson
        const { count: productCount, error: productError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });
          
        if (productError) throw productError;

        // Get recent orders with customer info
        let recentOrdersQuery = supabase
          .from('orders')
          .select(`
            id, 
            order_number,
            total,
            created_at,
            status,
            customers:customer_id (company_name)
          `)
          .order('created_at', { ascending: false })
          .limit(3);
          
        // Only apply filter if user is specific salesperson type
        if (isSalespersonType && userId) {
          console.log("useDashboardData - Applying user_id filter for recent orders:", userId);
          recentOrdersQuery = recentOrdersQuery.eq('user_id', userId);
        } else {
          console.log("useDashboardData - Not applying filter for recent orders, showing all");
        }
        
        const { data: recentOrders, error: recentOrdersError } = await recentOrdersQuery;
        
        if (recentOrdersError) throw recentOrdersError;

        console.log("useDashboardData - Data fetched successfully:", {
          customerCount,
          orderCount,
          totalSales,
          recentOrdersCount: recentOrders?.length || 0
        });

        if (isMounted) {
          setDashboardData({
            totalSales,
            customerCount: customerCount || 0,
            orderCount,
            productCount: productCount || 0,
            recentOrders: recentOrders || []
          });
          setError(null);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        if (isMounted) {
          setError(error as Error);
          // Only show toast once, not on every render
          toast.error('Erro ao carregar dados do dashboard');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboardData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [isSalespersonType, userId]);

  return {
    isLoading,
    error,
    dashboardData
  };
}
