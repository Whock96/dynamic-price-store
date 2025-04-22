
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { isVendedor } from '@/utils/permissionUtils';

type DashboardData = {
  totalSales: number;
  customerCount: number;
  orderCount: number;
  productCount: number;
  recentOrders: any[];
};

export const useDashboardData = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalSales: 0,
    customerCount: 0,
    orderCount: 0,
    productCount: 0,
    recentOrders: []
  });

  // Check if user is a salesperson
  const isSalespersonType = user ? isVendedor(user.userTypeId) : false;

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('Fetching dashboard data. User is salesperson type:', isSalespersonType);
        console.log('Current user ID:', user?.id);
        
        // Get customer count with salesperson filter if needed
        let customerQuery = supabase.from('customers').select('*', { count: 'exact', head: true });
        
        if (isSalespersonType && user?.id) {
          console.log('Filtering customers for salesperson:', user.id);
          customerQuery = customerQuery.eq('sales_person_id', user.id);
        }
        
        const { count: customerCount, error: customerError } = await customerQuery;
        
        if (customerError) throw customerError;

        // Get orders with user filter if needed
        let ordersQuery = supabase.from('orders').select('*');
        
        if (isSalespersonType && user?.id) {
          console.log('Filtering orders for salesperson:', user.id);
          ordersQuery = ordersQuery.eq('user_id', user.id);
        }
        
        const { data: orders, error: ordersError } = await ordersQuery;
        
        if (ordersError) throw ordersError;
        
        const totalSales = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
        
        // Get product count (no filter needed as products are global)
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
          
        if (isSalespersonType && user?.id) {
          console.log('Filtering recent orders for salesperson:', user.id);
          recentOrdersQuery = recentOrdersQuery.eq('user_id', user.id);
        }
        
        const { data: recentOrders, error: recentOrdersError } = await recentOrdersQuery;
        
        if (recentOrdersError) throw recentOrdersError;

        setDashboardData({
          totalSales,
          customerCount: customerCount || 0,
          orderCount: orders?.length || 0,
          productCount: productCount || 0,
          recentOrders: recentOrders || []
        });
        
        console.log('Dashboard data loaded:', {
          totalSales,
          customerCount,
          orderCount: orders?.length,
          productCount,
          recentOrdersCount: recentOrders?.length
        });
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        setError(error.message || 'Houve um erro ao carregar os dados do dashboard. Por favor, tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, isSalespersonType]);

  // Format currency to BRL
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return {
    data: dashboardData,
    isLoading,
    error,
    formatCurrency,
    isSalespersonType
  };
};
