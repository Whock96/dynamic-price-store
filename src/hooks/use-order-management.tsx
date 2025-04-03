
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/types/types';
import { toast } from 'sonner';
import { supabaseOrderToAppOrder } from '@/utils/adapters';

export function useOrderManagement() {
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrderById = useCallback(async (orderId: string): Promise<Order | null> => {
    console.log(`[useOrderManagement] Fetching order with ID: ${orderId} directly from Supabase`);
    setIsLoading(true);
    try {
      // Fetch the order with customer details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          customers(*)
        `)
        .eq('id', orderId)
        .single();
        
      if (orderError) {
        console.error(`[useOrderManagement] Error fetching order ${orderId}:`, orderError);
        throw orderError;
      }
      
      if (!orderData) {
        console.log(`[useOrderManagement] Order ${orderId} not found`);
        return null;
      }
      
      // Fetch order items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products(*)
        `)
        .eq('order_id', orderId);
        
      if (itemsError) {
        console.error(`[useOrderManagement] Error fetching items for order ${orderId}:`, itemsError);
        throw itemsError;
      }

      // Fetch discount options applied to this order
      const { data: discountData, error: discountError } = await supabase
        .from('order_discounts')
        .select('discount_id')
        .eq('order_id', orderId);
        
      if (discountError) {
        console.error(`[useOrderManagement] Error fetching discounts for order ${orderId}:`, discountError);
        throw discountError;
      }
        
      // Fetch full discount details if there are any applied discounts
      let discounts = [];
      if (discountData && discountData.length > 0) {
        const discountIds = discountData.map(d => d.discount_id);
        const { data: discountDetails, error: detailsError } = await supabase
          .from('discount_options')
          .select('*')
          .in('id', discountIds);
          
        if (detailsError) {
          console.error(`[useOrderManagement] Error fetching discount details for order ${orderId}:`, detailsError);
          throw detailsError;
        }
          
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
      
      // Use adapter to convert Supabase order to app Order
      const processedOrder = supabaseOrderToAppOrder(orderData, itemsData || [], discounts);
      
      // Make sure to include order_number from the database
      if (orderData.order_number) {
        processedOrder.orderNumber = orderData.order_number;
      }
      
      console.log(`[useOrderManagement] Successfully fetched order ${orderId}`);
      return processedOrder;
    } catch (error) {
      console.error(`[useOrderManagement] Error fetching order ${orderId}:`, error);
      toast.error('Erro ao carregar detalhes do pedido');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetchOrderById,
    isLoading
  };
}
