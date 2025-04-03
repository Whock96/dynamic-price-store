
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/types/types';
import { toast } from 'sonner';
import { supabaseOrderToAppOrder } from '@/utils/adapters';

export function useOrderManagement() {
  const [isLoading, setIsLoading] = useState(false);
  
  /**
   * Fetch a specific order by ID directly from Supabase
   * Useful when having trouble with the orders context
   */
  const fetchOrderById = useCallback(async (orderId: string): Promise<Order | null> => {
    if (!orderId) return null;
    
    setIsLoading(true);
    try {
      console.log(`Direct fetch of order with ID: ${orderId}`);
      
      // Get the order with customer details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          customers(*)
        `)
        .eq('id', orderId)
        .single();
      
      if (orderError) throw orderError;
      if (!orderData) return null;
      
      console.log("Directly fetched order:", orderData);
      
      // Get order items with product details
      const { data: itemsData } = await supabase
        .from('order_items')
        .select(`
          *,
          products(*)
        `)
        .eq('order_id', orderId);
      
      // Get applied discounts
      const { data: discountData } = await supabase
        .from('order_discounts')
        .select('discount_id')
        .eq('order_id', orderId);
      
      // Get full discount details
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
      
      // Use adapter to convert the data
      const processedOrder = supabaseOrderToAppOrder(orderData, itemsData || [], discounts);
      
      // Ensure order number is included
      if (orderData.order_number) {
        processedOrder.orderNumber = orderData.order_number;
      }
      
      return processedOrder;
      
    } catch (error) {
      console.error('Error fetching order by ID:', error);
      toast.error('Erro ao carregar detalhes do pedido');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Fix an order that's showing as "not found" by refreshing it directly
   */
  const repairOrder = async (orderId: string): Promise<boolean> => {
    try {
      const order = await fetchOrderById(orderId);
      if (!order) {
        toast.error('Não foi possível reparar o pedido');
        return false;
      }
      
      toast.success('Pedido recuperado com sucesso');
      return true;
    } catch (error) {
      console.error('Error repairing order:', error);
      toast.error('Erro ao tentar reparar o pedido');
      return false;
    }
  };
  
  return {
    isLoading,
    fetchOrderById,
    repairOrder
  };
}
