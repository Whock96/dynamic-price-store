
import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Logo from '@/assets/logo';
import { Order } from '@/types/types';
import { useCompany } from '@/context/CompanyContext';

interface PrintableOrderProps {
  order: Order;
  onPrint?: () => void;
}

const PrintableOrder: React.FC<PrintableOrderProps> = ({ order, onPrint }) => {
  const { companyInfo } = useCompany();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Math.max(value, 0));
  };

  useEffect(() => {
    const printTimeout = setTimeout(() => {
      window.print();
      if (onPrint) onPrint();
    }, 500);

    return () => clearTimeout(printTimeout);
  }, [onPrint]);

  // Display order number correctly, ensuring it's a number and not undefined
  // The order_number field in the database is an integer with autoincrement
  const orderNumber = order.orderNumber ? order.orderNumber.toString() : '1';
  
  // Determine invoice type text based on fullInvoice flag
  const invoiceTypeText = order.fullInvoice ? 'Nota Cheia' : 'Meia Nota';
  
  // Show percentage only if it's a half invoice
  const halfInvoiceText = !order.fullInvoice && order.halfInvoicePercentage ? 
    `(${order.halfInvoicePercentage}%)` : '';
    
  // Calculate tax substitution value if applicable
  const getTaxSubstitutionRate = () => {
    const standardRate = 7.8;
    
    if (!order.taxSubstitution) return 0;
    
    if (!order.fullInvoice && order.halfInvoicePercentage) {
      // Adjust rate based on invoice percentage
      return standardRate * (order.halfInvoicePercentage / 100);
    }
    
    return standardRate;
  };
  
  const effectiveTaxRate = getTaxSubstitutionRate();
  const taxSubstitutionValue = order.taxSubstitution ? (effectiveTaxRate / 100) * order.subtotal : 0;

  return (
    <div className="bg-white p-4 max-w-4xl mx-auto print:p-2">
      {/* Header - More compact */}
      <div className="flex justify-between items-start mb-2 border-b pb-2">
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

      {/* Order Title - More compact */}
      <div className="text-center mb-3">
        <h1 className="text-xl font-bold border border-gray-300 inline-block px-3 py-1">
          PEDIDO #{orderNumber}
        </h1>
        <p className="text-xs mt-0.5">
          Emitido em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>

      {/* Customer and Order Info - More compact 2-column grid */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="border p-2 rounded">
          <h2 className="font-bold border-b pb-0.5 mb-1 text-sm">Cliente</h2>
          <p className="font-semibold">{order.customer.companyName}</p>
          <p>CNPJ/CPF: {order.customer.document}</p>
          <p>{order.customer.street}, {order.customer.number} {order.customer.complement && `- ${order.customer.complement}`}</p>
          <p>{order.customer.city}/{order.customer.state} - {order.customer.zipCode}</p>
          <p>Tel: {order.customer.phone}</p>
        </div>
        
        <div className="border p-2 rounded">
          <h2 className="font-bold border-b pb-0.5 mb-1 text-sm">Dados do Pedido</h2>
          <p><span className="font-semibold">Data:</span> {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
          <p><span className="font-semibold">Vendedor:</span> {order.user?.name || 'Não informado'}</p>
          <p><span className="font-semibold">Status:</span> {
            order.status === 'pending' ? 'Pendente' : 
            order.status === 'confirmed' ? 'Confirmado' : 
            order.status === 'invoiced' ? 'Faturado' : 
            order.status === 'completed' ? 'Concluído' : 'Cancelado'
          }</p>
          <p><span className="font-semibold">Pagamento:</span> {order.paymentMethod === 'cash' ? 'À Vista' : 'A Prazo'}</p>
          {order.paymentMethod === 'credit' && order.paymentTerms && (
            <p><span className="font-semibold">Prazos:</span> {order.paymentTerms}</p>
          )}
          <p><span className="font-semibold">Tipo de Nota:</span> {invoiceTypeText} {halfInvoiceText}</p>
          <p><span className="font-semibold">Substituição Tributária:</span> {order.taxSubstitution ? `Sim (${effectiveTaxRate.toFixed(2)}%)` : 'Não'}</p>
        </div>
      </div>

      {/* Items Table - More compact */}
      <div className="mb-3">
        <h2 className="font-bold border-b pb-0.5 mb-1 text-sm">Itens do Pedido</h2>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-1 text-left">Produto</th>
              <th className="border p-1 text-right">Preço</th>
              <th className="border p-1 text-center">Desc.</th>
              <th className="border p-1 text-right">Final</th>
              <th className="border p-1 text-center">Qtd.</th>
              <th className="border p-1 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={item?.id || `item-${index}`}>
                <td className="border p-1">{item?.product?.name || (item as any).productName || `Produto ${index + 1}`}</td>
                <td className="border p-1 text-right">{formatCurrency((item as any).listPrice || item?.product?.listPrice || 0)}</td>
                <td className="border p-1 text-center">{item?.discount || 0}%</td>
                <td className="border p-1 text-right">{formatCurrency(item?.finalPrice || 0)}</td>
                <td className="border p-1 text-center">{item?.quantity || 0}</td>
                <td className="border p-1 text-right">{formatCurrency(item?.subtotal || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Discounts - Conditional and More Compact */}
      {(order.appliedDiscounts || order.discountOptions) && (order.appliedDiscounts?.length > 0 || order.discountOptions?.length > 0) && (
        <div className="mb-3">
          <h2 className="font-bold border-b pb-0.5 mb-1 text-sm">Descontos e Acréscimos</h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-1 text-left">Descrição</th>
                <th className="border p-1 text-center">Tipo</th>
                <th className="border p-1 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {(order.appliedDiscounts || order.discountOptions || []).map((discount, index) => (
                <tr key={index}>
                  <td className="border p-1">{discount.name}</td>
                  <td className="border p-1 text-center">{discount.type === 'discount' ? 'Desconto' : 'Acréscimo'}</td>
                  <td className="border p-1 text-right">{discount.value}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delivery and Financial Summary - 2 columns for better space usage */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Delivery Details */}
        <div className="text-xs">
          <h2 className="font-bold border-b pb-0.5 mb-1 text-sm">Entrega</h2>
          <p><span className="font-semibold">Tipo:</span> {order.shipping === 'delivery' ? 'Entrega' : 'Retirada'}</p>
          
          {order.shipping === 'delivery' && order.deliveryLocation && (
            <p><span className="font-semibold">Região:</span> {order.deliveryLocation === 'capital' ? 'Capital' : 'Interior'}</p>
          )}
          
          {order.shipping === 'delivery' && order.deliveryFee && order.deliveryFee > 0 && (
            <p><span className="font-semibold">Taxa de Entrega:</span> {formatCurrency(order.deliveryFee)}</p>
          )}
        </div>

        {/* Financial Summary */}
        <div className="text-xs">
          <h2 className="font-bold border-b pb-0.5 mb-1 text-sm">Resumo Financeiro</h2>
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-0.5">Subtotal:</td>
                <td className="py-0.5 text-right font-medium">{formatCurrency(order.subtotal)}</td>
              </tr>
              <tr>
                <td className="py-0.5">Descontos:</td>
                <td className="py-0.5 text-right text-red-600 font-medium">-{formatCurrency(order.totalDiscount || 0)}</td>
              </tr>
              {order.withIPI && (order.ipiValue || 0) > 0 && (
                <tr>
                  <td className="py-0.5">IPI:</td>
                  <td className="py-0.5 text-right text-blue-600 font-medium">+{formatCurrency(order.ipiValue || 0)}</td>
                </tr>
              )}
              {order.taxSubstitution && taxSubstitutionValue > 0 && (
                <tr>
                  <td className="py-0.5">Substituição Tributária ({effectiveTaxRate.toFixed(2)}%):</td>
                  <td className="py-0.5 text-right text-orange-600 font-medium">+{formatCurrency(taxSubstitutionValue)}</td>
                </tr>
              )}
              {order.deliveryFee && order.deliveryFee > 0 && (
                <tr>
                  <td className="py-0.5">Taxa de Entrega:</td>
                  <td className="py-0.5 text-right font-medium">{formatCurrency(order.deliveryFee)}</td>
                </tr>
              )}
              <tr className="border-t border-gray-200">
                <td className="py-1 font-bold">Total:</td>
                <td className="py-1 text-right font-bold">{formatCurrency(order.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes - Only if present, more compact */}
      {order.notes && (
        <div className="mb-3 text-xs">
          <h2 className="font-bold border-b pb-0.5 mb-1 text-sm">Observações</h2>
          <p className="border p-1 bg-gray-50">{order.notes}</p>
        </div>
      )}

      {/* Footer - More compact */}
      <div className="mt-2 pt-2 border-t border-gray-200 text-center text-xs text-gray-500">
        <p>Este documento não possui valor fiscal. Para mais informações entre em contato conosco.</p>
      </div>

      <style>
        {`
          @media print {
            @page { size: A4; margin: 8mm; }
            body { 
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-size: 11px;
            }
            .max-w-4xl {
              max-width: none;
            }
          }
        `}
      </style>
    </div>
  );
};

export default PrintableOrder;
