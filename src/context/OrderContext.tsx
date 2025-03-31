
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order } from '@/types/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

// Mock data for orders
const MOCK_ORDERS: Partial<Order>[] = Array.from({ length: 20 }, (_, i) => {
  const today = new Date();
  const date = new Date(today);
  date.setDate(today.getDate() - Math.floor(Math.random() * 30));
  
  const statuses: Order['status'][] = ['pending', 'confirmed', 'invoiced', 'completed', 'canceled'];
  
  return {
    id: `order-${i + 1}`,
    customerId: `customer-${Math.floor(Math.random() * 10) + 1}`,
    customer: {
      id: `customer-${Math.floor(Math.random() * 10) + 1}`,
      companyName: `Cliente ${Math.floor(Math.random() * 10) + 1} Ltda.`,
      document: `${Math.floor(Math.random() * 100000000000)}-${Math.floor(Math.random() * 100)}`,
      salesPersonId: `user-${Math.floor(Math.random() * 3) + 1}`,
      street: "",
      number: "",
      noNumber: false,
      complement: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      email: "",
      defaultDiscount: 0,
      maxDiscount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    userId: `user-${Math.floor(Math.random() * 3) + 1}`,
    user: {
      id: `user-${Math.floor(Math.random() * 3) + 1}`,
      username: i % 3 === 0 ? 'joao' : i % 3 === 1 ? 'maria' : 'carlos',
      name: i % 3 === 0 ? 'João Silva' : i % 3 === 1 ? 'Maria Oliveira' : 'Carlos Santos',
      role: 'salesperson',
      permissions: [],
      email: "",
      createdAt: new Date()
    },
    items: Array(Math.floor(Math.random() * 10) + 1).fill(null),
    subtotal: Math.floor(Math.random() * 9000) + 1000,
    total: Math.floor(Math.random() * 10000) + 1000,
    status: statuses[i % 5],
    createdAt: date,
    updatedAt: date,
  };
}) as Order[];

interface OrderContextType {
  orders: Order[];
  addOrder: (newOrder: Partial<Order>) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  getOrderById: (id: string) => Order | undefined;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS as Order[]);

  const addOrder = (newOrder: Partial<Order>) => {
    const orderId = `order-${orders.length + 1}`;
    
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
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? { ...order, status, updatedAt: new Date() }
          : order
      )
    );
    toast.success(`Status do pedido #${orderId.slice(-4)} atualizado para ${status}`);
  };

  const getOrderById = (id: string) => {
    return orders.find(order => order.id === id);
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderStatus, getOrderById }}>
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
