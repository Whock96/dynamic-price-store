
import React from 'react';
import { useParams } from 'react-router-dom';
import OrderDetails from './OrderDetails';

const OrderDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  
  // This is a placeholder. In a real app, you would fetch the order data
  const mockOrder = {
    id: id || '1',
    customerId: '1',
    customer: {
      id: '1',
      companyName: 'Test Company',
      document: '123456789',
      street: 'Test Street',
      number: '123',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345-678',
      phone: '123-456-7890',
      email: 'test@example.com',
      defaultDiscount: 0
    },
    items: [],
    status: 'pending',
    total: 0,
    subtotal: 0,
    totalDiscount: 0
  };

  return <OrderDetails order={mockOrder} />;
};

export default OrderDetailsPage;
