
import React from 'react';
import { Order } from '@/types/types';
import { formatCurrency } from '@/utils/formatters';

interface PrintableInvoiceProps {
  order: Order;
}

const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ order }) => {
  const halfInvoiceType = order.halfInvoiceType || 'quantity';
  const ipiValue = order.withIPI ? (order.ipiValue || 0) : 0;

  // Update the calculations to use the correct halfInvoiceType
  const calculatePriceWithInvoice = (finalPrice: number, percentage: number) => {
    return finalPrice * (percentage / 100);
  };

  const calculatePriceWithoutInvoice = (finalPrice: number, percentage: number) => {
    return finalPrice * ((100 - percentage) / 100);
  };

  const calculateQuantityWithInvoice = (totalUnits: number, percentage: number) => {
    return Math.round(totalUnits * (percentage / 100));
  };

  const calculateQuantityWithoutInvoice = (totalUnits: number, percentage: number) => {
    return Math.round(totalUnits * ((100 - percentage) / 100));
  };

  return (
    <div className="print-container">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1 text-left">Produto</th>
            <th className="border p-1 text-right">Preço Unit.</th>
            {!order.fullInvoice && halfInvoiceType === 'price' && (
              <>
                <th className="border p-1 text-right">Preço c/ nota</th>
                <th className="border p-1 text-right">Preço s/ nota</th>
              </>
            )}
            {!order.fullInvoice && halfInvoiceType === 'quantity' && (
              <>
                <th className="border p-1 text-center">Qtd. c/ nota</th>
                <th className="border p-1 text-center">Qtd. s/ nota</th>
              </>
            )}
            <th className="border p-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => {
            const halfInvoicePercentage = order.halfInvoicePercentage || 50;
            const totalUnits = item.totalUnits || (item.quantity * (item.product.quantityPerVolume || 1));
            
            return (
              <tr key={item.id || `item-${index}`}>
                <td className="border p-1">{item.product.name}</td>
                <td className="border p-1 text-right">{formatCurrency(item.finalPrice)}</td>
                
                {!order.fullInvoice && halfInvoiceType === 'price' && (
                  <>
                    <td className="border p-1 text-right">
                      {formatCurrency(calculatePriceWithInvoice(item.finalPrice, halfInvoicePercentage))}
                    </td>
                    <td className="border p-1 text-right">
                      {formatCurrency(calculatePriceWithoutInvoice(item.finalPrice, halfInvoicePercentage))}
                    </td>
                  </>
                )}
                
                {!order.fullInvoice && halfInvoiceType === 'quantity' && (
                  <>
                    <td className="border p-1 text-center">
                      {calculateQuantityWithInvoice(totalUnits, halfInvoicePercentage)}
                    </td>
                    <td className="border p-1 text-center">
                      {calculateQuantityWithoutInvoice(totalUnits, halfInvoicePercentage)}
                    </td>
                  </>
                )}
                
                <td className="border p-1 text-right">{formatCurrency(item.subtotal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PrintableInvoice;
