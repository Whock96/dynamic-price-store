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
        
        // Check if the current user is a salesperson and if this order belongs to them
        // Always convert to string for comparison to avoid type issues
        if (currentUser?.role === 'salesperson' && String(contextOrder.userId) !== String(currentUser.id)) {
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
      
      // Build the query to fetch the order
      let query = supabase
        .from('orders')
        .select(`
          *,
          customers(*)
        `)
        .eq('id', orderId);
      
      // If the user is a salesperson, ensure they can only see their own orders
      if (currentUser?.role === 'salesperson' && currentUser?.id) {
        console.log("useOrderData - Restricting order access for salesperson:", currentUser.id);
        query = query.eq('user_id', currentUser.id);
      }
      
      const { data: orderData, error: orderError } = await query.single();

      if (orderError) {
        if (orderError.code === 'PGRST116') {
          // This is the "no rows returned" error
          if (currentUser?.role === 'salesperson') {
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
      
      // Fetch user info separately and ensure we don't overwrite with default values
      let userName = null; // Initialize as null instead of default value
      
      if (orderData && orderData.user_id) {
        console.log("useOrderData - Checking user ID:", orderData.user_id);
        
        // First check if this is the current user's order
        if (currentUser && String(currentUser.id) === String(orderData.user_id)) {
          userName = currentUser.name;
          console.log("useOrderData - Using current user's name:", userName);
        } else {
          // If not the current user, fetch from the database
          const { data: userData } = await supabase
            .from('users')
            .select('name')
            .eq('id', orderData.user_id)
            .single();
            
          if (userData && userData.name) {
            userName = userData.name;
            console.log("useOrderData - Fetched user name from database:", userName);
          } else {
            console.log("useOrderData - Could not find user name for ID:", orderData.user_id);
            // Only use default if we truly couldn't find a name
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
      setOrder(processedOrder);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error(`Error fetching order ${orderId}:`, error);
      toast.error(error.message || 'Erro ao carregar pedido');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, getOrderById, currentUser]);

  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  return { order, isLoading, error, fetchOrderData };
}
