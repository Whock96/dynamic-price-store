
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, CartItem } from '@/types/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { supabase, Tables } from '@/integrations/supabase/client';
import { supabaseOrderToAppOrder } from '@/utils/adapters';

// Define a type that maps database order to our frontend order type
type SupabaseOrder = Tables<'orders'>;

interface OrderContextType {
  orders: Order[];
  addOrder: (newOrder: Partial<Order>) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updateOrder: (orderId: string, orderData: Partial<Order>) => void;
  getOrderById: (id: string) => Order | undefined;
  clearAllOrders: () => void;
  deleteOrder: (orderId: string) => void;
  isLoading: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load orders from Supabase on initial render
  useEffect(() => {
    fetchOrders();
  }, []);
  
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      // Fetch orders with customer details
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          customers(*)
        `)
        .order('created_at', { ascending: false });
        
      if (ordersError) throw ordersError;
      
      if (!ordersData) {
        setOrders([]);
        return;
      }
      
      console.log("Fetched orders:", ordersData);
      
      // Process each order to fetch items and applied discounts
      const processedOrders = await Promise.all(ordersData.map(async (order) => {
        // Fetch order items with product details
        const { data: itemsData } = await supabase
          .from('order_items')
          .select(`
            *,
            products(*)
          `)
          .eq('order_id', order.id);
          
        console.log(`Fetched items for order ${order.id}:`, itemsData);
          
        // Fetch discount options applied to this order
        const { data: discountData } = await supabase
          .from('order_discounts')
          .select('discount_id')
          .eq('order_id', order.id);
          
        console.log(`Fetched discounts for order ${order.id}:`, discountData);
          
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
          
          console.log(`Processed discounts for order ${order.id}:`, discounts);
        }
        
        // Use adapter to convert Supabase order to app Order
        const processedOrder = supabaseOrderToAppOrder(order, itemsData || [], discounts);
        
        // Make sure to include order_number from the database
        if (order.order_number) {
          processedOrder.orderNumber = order.order_number;
        }
        
        return processedOrder;
      }));
      
      setOrders(processedOrders);
      console.log(`Loaded ${processedOrders.length} orders from Supabase`);
    } catch (error) {
      console.error('Error loading orders from Supabase:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all orders from state and database
  const clearAllOrders = async () => {
    try {
      // This is a dangerous operation and should have additional safeguards
      const { error } = await supabase.from('orders').delete().neq('id', 'placeholder');
      
      if (error) throw error;
      
      setOrders([]);
      toast.success('Todos os pedidos foram excluídos com sucesso!');
    } catch (error) {
      console.error('Error clearing orders:', error);
      toast.error('Erro ao excluir pedidos');
    }
  };

  // Delete a specific order by ID
  const deleteOrder = async (orderId: string) => {
    try {
      // Delete the order from Supabase
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      
      if (error) throw error;
      
      // Update local state if successful
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      toast.success(`Pedido excluído com sucesso!`);
    } catch (error) {
      console.error(`Error deleting order ${orderId}:`, error);
      toast.error('Erro ao excluir pedido');
    }
  };

  const addOrder = async (newOrder: Partial<Order>) => {
    if (!newOrder.customer) {
      toast.error('Cliente não selecionado');
      return;
    }
    
    try {
      // First, insert the order into Supabase
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: newOrder.customer.id,
          user_id: user?.id || 'anonymous',
          status: 'pending',
          shipping: newOrder.shipping || 'delivery',
          full_invoice: newOrder.fullInvoice !== undefined ? newOrder.fullInvoice : true,
          tax_substitution: newOrder.taxSubstitution || false,
          payment_method: newOrder.paymentMethod || 'cash',
          payment_terms: newOrder.paymentTerms,
          notes: newOrder.notes || '',
          observations: newOrder.observations || '',
          delivery_location: newOrder.deliveryLocation,
          half_invoice_percentage: newOrder.halfInvoicePercentage,
          delivery_fee: newOrder.deliveryFee || 0,
          subtotal: newOrder.subtotal || 0,
          total_discount: newOrder.totalDiscount || 0,
          total: newOrder.total || 0
        })
        .select()
        .single();
        
      if (orderError) throw orderError;
      if (!orderData) throw new Error('Erro ao criar pedido');
      
      // Now insert the order items
      if (newOrder.items && newOrder.items.length > 0) {
        const orderItems = newOrder.items.map(item => ({
          order_id: orderData.id,
          product_id: item.product.id,
          quantity: item.quantity,
          discount: item.discount || 0,
          final_price: item.finalPrice,
          subtotal: item.subtotal
        }));
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);
          
        if (itemsError) throw itemsError;
      }
      
      // Insert order discounts if any
      if (newOrder.appliedDiscounts && newOrder.appliedDiscounts.length > 0) {
        const orderDiscounts = newOrder.appliedDiscounts.map(discount => ({
          order_id: orderData.id,
          discount_id: discount.id
        }));
        
        const { error: discountsError } = await supabase
          .from('order_discounts')
          .insert(orderDiscounts);
          
        if (discountsError) throw discountsError;
      }
      
      // Refetch orders to get the complete order with all relationships
      await fetchOrders();
      
      toast.success(`Pedido #${orderData.order_number} criado com sucesso!`);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Erro ao criar pedido');
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      // Update the order status in Supabase
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status, updatedAt: new Date() }
            : order
        )
      );
      
      toast.success(`Status do pedido atualizado para ${status}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Erro ao atualizar status do pedido');
    }
  };
  
  const updateOrder = async (orderId: string, orderData: Partial<Order>) => {
    try {
      // Map frontend order data to Supabase schema
      const supabaseOrderData: Partial<SupabaseOrder> = {
        status: orderData.status,
        shipping: orderData.shipping,
        full_invoice: orderData.fullInvoice,
        tax_substitution: orderData.taxSubstitution,
        payment_method: orderData.paymentMethod,
        payment_terms: orderData.paymentTerms,
        notes: orderData.notes,
        observations: orderData.observations,
        delivery_location: orderData.deliveryLocation,
        half_invoice_percentage: orderData.halfInvoicePercentage,
        delivery_fee: orderData.deliveryFee,
        updated_at: new Date().toISOString()
      };
      
      // Update the order in Supabase
      const { error } = await supabase
        .from('orders')
        .update(supabaseOrderData)
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { 
                ...order, 
                ...orderData, 
                updatedAt: new Date(),
                shipping: orderData.shipping || order.shipping,
                paymentMethod: orderData.paymentMethod || order.paymentMethod,
                observations: orderData.notes || orderData.observations || order.observations || order.notes,
                withIPI: orderData.withIPI !== undefined ? orderData.withIPI : order.withIPI,
                ipiValue: orderData.ipiValue !== undefined ? orderData.ipiValue : order.ipiValue
              }
            : order
        )
      );
      
      toast.success(`Pedido atualizado com sucesso!`);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erro ao atualizar pedido');
    }
  };

  const getOrderById = (id: string) => {
    console.log(`Fetching order with ID: ${id}`);
    const foundOrder = orders.find(order => order.id === id);
    console.log(`Fetched order:`, foundOrder);
    
    if (!foundOrder) {
      console.error(`Order with ID ${id} not found`);
      return undefined;
    }
    
    return foundOrder;
  };

  return (
    <OrderContext.Provider value={{ 
      orders, 
      addOrder, 
      updateOrderStatus, 
      updateOrder, 
      getOrderById, 
      clearAllOrders,
      deleteOrder,
      isLoading
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
