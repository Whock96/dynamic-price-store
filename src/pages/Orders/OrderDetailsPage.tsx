
import React from 'react';
import { useParams } from 'react-router-dom';
import OrderDetails from './OrderDetails';
import { useOrderData } from '@/hooks/use-order-data';

const OrderDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { order, isLoading, error } = useOrderData(id);
  
  if (isLoading) {
    return <div>Loading order details...</div>;
  }
  
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  
  if (!order) {
    return <div>Order not found</div>;
  }

  return <OrderDetails order={order} />;
};

export default OrderDetailsPage;
