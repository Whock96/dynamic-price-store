
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, CartItem } from '@/types/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

// Mock data for orders with valid items
const MOCK_ORDERS: Partial<Order>[] = Array.from({ length: 20 }, (_, i) => {
  const today = new Date();
  const date = new Date(today);
  date.setDate(today.getDate() - Math.floor(Math.random() * 30));
  
  const statuses: Order['status'][] = ['pending', 'confirmed', 'invoiced', 'completed', 'canceled'];
  
  // Create valid mock items for each order
  const mockItems: CartItem[] = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, j) => ({
    id: `item-${i}-${j}`,
    productId: `product-${j + 1}`,
    product: {
      id: `product-${j + 1}`,
      name: `Produto ${j + 1}`,
      description: `Descrição do produto ${j + 1}`,
      listPrice: Math.floor(Math.random() * 500) + 100,
      minPrice: Math.floor(Math.random() * 80) + 50,
      weight: Math.floor(Math.random() * 5) + 0.5,
      quantity: Math.floor(Math.random() * 100) + 10,
      volume: Math.floor(Math.random() * 3) + 1,
      categoryId: `category-${j % 3 + 1}`,
      subcategoryId: `subcategory-${j % 5 + 1}`,
      imageUrl: 'https://via.placeholder.com/150',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    quantity: Math.floor(Math.random() * 10) + 1,
    discount: Math.floor(Math.random() * 10),
    finalPrice: Math.floor(Math.random() * 400) + 100,
    subtotal: Math.floor(Math.random() * 4000) + 100,
  }));
  
  // Calculate mock financial values
  const subtotal = mockItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalDiscount = Math.floor(subtotal * 0.1); // 10% discount
  const total = subtotal - totalDiscount;
  
  return {
    id: `order-${i + 1}`,
    customerId: `customer-${Math.floor(Math.random() * 10) + 1}`,
    customer: {
      id: `customer-${Math.floor(Math.random() * 10) + 1}`,
      companyName: `Cliente ${Math.floor(Math.random() * 10) + 1} Ltda.`,
      document: `${Math.floor(Math.random() * 100000000000)}-${Math.floor(Math.random() * 100)}`,
      salesPersonId: `user-${Math.floor(Math.random() * 3) + 1}`,
      street: "Rua Exemplo",
      number: `${Math.floor(Math.random() * 1000) + 1}`,
      noNumber: false,
      complement: "",
      city: "São Paulo",
      state: "SP",
      zipCode: "01000-000",
      phone: "(11) 99999-9999",
      email: `cliente${i}@exemplo.com`,
      defaultDiscount: 5,
      maxDiscount: 15,
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
      email: `${i % 3 === 0 ? 'joao' : i % 3 === 1 ? 'maria' : 'carlos'}@exemplo.com`,
      createdAt: new Date()
    },
    items: mockItems,
    appliedDiscounts: [],
    totalDiscount,
    subtotal,
    total,
    status: statuses[i % 5],
    shipping: i % 2 === 0 ? 'delivery' : 'pickup',
    fullInvoice: i % 2 === 0,
    taxSubstitution: i % 3 === 0,
    paymentMethod: i % 2 === 0 ? 'cash' : 'credit',
    notes: i % 3 === 0 ? 'Observação de exemplo para este pedido.' : '',
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
    // Adding console.log for debugging
    console.log(`Looking for order with ID: ${id}`);
    console.log(`Available orders:`, orders.map(order => order.id));
    
    const order = orders.find(order => order.id === id);
    console.log(`Found order:`, order);
    return order;
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
