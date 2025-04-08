
import React, { createContext, useContext, useState } from 'react';
import { Order } from '@/types/types';

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Simplified mock implementation
  const addOrder = async (newOrder: Partial<Order>) => {
    const orderId = `order-${Date.now()}`;
    return orderId;
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    // Mock implementation
  };
  
  const updateOrder = (orderId: string, orderData: Partial<Order>) => {
    // Mock implementation
  };

  const getOrderById = (id: string) => {
    return orders.find(order => order.id === id);
  };
  
  const clearAllOrders = () => {
    setOrders([]);
  };

  const deleteOrder = (orderId: string) => {
    setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
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
