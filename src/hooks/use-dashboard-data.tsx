
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSalespersonFilter } from './use-salesperson-filter';
import { toast } from 'sonner';

export function useDashboardData() {
  const { isSalespersonType, userId, applyUserFilter, applySalesPersonFilter } = useSalespersonFilter();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalSales: 0,
    customerCount: 0,
    orderCount: 0,
    productCount: 0,
    recentOrders: [] as any[]
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        console.log("useDashboardData - Fetching data for user:", userId);
        console.log("useDashboardData - Is specific salesperson type:", isSalespersonType);

        // Get customer count with filtering for specific salesperson type
        let customerQuery = supabase.from('customers').select('*', { count: 'exact', head: true });
        // Only apply filter if user is specific salesperson type
        customerQuery = applySalesPersonFilter(customerQuery);
        const { count: customerCount, error: customerError } = await customerQuery;
        
        if (customerError) throw customerError;

        // Get order count and total sales with filtering
        let ordersQuery = supabase.from('orders').select('*');
        // Only apply filter if user is specific salesperson type
        ordersQuery = applyUserFilter(ordersQuery);
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
        recentOrdersQuery = applyUserFilter(recentOrdersQuery);
        const { data: recentOrders, error: recentOrdersError } = await recentOrdersQuery;
        
        if (recentOrdersError) throw recentOrdersError;

        console.log("useDashboardData - Data fetched:", {
          customerCount,
          orderCount,
          totalSales,
          recentOrdersCount: recentOrders?.length || 0
        });

        setDashboardData({
          totalSales,
          customerCount: customerCount || 0,
          orderCount,
          productCount: productCount || 0,
          recentOrders: recentOrders || []
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Erro ao carregar dados do dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isSalespersonType, userId, applyUserFilter, applySalesPersonFilter]);

  return {
    isLoading,
    dashboardData
  };
}
