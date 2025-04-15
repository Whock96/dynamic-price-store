
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Order, CompanyInfo } from '@/types/types';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/formatters';

interface PrintableInvoiceProps {
  order: Order;
  companyInfo: CompanyInfo;
  onPrint?: () => void;
}

const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ 
  order,
  companyInfo,
  onPrint 
}) => {
  const [transportCompanyName, setTransportCompanyName] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchTransportCompany = async () => {
      if (order.transportCompanyId) {
        const { data, error } = await supabase
          .from('transport_companies')
          .select('name')
          .eq('id', order.transportCompanyId)
          .single();
          
        if (!error && data) {
          setTransportCompanyName(data.name);
        }
      }
    };
    
    fetchTransportCompany();
  }, [order.transportCompanyId]);
  
  useEffect(() => {
    const printTimeout = setTimeout(() => {
      window.print();
      if (onPrint) onPrint();
    }, 500);

    return () => clearTimeout(printTimeout);
  }, [onPrint]);

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(2)} kg`;
  };

  const orderNumber = order.orderNumber ? order.orderNumber.toString() : '1';
  
  const invoiceTypeText = order.fullInvoice ? 'Nota Cheia' : 'Meia Nota';
  const halfInvoiceText = !order.fullInvoice && order.halfInvoicePercentage ? 
    `(${order.halfInvoicePercentage}%)` : '';
  
  const halfInvoicePercentage = order.halfInvoicePercentage || 50;
  const halfInvoiceType = order.halfInvoiceType || 'price';
  
  let totalOrderWeight = 0;
  let totalVolumes = 0;

  order.items.forEach(item => {
    const itemWeight = (item.quantity || 0) * (item.product?.weight || 0);
    totalOrderWeight += itemWeight;
    totalVolumes += (item.quantity || 0);
  });

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

  const calculateTotalWithInvoice = (
    subtotal: number, 
    percentage: number,
    taxSubstitution: number,
    ipiTotal: number,
    deliveryFee: number
  ) => {
    return (subtotal * (percentage / 100)) + taxSubstitution + ipiTotal + deliveryFee;
  };

  const calculateTotalWithoutInvoice = (subtotal: number, percentage: number) => {
    return subtotal * ((100 - percentage) / 100);
  };

  const subtotalAfterDiscount = order.subtotal - (order.totalDiscount || 0);
  const taxSubstitutionValue = order.taxSubstitution ? (7.8 / 100) * order.subtotal : 0;
  const ipiValue = order.withIPI ? (order.ipiValue || 0) : 0;
  const deliveryFee = order.deliveryFee || 0;

  return (
    <div className="bg-white p-4 max-w-4xl mx-auto print:p-2">
      <div className="flex justify-between items-start mb-2 border-b pb-2">
        <div className="flex items-center">
          <img src="/lovable-uploads/68daf61d-816f-4f86-8b3f-4f0970296cf0.png" width="150" height="60" style={{ objectFit: 'contain' }} alt="Ferplas Logo" />
        </div>
        <div className="text-right text-xs">
          <p className="font-bold text-base">{companyInfo.name}</p>
          <p>CNPJ: {companyInfo.document} | IE: {companyInfo.stateRegistration}</p>
          <p>{companyInfo.address} - {companyInfo.city}/{companyInfo.state} - {companyInfo.zipCode}</p>
          <p>Tel: {companyInfo.phone} | {companyInfo.email}</p>
          {companyInfo.website && <p>{companyInfo.website}</p>}
        </div>
      </div>

      <div className="text-center mb-3">
        <h1 className="text-xl font-bold border border-gray-300 inline-block px-3 py-1">
          FATURAMENTO DO PEDIDO #{orderNumber}
        </h1>
        <p className="text-xs mt-0.5">
          Emitido em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="border p-2 rounded">
          <h2 className="font-bold border-b pb-0.5 mb-1 text-sm">Cliente</h2>
          <p className="font-semibold">{order.customer.companyName}</p>
          <p>CNPJ/CPF: {order.customer.document}</p>
          {order.customer.stateRegistration && (
            <p>IE: {order.customer.stateRegistration}</p>
          )}
          <p>{order.customer.street}, {order.customer.number} {order.customer.complement && `- ${order.customer.complement}`}</p>
          <p>{order.customer.city}/{order.customer.state} - {order.customer.zipCode}</p>
          <p>Tel: {order.customer.phone}</p>
          {order.customer.whatsapp && (
            <p>WhatsApp: {order.customer.whatsapp}</p>
          )}
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
          <p><span className="font-semibold">Tipo de Nota:</span> {invoiceTypeText} {halfInvoiceText}</p>
          {!order.fullInvoice && (
            <p><span className="font-semibold">Tipo de Meia Nota:</span> {halfInvoiceType === 'quantity' ? 'Na Quantidade' : 'No Preço'}</p>
          )}
          <p><span className="font-semibold">Pagamento:</span> {order.paymentMethod === 'cash' ? 'À Vista' : 'A Prazo'}</p>
          {order.paymentMethod === 'credit' && order.paymentTerms && (
            <p><span className="font-semibold">Prazos:</span> {order.paymentTerms}</p>
          )}
        </div>
      </div>

      <div className="mb-3">
        <h2 className="font-bold border-b pb-0.5 mb-1 text-sm">Itens do Pedido</h2>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-1 text-left">Produto</th>
              <th className="border p-1 text-right">Preço Unitário</th>
              <th className="border p-1 text-center">Desc. Total (%)</th>
              <th className="border p-1 text-right">Preço Final</th>
              {!order.fullInvoice && halfInvoiceType === 'price' && (
                <>
                  <th className="border p-1 text-right">Preço c/ nota</th>
                  <th className="border p-1 text-right">Preço s/ nota</th>
                </>
              )}
              {order.items.some(item => (item?.taxSubstitutionValue || 0) > 0) && (
                <th className="border p-1 text-right">ST</th>
              )}
              {order.items.some(item => (item?.ipiValue || 0) > 0) && (
                <th className="border p-1 text-right">IPI</th>
              )}
              <th className="border p-1 text-right">Total c/ Impostos</th>
              <th className="border p-1 text-center">Qtd. Volumes</th>
              <th className="border p-1 text-center">Total Unidades</th>
              {!order.fullInvoice && halfInvoiceType === 'quantity' && (
                <>
                  <th className="border p-1 text-center">Qtd. c/ nota</th>
                  <th className="border p-1 text-center">Qtd. s/ nota</th>
                </>
              )}
              <th className="border p-1 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => {
              const totalUnits = (item.quantity || 0) * (item.product?.quantityPerVolume || 1);
              return (
                <tr key={item?.id || `item-${index}`}>
                  <td className="border p-1">{item?.product?.name || `Produto ${index + 1}`}</td>
                  <td className="border p-1 text-right">{formatCurrency((item as any).listPrice || item?.product?.listPrice || 0)}</td>
                  <td className="border p-1 text-center">{item?.totalDiscountPercentage || item?.discount || 0}%</td>
                  <td className="border p-1 text-right">{formatCurrency(item?.finalPrice || 0)}</td>
                  {!order.fullInvoice && halfInvoiceType === 'price' && (
                    <>
                      <td className="border p-1 text-right">
                        {formatCurrency(calculatePriceWithInvoice(item?.finalPrice || 0, halfInvoicePercentage))}
                      </td>
                      <td className="border p-1 text-right">
                        {formatCurrency(calculatePriceWithoutInvoice(item?.finalPrice || 0, halfInvoicePercentage))}
                      </td>
                    </>
                  )}
                  {order.items.some(i => (i?.taxSubstitutionValue || 0) > 0) && (
                    <td className="border p-1 text-right">{formatCurrency(item?.taxSubstitutionValue || 0)}</td>
                  )}
                  {order.items.some(i => (i?.ipiValue || 0) > 0) && (
                    <td className="border p-1 text-right">{formatCurrency(item?.ipiValue || 0)}</td>
                  )}
                  <td className="border p-1 text-right">{formatCurrency(item?.totalWithTaxes || 0)}</td>
                  <td className="border p-1 text-center">{item?.quantity || 0}</td>
                  <td className="border p-1 text-center">{totalUnits}</td>
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
                  <td className="border p-1 text-right">{formatCurrency(item?.subtotal || 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <h2 className="font-bold border-b pb-0.5 mb-1 text-sm">Resumo Financeiro</h2>
          <table className="w-full text-xs">
            <tbody>
              <tr>
                <td className="py-0.5">Total dos Produtos:</td>
                <td className="py-0.5 text-right font-medium">{formatCurrency(order.subtotal)}</td>
              </tr>
              <tr>
                <td className="py-0.5">Descontos:</td>
                <td className="py-0.5 text-right text-red-600 font-medium">
                  -{formatCurrency(order.totalDiscount || 0)}
                </td>
              </tr>
              <tr>
                <td className="py-0.5">Subtotal Pedido:</td>
                <td className="py-0.5 text-right font-medium">
                  {formatCurrency(subtotalAfterDiscount)}
                </td>
              </tr>
              {order.taxSubstitution && (
                <tr>
                  <td className="py-0.5">Substituição Tributária:</td>
                  <td className="py-0.5 text-right text-orange-600 font-medium">
                    +{formatCurrency(taxSubstitutionValue)}
                  </td>
                </tr>
              )}
              {order.withIPI && (
                <tr>
                  <td className="py-0.5">IPI:</td>
                  <td className="py-0.5 text-right text-orange-600 font-medium">
                    +{formatCurrency(ipiValue)}
                  </td>
                </tr>
              )}
              {deliveryFee > 0 && (
                <tr>
                  <td className="py-0.5">Taxa de Entrega:</td>
                  <td className="py-0.5 text-right font-medium">
                    {formatCurrency(deliveryFee)}
                  </td>
                </tr>
              )}
              <tr className="border-t border-gray-200">
                <td className="py-1 font-bold">Total:</td>
                <td className="py-1 text-right font-bold">{formatCurrency(order.total)}</td>
              </tr>
              {!order.fullInvoice && (
                <>
                  <tr>
                    <td className="py-0.5">Total c/ Nota:</td>
                    <td className="py-0.5 text-right font-medium">
                      {formatCurrency(calculateTotalWithInvoice(
                        subtotalAfterDiscount,
                        halfInvoicePercentage,
                        taxSubstitutionValue,
                        ipiValue,
                        deliveryFee
                      ))}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5">Total s/ Nota:</td>
                    <td className="py-0.5 text-right font-medium">
                      {formatCurrency(calculateTotalWithoutInvoice(
                        subtotalAfterDiscount,
                        halfInvoicePercentage
                      ))}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="font-bold border-b pb-0.5 mb-1 text-sm">Entrega</h2>
          <div className="text-xs">
            <p><span className="font-semibold">Tipo:</span> {order.shipping === 'delivery' ? 'Entrega' : 'Retirada'}</p>
            
            {transportCompanyName && (
              <p><span className="font-semibold">Transportadora:</span> {transportCompanyName}</p>
            )}
            
            {order.shipping === 'delivery' && order.deliveryLocation && (
              <p><span className="font-semibold">Região:</span> {order.deliveryLocation === 'capital' ? 'Capital' : 'Interior'}</p>
            )}
            
            {order.shipping === 'delivery' && deliveryFee > 0 && (
              <p><span className="font-semibold">Taxa de Entrega:</span> {formatCurrency(deliveryFee)}</p>
            )}
            
            <p><span className="font-semibold">Peso Total do Pedido:</span> {formatWeight(totalOrderWeight)}</p>
            <p><span className="font-semibold">Total de Volumes:</span> {totalVolumes}</p>
          </div>
        </div>
      </div>

      {(order.notes || order.observations) && (
        <div className="mb-3">
          <h2 className="font-bold border-b pb-0.5 mb-1 text-sm">Observações</h2>
          <p className="border p-1 bg-gray-50 text-xs">{order.notes || order.observations}</p>
        </div>
      )}

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

export default PrintableInvoice;
