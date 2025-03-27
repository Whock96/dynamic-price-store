
import React from 'react';
import { Badge } from '@/components/ui/badge';

type OrderStatusType = 'pending' | 'confirmed' | 'invoiced' | 'completed' | 'canceled';

interface OrderStatusBadgeProps {
  status: OrderStatusType;
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
    case 'confirmed':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Confirmado</Badge>;
    case 'invoiced':
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Faturado</Badge>;
    case 'completed':
      return <Badge className="bg-green-100 text-green-800 border-green-200">Concluído</Badge>;
    case 'canceled':
      return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelado</Badge>;
    default:
      return <Badge variant="outline">Desconhecido</Badge>;
  }
};

export default OrderStatusBadge;
