
import React, { createContext, useContext, useState } from 'react';
import { Order, Customer } from '@/types/types';

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
    
    // Create a new order object with the generated ID
    const order: Order = {
      id: orderId,
      customerId: newOrder.customerId || '',
      customer: newOrder.customer || {
        id: '',
        companyName: '',
        document: '',
        street: '',
        number: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        email: '',
        defaultDiscount: 0,
        maxDiscount: 0,
        salesPersonId: null,
        noNumber: false,
        complement: '',
        neighborhood: '',
        whatsapp: '',
        stateRegistration: '',
        transportCompanyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        registerDate: new Date()
      },
      items: newOrder.items || [],
      status: newOrder.status || 'pending',
      total: newOrder.total || 0,
      subtotal: newOrder.subtotal || 0,
      totalDiscount: newOrder.totalDiscount || 0,
      userId: newOrder.userId || '',
      user: newOrder.user || {
        id: '',
        name: '',
        username: '',
        role: 'administrator',
        permissions: [],
        email: '',
        createdAt: new Date(),
        userTypeId: ''
      },
      appliedDiscounts: newOrder.appliedDiscounts || [],
      shipping: newOrder.shipping || 'delivery',
      paymentMethod: newOrder.paymentMethod || 'cash',
      paymentTerms: newOrder.paymentTerms || '',
      fullInvoice: newOrder.fullInvoice !== undefined ? newOrder.fullInvoice : true,
      taxSubstitution: newOrder.taxSubstitution || false,
      notes: newOrder.notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      observations: newOrder.observations || '',
      deliveryLocation: newOrder.deliveryLocation || null,
      halfInvoicePercentage: newOrder.halfInvoicePercentage || 50,
      halfInvoiceType: newOrder.halfInvoiceType || 'quantity',
      deliveryFee: newOrder.deliveryFee || 0,
      withIPI: newOrder.withIPI || false,
      ipiValue: newOrder.ipiValue || 0,
      transportCompanyId: newOrder.transportCompanyId || null,
      orderNumber: orders.length + 1
    };
    
    // Add the new order to the list
    setOrders(prevOrders => [...prevOrders, order]);
    
    return orderId;
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status, updatedAt: new Date() } : order
      )
    );
  };
  
  const updateOrder = (orderId: string, orderData: Partial<Order>) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, ...orderData, updatedAt: new Date() } : order
      )
    );
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
