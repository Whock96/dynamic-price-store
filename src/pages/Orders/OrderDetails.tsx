
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useReactToPrint } from 'react-to-print';
import OrderPrint from '@/components/OrderPrint';
import { Order } from '@/types/types';

interface OrderDetailsProps {
  order: Order;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    documentTitle: `Pedido #${order.id}`,
    content: () => printRef.current,
  });

  return (
    <div>
      <h1>Order Details</h1>
      <Button onClick={() => handlePrint()}>Print Order</Button>
      
      <div className="hidden">
        <div ref={printRef}>
          <OrderPrint order={order} />
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
