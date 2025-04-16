
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
  
  // Verificação para identificar se o usuário é do tipo vendedor específico
  const isSalespersonType = currentUser?.userTypeId === 'c5ee0433-3faf-46a4-a516-be7261bfe575';

  const fetchOrderData = useCallback(async () => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First try to get order from context
      const contextOrder = getOrderById(orderId);
      if (contextOrder) {
        console.log("Found order in context:", contextOrder);
        
        // Verificação específica para o tipo de vendedor com UUID c5ee0433-3faf-46a4-a516-be7261bfe575
        if (isSalespersonType && currentUser?.id) {
          console.log("User is a specific salesperson type checking order permission");
          
          // Always convert to string for comparison to avoid type issues
          if (String(contextOrder.userId) !== String(currentUser.id)) {
            console.log("User is a specific salesperson type but this order belongs to another user");
            console.log(`Order user ID: ${contextOrder.userId} (${typeof contextOrder.userId}) vs Current user ID: ${currentUser.id} (${typeof currentUser.id})`);
            setError(new Error('Você não tem permissão para visualizar este pedido'));
            setOrder(null);
            setIsLoading(false);
            return;
          }
        }
        // Verificação por role para compatibilidade
        else if (currentUser?.role === 'salesperson' && String(contextOrder.userId) !== String(currentUser.id)) {
          console.log("User is a salesperson but this order belongs to another salesperson");
          console.log(`Order user ID: ${contextOrder.userId} (${typeof contextOrder.userId}) vs Current user ID: ${currentUser.id} (${typeof currentUser.id})`);
          setError(new Error('Você não tem permissão para visualizar este pedido'));
          setOrder(null);
          setIsLoading(false);
          return;
        }
        
        // Make sure we don't lose the user name that's already in the order
        setOrder(contextOrder);
        setIsLoading(false);
        return;
      }

      console.log("Order not found in context, fetching from Supabase");
      
      // Garantir uso consistente de strings para IDs de usuário
      let query = supabase
        .from('orders')
        .select(`
          *,
          customers(*)
        `)
        .eq('id', orderId);
      
      // Verificação específica para o tipo de vendedor com UUID c5ee0433-3faf-46a4-a516-be7261bfe575
      if (isSalespersonType && currentUser?.id) {
        const currentUserIdStr = String(currentUser.id);
        console.log("useOrderData - Restringindo acesso a pedidos para vendedor ESPECÍFICO:", currentUserIdStr);
        query = query.eq('user_id', currentUserIdStr);
      }
      // Verificação por role para compatibilidade
      else if (currentUser?.role === 'salesperson' && currentUser?.id) {
        const currentUserIdStr = String(currentUser.id);
        console.log("useOrderData - Restringindo acesso a pedidos para vendedor (role):", currentUserIdStr);
        query = query.eq('user_id', currentUserIdStr);
      }
      
      const { data: orderData, error: orderError } = await query.single();

      if (orderError) {
        if (orderError.code === 'PGRST116') {
          // This is the "no rows returned" error
          if (isSalespersonType || currentUser?.role === 'salesperson') {
            throw new Error('Você não tem permissão para visualizar este pedido');
          } else {
            throw new Error('Pedido não encontrado');
          }
        }
        throw orderError;
      }

      // Fetch order items with product details
      const { data: itemsData } = await supabase
        .from('order_items')
        .select(`
          *,
          products(*)
        `)
        .eq('order_id', orderId);
        
      // Fetch discount options applied to this order
      const { data: discountData } = await supabase
        .from('order_discounts')
        .select('discount_id')
        .eq('order_id', orderId);
        
      // Fetch full discount details if there are any applied discounts
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
      
      // Melhorando a verificação do usuário
      let userName = null;
      
      if (orderData && orderData.user_id) {
        const orderUserIdStr = String(orderData.user_id);
        console.log("useOrderData - Verificando ID de usuário:", orderUserIdStr);
        
        // Comparando strings para evitar problemas de tipo
        if (currentUser && String(currentUser.id) === orderUserIdStr) {
          userName = currentUser.name;
          console.log("useOrderData - Usando nome do usuário atual:", userName);
        } else {
          // If not the current user, fetch from the database
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
      
      // Use adapter to convert Supabase order to app Order
      const processedOrder = supabaseOrderToAppOrder(orderData, itemsData || [], discounts);
      
      // Only set the user name if we actually found one
      if (userName) {
        processedOrder.user = {
          ...processedOrder.user,
          name: userName
        };
      }
      
      console.log("useOrderData - Processed order with user:", processedOrder.user);
      console.log("useOrderData - Processed order products_total:", orderData.products_total, "app productsTotal:", processedOrder.productsTotal);
      console.log("useOrderData - Processed order tax_substitution_total:", orderData.tax_substitution_total, "app taxSubstitutionTotal:", processedOrder.taxSubstitutionTotal);
      
      setOrder(processedOrder);
      
      // Verificação final
      // Verificação específica para o tipo de vendedor com UUID c5ee0433-3faf-46a4-a516-be7261bfe575
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
      // Verificação por role para compatibilidade
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
