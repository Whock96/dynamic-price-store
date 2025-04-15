import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, CartItem, DiscountOption } from '@/types/types';
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
  
  const isSalespersonType = user?.userTypeId === 'c5ee0433-3faf-46a4-a516-be7261bfe575';
  
  useEffect(() => {
    console.log("OrderContext - User changed, refetching orders:", user);
    console.log("OrderContext - Tipo de usuário do vendedor:", user?.userTypeId);
    console.log("OrderContext - É vendedor específico:", isSalespersonType);
    fetchOrders();
  }, [user, isSalespersonType]);
  
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          customers(*)
        `);
      
      if (isSalespersonType && user?.id) {
        console.log("OrderContext - Filtrando pedidos ESTRITAMENTE para vendedor ESPECÍFICO:", user.id, "(tipo:", typeof user.id, ")");
        
        const userIdStr = String(user.id);
        console.log("OrderContext - ID do usuário convertido para string:", userIdStr);
        
        query = query.eq('user_id', userIdStr);
      }
      else if (user?.role === 'salesperson' && user?.id) {
        console.log("OrderContext - Filtrando pedidos para vendedor (role):", user.id, "(tipo:", typeof user.id, ")");
        
        const userIdStr = String(user.id);
        console.log("OrderContext - ID do usuário convertido para string:", userIdStr);
        
        query = query.eq('user_id', userIdStr);
      }
      
      const { data: ordersData, error: ordersError } = await query
        .order('created_at', { ascending: false });
        
      if (ordersError) throw ordersError;
      
      if (!ordersData) {
        setOrders([]);
        return;
      }
      
      console.log("OrderContext - Dados brutos de pedidos do Supabase:", ordersData);
      
      const processedOrders = await Promise.all(ordersData.map(async (order) => {
        const { data: itemsData } = await supabase
          .from('order_items')
          .select(`
            *,
            products(*)
          `)
          .eq('order_id', order.id);
        
        // Process applied_discounts from JSONB
        let discounts: DiscountOption[] = [];
        if (order.applied_discounts) {
          console.log("Applied discounts from DB:", order.applied_discounts);
          if (Array.isArray(order.applied_discounts)) {
            discounts = (order.applied_discounts as unknown) as DiscountOption[];
          }
        }
        
        let userName = null;
        if (order.user_id) {
          console.log("OrderContext - Verificando ID de usuário do pedido:", order.user_id, "(tipo:", typeof order.user_id, ")");
          
          if (user && String(user.id) === String(order.user_id)) {
            userName = user.name;
            console.log("OrderContext - Usando nome do usuário atual para o pedido:", userName);
          } else {
            const { data: userData } = await supabase
              .from('users')
              .select('name')
              .eq('id', order.user_id)
              .single();
              
            if (userData && userData.name) {
              userName = userData.name;
              console.log("OrderContext - Nome do usuário buscado do DB para o pedido:", userName);
            } else {
              console.log("OrderContext - Não foi possível encontrar usuário para pedido com user_id:", order.user_id);
              userName = 'Usuário do Sistema';
            }
          }
        } else {
          userName = 'Usuário do Sistema';
        }
        
        const processedOrder = supabaseOrderToAppOrder(order, itemsData || []);
        
        if (userName) {
          processedOrder.user = {
            ...processedOrder.user,
            name: userName
          };
        }
        
        processedOrder.appliedDiscounts = discounts;
        
        console.log("OrderContext - Pedido processado para usuário:", {
          orderId: processedOrder.id,
          orderNumber: processedOrder.orderNumber,
          userId: processedOrder.userId,
          userName: processedOrder.user?.name
        });
        
        return processedOrder;
      }));
      
      let filteredOrders = [...processedOrders];
      
      if (isSalespersonType && user?.id) {
        console.log("OrderContext - Filtrando novamente pedidos para vendedor ESPECÍFICO após processamento");
        
        const userIdStr = String(user.id);
        filteredOrders = filteredOrders.filter(order => {
          const orderUserId = String(order.userId);
          const matches = orderUserId === userIdStr;
          
          console.log(`OrderContext - Comparando: pedido ${order.orderNumber}, userID ${orderUserId} vs ${userIdStr} = ${matches}`);
          
          return matches;
        });
        
        console.log(`OrderContext - Resultado da filtragem específica: ${filteredOrders.length} de ${processedOrders.length} pedidos`);
      }
      else if (user?.role === 'salesperson' && user?.id) {
        console.log("OrderContext - Filtrando novamente pedidos para vendedor (role) após processamento");
        
        const userIdStr = String(user.id);
        filteredOrders = filteredOrders.filter(order => {
          const orderUserId = String(order.userId);
          const matches = orderUserId === userIdStr;
          
          console.log(`OrderContext - Comparando: pedido ${order.orderNumber}, userID ${orderUserId} vs ${userIdStr} = ${matches}`);
          
          return matches;
        });
        
        console.log(`OrderContext - Resultado da filtragem padrão: ${filteredOrders.length} de ${processedOrders.length} pedidos`);
      }
      
      setOrders(filteredOrders);
      console.log(`Loaded ${filteredOrders.length} orders from Supabase`);
    } catch (error) {
      console.error('Error loading orders:', error);
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
      
      // Convert appliedDiscounts to raw JSON for Supabase
      const appliedDiscounts = newOrder.appliedDiscounts || [];
      console.log("Applied discounts to be saved:", appliedDiscounts);
      
      // Fix: Log the transport company ID being used
      console.log("Transport company ID for database:", newOrder.transportCompanyId);
      
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
        ipi_value: newOrder.ipiValue || 0,
        transport_company_id: newOrder.transportCompanyId, // Ensure this is included correctly
        applied_discounts: (appliedDiscounts as unknown) as Tables<'orders'>['applied_discounts'],
        half_invoice_type: newOrder.halfInvoiceType || 'quantity'
      };
      
      console.log("Order data being inserted:", orderInsert);
      console.log("Transport company ID being inserted:", orderInsert.transport_company_id);
      
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
          subtotal: item.subtotal,
          total_discount_percentage: item.totalDiscountPercentage || 0,
          tax_substitution_value: item.taxSubstitutionValue || 0,
          ipi_value: item.ipiValue || 0,
          total_with_taxes: item.totalWithTaxes || 0,
          total_units: item.totalUnits || (item.quantity * (item.product.quantityPerVolume || 1))
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
      if (orderData.transportCompanyId !== undefined) {
        if (orderData.transportCompanyId === 'none') {
          supabaseOrderData.transport_company_id = null;
          console.log("Setting transport_company_id to null");
        } else {
          supabaseOrderData.transport_company_id = orderData.transportCompanyId;
          console.log(`Setting transport_company_id to ${orderData.transportCompanyId}`);
        }
      }
      if (orderData.appliedDiscounts !== undefined) {
        supabaseOrderData.applied_discounts = (orderData.appliedDiscounts as unknown) as Tables<'orders'>['applied_discounts'];
      }
      if (orderData.halfInvoiceType !== undefined) {
        supabaseOrderData.half_invoice_type = orderData.halfInvoiceType;
      }
      
      console.log("Final Supabase order data for update:", supabaseOrderData);
      
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
    
    if (isSalespersonType && user?.id) {
      const foundOrder = orders.find(order => order.id === id);
      
      if (!foundOrder) {
        console.error(`Order with ID ${id} not found in state`);
        return undefined;
      }
      
      if (String(foundOrder.userId) !== String(user.id)) {
        console.error(`Order with ID ${id} belongs to user ${foundOrder.userId}, not current user ${user.id}`);
        return undefined;
      }
      
      console.log(`Found order for specific salesperson type:`, foundOrder);
      return foundOrder;
    }
    else if (user?.role === 'salesperson' && user?.id) {
      const foundOrder = orders.find(order => order.id === id);
      
      if (!foundOrder) {
        console.error(`Order with ID ${id} not found in state`);
        return undefined;
      }
      
      if (String(foundOrder.userId) !== String(user.id)) {
        console.error(`Order with ID ${id} belongs to user ${foundOrder.userId}, not current user ${user.id}`);
        return undefined;
      }
      
      console.log(`Found order for salesperson:`, foundOrder);
      return foundOrder;
    }
    
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
