
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardData {
  totalSales: number;
  customerCount: number;
  orderCount: number;
  productCount: number;
  recentOrders: any[];
}

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

  // Verifica se o usuário é do tipo vendedor específico
  const isSalesperson = user?.userTypeId === 'c5ee0433-3faf-46a4-a516-be7261bfe575';

  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log("Iniciando busca de dados do dashboard");
      console.log("Usuário logado:", user?.id, "Tipo:", user?.userTypeId);
      console.log("É vendedor específico?", isSalesperson);
      
      setIsLoading(true);
      setError(null);
      
      try {
        // 1. Get customer count
        let customerQuery = supabase.from('customers').select('*', { count: 'exact', head: true });
        
        // Se for vendedor, filtrar apenas clientes associados a ele
        if (isSalesperson && user?.id) {
          console.log("Filtrando clientes para vendedor:", user.id);
          customerQuery = customerQuery.eq('sales_person_id', user.id);
        }
        
        const { count: customerCount, error: customerError } = await customerQuery;
        
        if (customerError) {
          console.error("Erro ao buscar contagem de clientes:", customerError);
          throw customerError;
        }
        
        console.log("Contagem de clientes:", customerCount);

        // 2. Get order data
        let orderQuery = supabase.from('orders').select('*');
        
        // Se for vendedor, filtrar apenas pedidos associados a ele
        if (isSalesperson && user?.id) {
          console.log("Filtrando pedidos para vendedor:", user.id);
          orderQuery = orderQuery.eq('user_id', String(user.id));
        }
        
        const { data: orders, error: ordersError } = await orderQuery;
        
        if (ordersError) {
          console.error("Erro ao buscar pedidos:", ordersError);
          throw ordersError;
        }
        
        console.log("Total de pedidos encontrados:", orders?.length || 0);
        
        // Calcular valor total de vendas
        const totalSales = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
        console.log("Total de vendas calculado:", totalSales);
        
        // 3. Get product count (não é filtrado por vendedor, mostra total do sistema)
        const { count: productCount, error: productsError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });
          
        if (productsError) {
          console.error("Erro ao buscar contagem de produtos:", productsError);
          throw productsError;
        }
        
        console.log("Contagem de produtos:", productCount);

        // 4. Get recent orders with customer info
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
          
        // Se for vendedor, filtrar apenas pedidos recentes associados a ele
        if (isSalesperson && user?.id) {
          console.log("Filtrando pedidos recentes para vendedor:", user.id);
          recentOrdersQuery = recentOrdersQuery.eq('user_id', String(user.id));
        }
        
        const { data: recentOrders, error: recentOrdersError } = await recentOrdersQuery;
        
        if (recentOrdersError) {
          console.error("Erro ao buscar pedidos recentes:", recentOrdersError);
          throw recentOrdersError;
        }
        
        console.log("Pedidos recentes encontrados:", recentOrders?.length || 0);

        // Atualiza os dados do dashboard com as informações obtidas
        setDashboardData({
          totalSales,
          customerCount: customerCount || 0,
          orderCount: orders?.length || 0,
          productCount: productCount || 0,
          recentOrders: recentOrders || []
        });
        
        console.log("Dados do dashboard atualizados com sucesso");
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        setError('Houve um erro ao carregar os dados do dashboard. Por favor, tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    // Só busca os dados se houver um usuário logado
    if (user) {
      fetchDashboardData();
    }
  }, [user, isSalesperson]);

  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return { 
    dashboardData, 
    isLoading, 
    error, 
    formatCurrency,
    isSalesperson
  };
};
