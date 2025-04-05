
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrders } from '@/context/OrderContext';
import { supabaseOrderToAppOrder } from '@/utils/adapters';
import { Order } from '@/types/types';

/**
 * Custom hook to fetch order data directly from Supabase
 * Useful as a fallback when OrderContext might not have the data yet
 */
export function useOrderData(orderId: string | undefined) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { getOrderById } = useOrders();

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
        setOrder(contextOrder);
        setIsLoading(false);
        return;
      }

      console.log("Order not found in context, fetching from Supabase");
      
      // If not found in context, fetch directly from Supabase
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          customers(*)
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

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
      
      // Fetch user info separately
      let userName = 'Usuário do Sistema';
      if (orderData && orderData.user_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', orderData.user_id)
          .single();
          
        if (userData && userData.name) {
          userName = userData.name;
        }
      }
      
      // Use adapter to convert Supabase order to app Order
      const processedOrder = supabaseOrderToAppOrder(orderData, itemsData || [], discounts);
      
      // Add salesperson name if available
      processedOrder.user = {
        ...processedOrder.user,
        name: userName
      };
      
      console.log("Fetched order from Supabase:", processedOrder);
      setOrder(processedOrder);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error(`Error fetching order ${orderId}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [orderId, getOrderById]);

  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  return { order, isLoading, error, fetchOrderData };
}
