
import React, { createContext, useContext, useState } from 'react';
import { Order } from '@/types/types';

interface OrderContextType {
  orders: Order[];
  getOrderById?: (id: string) => Order | undefined;
  updateOrder?: (id: string, order: Partial<Order>) => Promise<Order | null>;
  updateOrderStatus?: (id: string, status: Order['status']) => Promise<Order | null>;
  deleteOrder?: (id: string) => Promise<boolean>;
  isLoading?: boolean;
}

const OrderContext = createContext<OrderContextType>({
  orders: []
});

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);

  return (
    <OrderContext.Provider value={{ orders }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  return useContext(OrderContext);
};
