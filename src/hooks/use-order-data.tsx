
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrders } from '@/context/OrderContext';
import { supabaseOrderToAppOrder } from '@/utils/adapters';
import { Order } from '@/types/types';
import { useAuth } from '@/context/AuthContext';

/**
 * Custom hook to fetch order data directly from Supabase
 * Useful as a fallback when OrderContext might not have the data yet
 */
export function useOrderData(orderId: string | undefined) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { getOrderById } = useOrders();
  const { user: currentUser } = useAuth();
  
  const isSalespersonType = currentUser?.userTypeId === 'c5ee0433-3faf-46a4-a516-be7261bfe575';

  const fetchOrderData = useCallback(async () => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const contextOrder = getOrderById(orderId);
      if (contextOrder) {
        console.log("Found order in context:", contextOrder);
        
        if (isSalespersonType && currentUser?.id) {
          console.log("User is a specific salesperson type checking order permission");
          
          if (String(contextOrder.userId) !== String(currentUser.id)) {
            console.log("User is a specific salesperson type but this order belongs to another user");
            console.log(`Order user ID: ${contextOrder.userId} (${typeof contextOrder.userId}) vs Current user ID: ${currentUser.id} (${typeof currentUser.id})`);
            setError(new Error('Você não tem permissão para visualizar este pedido'));
            setOrder(null);
            setIsLoading(false);
            return;
          }
        }
        else if (currentUser?.role === 'salesperson' && String(contextOrder.userId) !== String(currentUser.id)) {
          console.log("User is a salesperson but this order belongs to another salesperson");
          console.log(`Order user ID: ${contextOrder.userId} (${typeof contextOrder.userId}) vs Current user ID: ${currentUser.id} (${typeof currentUser.id})`);
          setError(new Error('Você não tem permissão para visualizar este pedido'));
          setOrder(null);
          setIsLoading(false);
          return;
        }
        
        setOrder(contextOrder);
        setIsLoading(false);
        return;
      }

      console.log("Order not found in context, fetching from Supabase");
      
      // Make sure to include the explicit join with transport_companies
      let query = supabase
        .from('orders')
        .select(`
          *,
          customers(*),
          transport_companies(id, name)
        `)
        .eq('id', orderId);
      
      if (isSalespersonType && currentUser?.id) {
        const currentUserIdStr = String(currentUser.id);
        console.log("useOrderData - Restringindo acesso a pedidos para vendedor ESPECÍFICO:", currentUserIdStr);
        query = query.eq('user_id', currentUserIdStr);
      }
      else if (currentUser?.role === 'salesperson' && currentUser?.id) {
        const currentUserIdStr = String(currentUser.id);
        console.log("useOrderData - Restringindo acesso a pedidos para vendedor (role):", currentUserIdStr);
        query = query.eq('user_id', currentUserIdStr);
      }
      
      const { data: orderData, error: orderError } = await query.single();

      if (orderError) {
        if (orderError.code === 'PGRST116') {
          if (isSalespersonType || currentUser?.role === 'salesperson') {
            throw new Error('Você não tem permissão para visualizar este pedido');
          } else {
            throw new Error('Pedido não encontrado');
          }
        }
        throw orderError;
      }

      console.log("Raw order data from database:", orderData);
      
      if (orderData.transport_companies) {
        console.log("Transport company data from query:", orderData.transport_companies);
      } else {
        console.log("No transport company data in query result");
      }
      
      const { data: itemsData } = await supabase
        .from('order_items')
        .select(`
          *,
          products(*)
        `)
        .eq('order_id', orderId);
        
      const { data: discountData } = await supabase
        .from('order_discounts')
        .select('discount_id')
        .eq('order_id', orderId);
        
      let discounts = [];
      if (discountData && discountData.length > 0) {
        const discountIds = discountData.map(d => d.discount_id);
        const { data: discountDetails } = await supabase
          .from('discount_options')
          .select('*')
          .in('id', discountIds);
          
        if (discountDetails) {
          discounts = discountDetails.map(d => ({
            id: d.id,
            name: d.name,
            description: d.description || '',
            value: d.value,
            type: d.type as 'discount' | 'surcharge',
            isActive: d.is_active,
          }));
        }
      }
      
      let userName = null;
      
      if (orderData && orderData.user_id) {
        const orderUserIdStr = String(orderData.user_id);
        console.log("useOrderData - Verificando ID de usuário:", orderUserIdStr);
        
        if (currentUser && String(currentUser.id) === orderUserIdStr) {
          userName = currentUser.name;
          console.log("useOrderData - Usando nome do usuário atual:", userName);
        } else {
          const { data: userData } = await supabase
            .from('users')
            .select('name')
            .eq('id', orderData.user_id)
            .single();
            
          if (userData && userData.name) {
            userName = userData.name;
            console.log("useOrderData - Nome do usuário recuperado do BD:", userName);
          } else {
            console.log("useOrderData - Não foi possível encontrar nome de usuário para ID:", orderData.user_id);
            userName = 'Usuário do Sistema';
          }
        }
      }
      
      const processedOrder = supabaseOrderToAppOrder(orderData, itemsData || [], discounts);
      
      if (userName) {
        processedOrder.user = {
          ...processedOrder.user,
          name: userName
        };
      }
      
      console.log("useOrderData - Processed order with user:", processedOrder.user);
      console.log("useOrderData - Processed order transport company:", {
        id: processedOrder.transportCompanyId,
        name: processedOrder.transportCompanyName
      });
      
      setOrder(processedOrder);
      
      if (isSalespersonType && currentUser?.id) {
        const orderUserIdStr = String(orderData.user_id);
        const currentUserIdStr = String(currentUser.id);
        
        if (orderUserIdStr !== currentUserIdStr) {
          console.log(`useOrderData - BLOQUEANDO acesso: pedido pertence a ${orderUserIdStr}, não ao usuário atual ${currentUserIdStr}`);
          setError(new Error('Você não tem permissão para visualizar este pedido'));
          setOrder(null);
          setIsLoading(false);
          return;
        }
      }
      else if (currentUser?.role === 'salesperson' && currentUser?.id) {
        const orderUserIdStr = String(orderData.user_id);
        const currentUserIdStr = String(currentUser.id);
        
        if (orderUserIdStr !== currentUserIdStr) {
          console.log(`useOrderData - BLOQUEANDO acesso: pedido pertence a ${orderUserIdStr}, não ao usuário atual ${currentUserIdStr}`);
          setError(new Error('Você não tem permissão para visualizar este pedido'));
          setOrder(null);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error(`Error fetching order ${orderId}:`, error);
      toast.error(error.message || 'Erro ao carregar pedido');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, getOrderById, currentUser, isSalespersonType]);

  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  return { order, isLoading, error, fetchOrderData };
}
