import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, CartItem } from '@/types/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { supabase, Tables } from '@/integrations/supabase/client';
import { supabaseOrderToAppOrder } from '@/utils/adapters';

type SupabaseOrder = Tables<'orders'>;

interface OrderContextType {
  orders: Order[];
  addOrder: (newOrder: Partial<Order>) => Promise<string | undefined>;
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
  
  useEffect(() => {
    fetchOrders();
  }, []);
  
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
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
      
      console.log("OrderContext - Fetched orders data:", ordersData);
      
      const processedOrders = await Promise.all(ordersData.map(async (order) => {
        const { data: itemsData } = await supabase
          .from('order_items')
          .select(`
            *,
            products(*)
          `)
          .eq('order_id', order.id);
          
        const { data: discountData } = await supabase
          .from('order_discounts')
          .select('discount_id')
          .eq('order_id', order.id);
          
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
        if (order.user_id) {
          console.log("OrderContext - Checking user ID:", order.user_id);

          if (user && String(user.id) === String(order.user_id)) {
            userName = user.name;
            console.log("OrderContext - Using current user's name for order:", userName);
          } else {
            const { data: userData } = await supabase
              .from('users')
              .select('name')
              .eq('id', order.user_id)
              .single();
              
            if (userData && userData.name) {
              userName = userData.name;
              console.log("OrderContext - Fetched user name from DB for order:", userName);
            } else {
              console.log("OrderContext - Could not find user for order with user_id:", order.user_id);
              userName = 'Usuário do Sistema';
            }
          }
        } else {
          userName = 'Usuário do Sistema';
        }
        
        const processedOrder = supabaseOrderToAppOrder(order, itemsData || [], discounts);
        
        if (userName) {
          processedOrder.user = {
            ...processedOrder.user,
            name: userName
          };
        }
        
        console.log("OrderContext - Processed order with user:", processedOrder.user);
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

  const clearAllOrders = async () => {
    try {
      const { error } = await supabase.from('orders').delete().neq('id', 'placeholder');
      
      if (error) throw error;
      
      setOrders([]);
      toast.success('Todos os pedidos foram excluídos com sucesso!');
    } catch (error) {
      console.error('Error clearing orders:', error);
      toast.error('Erro ao excluir pedidos');
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      
      if (error) throw error;
      
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
      console.log("Adding new order:", newOrder);
      
      const userId = newOrder.userId || (user?.id || null);
      const userName = user?.name || 'Usuário do Sistema';
      console.log("Current user information:", user);
      console.log("Using user ID for order:", userId);
      
      const orderInsert = {
        customer_id: newOrder.customer.id,
        user_id: userId,
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
        total: newOrder.total || 0,
        with_ipi: newOrder.withIPI || false,
        ipi_value: newOrder.ipiValue || 0
      };
      
      console.log("Order data being inserted:", orderInsert);
      console.log("User ID being used for order:", userId);
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(orderInsert)
        .select()
        .single();
        
      if (orderError) {
        console.error("Order insert error:", orderError);
        throw orderError;
      }
      
      if (!orderData) {
        throw new Error('Erro ao criar pedido: No data returned');
      }
      
      console.log("Order created successfully:", orderData);
      
      if (newOrder.items && newOrder.items.length > 0) {
        const orderItems = newOrder.items.map(item => ({
          order_id: orderData.id,
          product_id: item.product.id,
          quantity: item.quantity,
          discount: item.discount || 0,
          final_price: item.finalPrice,
          subtotal: item.subtotal
        }));
        
        console.log("Inserting order items:", orderItems);
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);
          
        if (itemsError) {
          console.error("Order items insert error:", itemsError);
          throw itemsError;
        }
        
        console.log("Order items inserted successfully");
      }
      
      if (newOrder.appliedDiscounts && newOrder.appliedDiscounts.length > 0) {
        const orderDiscounts = newOrder.appliedDiscounts.map(discount => ({
          order_id: orderData.id,
          discount_id: discount.id
        }));
        
        console.log("Inserting order discounts:", orderDiscounts);
        
        const { error: discountsError } = await supabase
          .from('order_discounts')
          .insert(orderDiscounts);
          
        if (discountsError) {
          console.error("Order discounts insert error:", discountsError);
          throw discountsError;
        }
        
        console.log("Order discounts inserted successfully");
      }
      
      await fetchOrders();
      
      toast.success(`Pedido #${orderData.order_number} criado com sucesso!`);
      return orderData.id;
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error(`Erro ao criar pedido: ${error.message || 'Erro desconhecido'}`);
      return undefined;
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      console.log(`Updating order ${orderId} status to ${status}`);
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (error) {
        console.error("Order status update error:", error);
        throw error;
      }
      
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status, updatedAt: new Date() }
            : order
        )
      );
      
      toast.success(`Status do pedido atualizado para ${status}`);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error(`Erro ao atualizar status do pedido: ${error.message || 'Erro desconhecido'}`);
    }
  };
  
  const updateOrder = async (orderId: string, orderData: Partial<Order>) => {
    try {
      console.log(`Updating order ${orderId} with data:`, orderData);
      
      const supabaseOrderData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      
      if (orderData.status !== undefined) supabaseOrderData.status = orderData.status;
      if (orderData.shipping !== undefined) supabaseOrderData.shipping = orderData.shipping;
      if (orderData.fullInvoice !== undefined) supabaseOrderData.full_invoice = orderData.fullInvoice;
      if (orderData.taxSubstitution !== undefined) supabaseOrderData.tax_substitution = orderData.taxSubstitution;
      if (orderData.paymentMethod !== undefined) supabaseOrderData.payment_method = orderData.paymentMethod;
      if (orderData.paymentTerms !== undefined) supabaseOrderData.payment_terms = orderData.paymentTerms;
      if (orderData.notes !== undefined) supabaseOrderData.notes = orderData.notes;
      if (orderData.observations !== undefined) supabaseOrderData.observations = orderData.observations;
      if (orderData.deliveryLocation !== undefined) supabaseOrderData.delivery_location = orderData.deliveryLocation;
      if (orderData.halfInvoicePercentage !== undefined) supabaseOrderData.half_invoice_percentage = orderData.halfInvoicePercentage;
      if (orderData.deliveryFee !== undefined) supabaseOrderData.delivery_fee = orderData.deliveryFee;
      if (orderData.withIPI !== undefined) supabaseOrderData.with_ipi = orderData.withIPI;
      if (orderData.ipiValue !== undefined) supabaseOrderData.ipi_value = orderData.ipiValue;
      if (orderData.userId !== undefined) supabaseOrderData.user_id = orderData.userId;
      
      const { error } = await supabase
        .from('orders')
        .update(supabaseOrderData)
        .eq('id', orderId);
      
      if (error) {
        console.error("Order update error:", error);
        throw error;
      }
      
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { 
                ...order, 
                ...orderData, 
                updatedAt: new Date()
              }
            : order
        )
      );
      
      toast.success(`Pedido atualizado com sucesso!`);
      
      await fetchOrders();
      
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast.error(`Erro ao atualizar pedido: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const getOrderById = (id: string) => {
    console.log(`Fetching order with ID: ${id}`);
    console.log(`Current orders in state:`, orders.map(o => ({ id: o.id, number: o.orderNumber, user: o.user })));
    
    const foundOrder = orders.find(order => order.id === id);
    
    if (!foundOrder) {
      console.error(`Order with ID ${id} not found in state`);
      return undefined;
    }
    
    console.log(`Found order:`, foundOrder);
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
