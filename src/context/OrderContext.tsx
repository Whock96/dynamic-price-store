
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, CartItem } from '@/types/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

// Create a key for localStorage
const ORDERS_STORAGE_KEY = 'ferplas-orders-data';

interface OrderContextType {
  orders: Order[];
  addOrder: (newOrder: Partial<Order>) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updateOrder: (orderId: string, orderData: Partial<Order>) => void;
  getOrderById: (id: string) => Order | undefined;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Load orders from localStorage on initial render with an empty array as default
  useEffect(() => {
    const savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (savedOrders) {
      try {
        // Parse dates properly when loading from localStorage
        const parsedOrders = JSON.parse(savedOrders, (key, value) => {
          if (key === 'createdAt' || key === 'updatedAt') {
            return new Date(value);
          }
          return value;
        });
        if (Array.isArray(parsedOrders)) {
          console.log(`Loaded ${parsedOrders.length} orders from localStorage`);
          setOrders(parsedOrders);
        } else {
          console.log('No valid orders in localStorage, setting empty array');
          setOrders([]);
        }
      } catch (error) {
        console.error('Error loading orders from localStorage:', error);
        setOrders([]);
      }
    } else {
      console.log('No orders in localStorage, setting empty array');
      setOrders([]);
    }
  }, []);
  
  // Save orders to localStorage whenever they change
  useEffect(() => {
    console.log(`Saving ${orders.length} orders to localStorage`);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  const addOrder = (newOrder: Partial<Order>) => {
    const orderId = `order-${Date.now()}`;
    
    const order: Order = {
      ...newOrder as any,
      id: orderId,
      userId: user?.id || 'user-1',
      user: user || {
        id: 'user-1',
        name: 'Usuário Padrão',
        username: 'usuario',
        role: 'salesperson',
        permissions: [],
        email: '',
        createdAt: new Date()
      },
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setOrders(prevOrders => [order, ...prevOrders]);
    toast.success(`Pedido #${orderId.slice(-4)} criado com sucesso!`);
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    console.log(`Updating order status: ${orderId} to ${status}`);
    
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? { ...order, status, updatedAt: new Date() }
          : order
      )
    );
    toast.success(`Status do pedido #${orderId.slice(-4)} atualizado para ${status}`);
  };
  
  const updateOrder = (orderId: string, orderData: Partial<Order>) => {
    console.log(`Updating order: ${orderId}`, orderData);
    
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
    toast.success(`Pedido #${orderId.slice(-4)} atualizado com sucesso!`);
  };

  const getOrderById = (id: string) => {
    // Adding console.log for debugging
    console.log(`Looking for order with ID: ${id}`);
    console.log(`Available orders:`, orders.map(order => order.id));
    
    const order = orders.find(order => order.id === id);
    console.log(`Found order:`, order);
    return order;
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderStatus, updateOrder, getOrderById }}>
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

