import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type PrintableOrderProps = {
  order: any;
  companyInfo: any;
}

const PrintableOrder: React.FC<PrintableOrderProps> = ({ order, companyInfo }) => {
  if (!order) return null;

  // Format currency to BRL
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calculate total weight
  const calculateTotalWeight = () => {
    let total = 0;
    order.items.forEach((item: any) => {
      total += (item.quantity || 0) * (item.product?.weight || 0);
    });
    return total.toFixed(2);
  };

  // Calculate total volumes
  const calculateTotalVolumes = () => {
    let total = 0;
    order.items.forEach((item: any) => {
      total += (item.quantity || 0);
    });
    return total;
  };

  // Calculate total units for an item
  const calculateTotalUnits = (item: any) => {
    return (item.quantity || 0) * (item.product?.quantityPerVolume || 1);
  };

  // Calculate total weight for an item
  const calculateItemWeight = (item: any) => {
    return ((item.quantity || 0) * (item.product?.weight || 0)).toFixed(2);
  };

  return (
    <div>
      {/* This component can be implemented if needed, but we're primarily using the string version in OrderDetail.tsx */}
      <h1>Printable Order</h1>
    </div>
  );
};

export default PrintableOrder;
