
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
    }).format(value);
  };

  useEffect(() => {
    const printTimeout = setTimeout(() => {
      window.print();
      if (onPrint) onPrint();
    }, 500);

    return () => clearTimeout(printTimeout);
  }, [onPrint]);

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto print:p-4">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div className="flex items-center">
          <Logo size="md" />
        </div>
        <div className="text-right text-sm">
          <p className="font-bold text-lg">{companyInfo.name}</p>
          <p>CNPJ: {companyInfo.document}</p>
          <p>IE: {companyInfo.stateRegistration}</p>
          <p>{companyInfo.address}</p>
          <p>{companyInfo.city}/{companyInfo.state} - {companyInfo.zipCode}</p>
          <p>Tel: {companyInfo.phone}</p>
          <p>{companyInfo.email}</p>
          {companyInfo.website && <p>{companyInfo.website}</p>}
        </div>
      </div>

      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold border-2 border-gray-300 inline-block px-4 py-1">
          PEDIDO #{order.id.slice(-4)}
        </h1>
        <p className="text-sm mt-1">
          Emitido em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="border p-3 rounded">
          <h2 className="font-bold border-b pb-1 mb-2">Dados do Cliente</h2>
          <p className="font-semibold">{order.customer.companyName}</p>
          <p>CNPJ/CPF: {order.customer.document}</p>
          <p>{order.customer.street}, {order.customer.number} {order.customer.complement && `- ${order.customer.complement}`}</p>
          <p>{order.customer.city}/{order.customer.state} - {order.customer.zipCode}</p>
          <p>Tel: {order.customer.phone}</p>
          <p>Email: {order.customer.email}</p>
        </div>
        
        <div className="border p-3 rounded">
          <h2 className="font-bold border-b pb-1 mb-2">Dados do Pedido</h2>
          <p><span className="font-semibold">Data do Pedido:</span> {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
          <p><span className="font-semibold">Vendedor:</span> {order.user?.name || 'Não informado'}</p>
          <p><span className="font-semibold">Status:</span> {
            order.status === 'pending' ? 'Pendente' : 
            order.status === 'confirmed' ? 'Confirmado' : 
            order.status === 'invoiced' ? 'Faturado' : 
            order.status === 'completed' ? 'Concluído' : 'Cancelado'
          }</p>
          <p><span className="font-semibold">Forma de Pagamento:</span> {order.paymentMethod === 'cash' ? 'À Vista' : 'A Prazo'}</p>
          {order.paymentMethod === 'credit' && order.paymentTerms && (
            <p><span className="font-semibold">Prazos:</span> {order.paymentTerms}</p>
          )}
          <p><span className="font-semibold">Tipo de Nota:</span> {order.fullInvoice ? 'Nota Cheia' : 'Meia Nota'}</p>
          {!order.fullInvoice && order.halfInvoicePercentage && (
            <p><span className="font-semibold">Percentual da Nota:</span> {order.halfInvoicePercentage}%</p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="font-bold border-b pb-1 mb-2">Itens do Pedido</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Produto</th>
              <th className="border p-2 text-right">Preço Unit.</th>
              <th className="border p-2 text-center">Desc.</th>
              <th className="border p-2 text-right">Preço Final</th>
              <th className="border p-2 text-center">Qtd.</th>
              <th className="border p-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={item?.id || `item-${index}`}>
                <td className="border p-2">{item?.product?.name || item?.productName || `Produto ${index + 1}`}</td>
                <td className="border p-2 text-right">{formatCurrency(item?.listPrice || item?.product?.listPrice || 0)}</td>
                <td className="border p-2 text-center">{item?.discount || 0}%</td>
                <td className="border p-2 text-right">{formatCurrency(item?.finalPrice || 0)}</td>
                <td className="border p-2 text-center">{item?.quantity || 0}</td>
                <td className="border p-2 text-right">{formatCurrency(item?.subtotal || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(order.appliedDiscounts || order.discountOptions) && (
        <div className="mb-6">
          <h2 className="font-bold border-b pb-1 mb-2">Descontos e Acréscimos Aplicados</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Descrição</th>
                <th className="border p-2 text-center">Tipo</th>
                <th className="border p-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {(order.appliedDiscounts || order.discountOptions || []).map((discount, index) => (
                <tr key={index}>
                  <td className="border p-2">{discount.name}</td>
                  <td className="border p-2 text-center">{discount.type === 'discount' ? 'Desconto' : 'Acréscimo'}</td>
                  <td className="border p-2 text-right">{discount.value}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mb-6">
        <h2 className="font-bold border-b pb-1 mb-2">Detalhes de Entrega</h2>
        <p><span className="font-semibold">Tipo:</span> {order.shipping === 'delivery' ? 'Entrega' : 'Retirada'}</p>
        
        {order.shipping === 'delivery' && order.deliveryLocation && (
          <p><span className="font-semibold">Região:</span> {order.deliveryLocation === 'capital' ? 'Capital' : 'Interior'}</p>
        )}
        
        {order.shipping === 'delivery' && order.deliveryFee && order.deliveryFee > 0 && (
          <p><span className="font-semibold">Taxa de Entrega:</span> {formatCurrency(order.deliveryFee)}</p>
        )}
      </div>

      <div className="mb-6">
        <h2 className="font-bold border-b pb-1 mb-2">Resumo Financeiro</h2>
        <div className="flex justify-end">
          <table className="min-w-[300px]">
            <tbody>
              <tr>
                <td className="py-1">Subtotal:</td>
                <td className="py-1 text-right font-medium">{formatCurrency(order.subtotal)}</td>
              </tr>
              <tr>
                <td className="py-1">Descontos:</td>
                <td className="py-1 text-right text-red-600 font-medium">-{formatCurrency(order.totalDiscount || 0)}</td>
              </tr>
              {order.deliveryFee && order.deliveryFee > 0 && (
                <tr>
                  <td className="py-1">Taxa de Entrega:</td>
                  <td className="py-1 text-right font-medium">{formatCurrency(order.deliveryFee)}</td>
                </tr>
              )}
              <tr className="border-t border-gray-200">
                <td className="py-2 font-bold">Total:</td>
                <td className="py-2 text-right font-bold text-lg">{formatCurrency(order.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {order.notes && (
        <div className="mb-6">
          <h2 className="font-bold border-b pb-1 mb-2">Observações</h2>
          <p className="border p-3 bg-gray-50">{order.notes}</p>
        </div>
      )}

      <div className="mt-12 pt-12 border-t border-gray-200 text-center text-sm text-gray-500">
        <p>Este documento não possui valor fiscal. Para mais informações entre em contato conosco.</p>
      </div>

      <style jsx>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintableOrder;
