
import React, { forwardRef } from 'react';
import { Order } from '@/types/types';
import PrintableOrder from './orders/PrintableOrder';

interface OrderPrintProps {
  order: Order;
}

const OrderPrint = forwardRef<HTMLDivElement, OrderPrintProps>(({ order }, ref) => {
  return (
    <div ref={ref}>
      <PrintableOrder order={order} />
    </div>
  );
});

OrderPrint.displayName = 'OrderPrint';

export default OrderPrint;
