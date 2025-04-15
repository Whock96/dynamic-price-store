
import React from 'react';
import { Order } from '@/types/types';
import { formatCurrency } from '@/utils/formatters';
import Logo from '@/assets/logo';
import { useCompany } from '@/context/CompanyContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PrintableInvoiceProps {
  order: Order;
}

const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ order }) => {
  const { companyInfo } = useCompany();
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
    <div className="print-container p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-4 border-b pb-2">
        <div className="flex items-center">
          <Logo size="md" />
        </div>
        <div className="text-right text-xs">
          <p className="font-bold text-base">{companyInfo.name}</p>
          <p>CNPJ: {companyInfo.document} | IE: {companyInfo.stateRegistration}</p>
          <p>{companyInfo.address} - {companyInfo.city}/{companyInfo.state} - {companyInfo.zipCode}</p>
          <p>Tel: {companyInfo.phone} | {companyInfo.email}</p>
          {companyInfo.website && <p>{companyInfo.website}</p>}
        </div>
      </div>

      <div className="text-center mb-4">
        <h1 className="text-xl font-bold border border-gray-300 inline-block px-3 py-1">
          FATURAMENTO DO PEDIDO #{order.orderNumber || '1'}
        </h1>
        <p className="text-xs mt-1">
          Emitido em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>

      <div className="border p-2 rounded mb-4">
        <h2 className="font-bold border-b pb-1 mb-2">Informações do Faturamento</h2>
        <p className="text-sm"><span className="font-semibold">Cliente:</span> {order.customer?.companyName || "Cliente não identificado"}</p>
        <p className="text-sm"><span className="font-semibold">CNPJ/CPF:</span> {order.customer?.document || "N/A"}</p>
        <p className="text-sm"><span className="font-semibold">Tipo de Nota:</span> {order.fullInvoice ? 'Nota Cheia' : 'Meia Nota'}</p>
        {!order.fullInvoice && (
          <p className="text-sm"><span className="font-semibold">Percentual da Nota:</span> {order.halfInvoicePercentage || 50}%</p>
        )}
        <p className="text-sm"><span className="font-semibold">Método de Divisão:</span> {halfInvoiceType === 'quantity' ? 'Por Quantidade' : 'Por Preço'}</p>
      </div>

      <table className="w-full border-collapse text-xs mb-4">
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

      <div className="border p-2 rounded mb-4">
        <h2 className="font-bold border-b pb-1 mb-2">Resumo Financeiro</h2>
        <div className="flex justify-between py-1">
          <span className="font-semibold">Subtotal:</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        {(order.totalDiscount && order.totalDiscount > 0) && (
          <div className="flex justify-between py-1 text-red-600">
            <span className="font-semibold">Descontos:</span>
            <span>-{formatCurrency(order.totalDiscount)}</span>
          </div>
        )}
        {order.taxSubstitution && (
          <div className="flex justify-between py-1 text-orange-600">
            <span className="font-semibold">Substituição Tributária:</span>
            <span>+{formatCurrency(order.items.reduce((sum, item) => sum + (item.taxSubstitutionValue || 0), 0))}</span>
          </div>
        )}
        {order.withIPI && (
          <div className="flex justify-between py-1 text-blue-600">
            <span className="font-semibold">IPI:</span>
            <span>+{formatCurrency(ipiValue)}</span>
          </div>
        )}
        <div className="flex justify-between py-1 font-bold border-t mt-1">
          <span>Total:</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
        <p>Este documento não possui valor fiscal. Para mais informações entre em contato conosco.</p>
      </div>

      <style>
        {`
          @media print {
            @page { size: A4; margin: 10mm; }
            body { 
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-size: 12px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default PrintableInvoice;
