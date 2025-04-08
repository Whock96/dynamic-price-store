
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
    totalDiscount: 0,
    // Add missing properties required by Order type
    userId: '1',
    user: {
      id: '1',
      name: 'Test User',
      username: 'testuser',
      role: 'administrator',
      permissions: [],
      email: 'test@example.com',
      createdAt: new Date(),
      userTypeId: '1'
    },
    appliedDiscounts: [],
    shipping: 'delivery',
    paymentMethod: 'cash',
    paymentTerms: 'Net 30',
    fullInvoice: true,
    taxSubstitution: false,
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    observations: '',
    deliveryLocation: 'capital',
    halfInvoicePercentage: 50,
    halfInvoiceType: 'quantity',
    deliveryFee: 0,
    withIPI: false,
    ipiValue: 0,
    transportCompanyId: null
  };

  return <OrderDetails order={mockOrder} />;
};

export default OrderDetailsPage;
