
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Order, CompanyInfo } from '@/types/types';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/formatters';

interface PrintableOrderProps {
  order: Order;
  companyInfo: CompanyInfo;
  onPrint?: () => void;
}

const PrintableOrder: React.FC<PrintableOrderProps> = ({ 
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

  // Notify parent when component is fully rendered
  useEffect(() => {
    if (onPrint) {
      console.log('PrintableOrder rendered, calling onPrint callback');
      onPrint();
    }
  }, [onPrint]);

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(2)} kg`;
  };

  const orderNumber = order.orderNumber ? order.orderNumber.toString() : '1';
  
  const invoiceTypeText = order.fullInvoice ? 'Nota Cheia' : 'Meia Nota';
  
  const halfInvoiceText = !order.fullInvoice && order.halfInvoicePercentage ? 
    `(${order.halfInvoicePercentage}%)` : '';
    
  let totalOrderWeight = 0;
  let totalVolumes = 0;

  order.items.forEach(item => {
    const itemWeight = (item.quantity || 0) * (item.product?.weight || 0);
    totalOrderWeight += itemWeight;
    totalVolumes += (item.quantity || 0);
  });

  return (
    <div className="print-container">
      {/* Header with logo and company info */}
      <div className="print-header">
        <div className="print-header-logo">
          <img src="/lovable-uploads/68daf61d-816f-4f86-8b3f-4f0970296cf0.png" width="150" height="60" style={{ objectFit: 'contain' }} alt="Ferplas Logo" />
        </div>
        <div className="print-header-company">
          <p className="font-bold text-base">{companyInfo.name}</p>
          <p>CNPJ: {companyInfo.document} | IE: {companyInfo.stateRegistration}</p>
          <p>{companyInfo.address} - {companyInfo.city}/{companyInfo.state} - {companyInfo.zipCode}</p>
          <p>Tel: {companyInfo.phone} | {companyInfo.email}</p>
          {companyInfo.website && <p>{companyInfo.website}</p>}
        </div>
      </div>

      {/* Order title */}
      <div className="print-title">
        <h1>PEDIDO #{orderNumber}</h1>
        <p>Emitido em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
      </div>

      {/* Customer and order info cards */}
      <div className="print-grid">
        <div className="print-card">
          <div className="print-card-title">Cliente</div>
          <div className="print-card-content">
            <p className="font-semibold">{order.customer.companyName}</p>
            <p>CNPJ/CPF: {order.customer.document}</p>
            {order.customer.stateRegistration && (
              <p>IE: {order.customer.stateRegistration}</p>
            )}
            <p>{order.customer.street}, {order.customer.number} {order.customer.complement && `- ${order.customer.complement}`}</p>
            {order.customer.neighborhood && (
              <p>Bairro: {order.customer.neighborhood}</p>
            )}
            <p>{order.customer.city}/{order.customer.state} - {order.customer.zipCode}</p>
            <p>Tel: {order.customer.phone}</p>
            {order.customer.whatsapp && (
              <p>WhatsApp: {order.customer.whatsapp}</p>
            )}
          </div>
        </div>
        
        <div className="print-card">
          <div className="print-card-title">Dados do Pedido</div>
          <div className="print-card-content">
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
            <p><span className="font-semibold">Substituição Tributária:</span> {order.taxSubstitution ? 'Sim' : 'Não'}</p>
          </div>
        </div>
      </div>

      {/* Order items table */}
      <div className="print-card">
        <div className="print-card-title">Itens do Pedido</div>
        <table className="print-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th className="align-right">Preço Unitário</th>
              <th className="align-center">Desc. Total (%)</th>
              <th className="align-right">Preço Final</th>
              {order.items.some(item => (item?.taxSubstitutionValue || 0) > 0) && (
                <th className="align-right">ST</th>
              )}
              {order.items.some(item => (item?.ipiValue || 0) > 0) && (
                <th className="align-right">IPI</th>
              )}
              <th className="align-right">Total c/ Impostos</th>
              <th className="align-center">Qtd. Volumes</th>
              <th className="align-center">Total Unidades</th>
              <th className="align-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => {
              const totalUnits = (item.quantity || 0) * (item.product?.quantityPerVolume || 1);
              return (
                <tr key={item?.id || `item-${index}`}>
                  <td>{item?.product?.name || `Produto ${index + 1}`}</td>
                  <td className="align-right">{formatCurrency((item as any).listPrice || item?.product?.listPrice || 0)}</td>
                  <td className="align-center">{item?.totalDiscountPercentage || item?.discount || 0}%</td>
                  <td className="align-right">{formatCurrency(item?.finalPrice || 0)}</td>
                  {order.items.some(i => (i?.taxSubstitutionValue || 0) > 0) && (
                    <td className="align-right">{formatCurrency(item?.taxSubstitutionValue || 0)}</td>
                  )}
                  {order.items.some(i => (i?.ipiValue || 0) > 0) && (
                    <td className="align-right">{formatCurrency(item?.ipiValue || 0)}</td>
                  )}
                  <td className="align-right">{formatCurrency(item?.totalWithTaxes || 0)}</td>
                  <td className="align-center">{item?.quantity || 0}</td>
                  <td className="align-center">{totalUnits}</td>
                  <td className="align-right">{formatCurrency(item?.subtotal || 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Financial summary and delivery info */}
      <div className="print-grid">
        <div className="print-card">
          <div className="print-card-title">Resumo Financeiro</div>
          <table className="print-financial-summary">
            <tbody>
              <tr>
                <td>Total dos Produtos:</td>
                <td className="align-right font-medium">{formatCurrency(order.subtotal)}</td>
              </tr>
              <tr>
                <td>Descontos:</td>
                <td className="align-right text-red font-medium">-{formatCurrency(order.totalDiscount || 0)}</td>
              </tr>
              <tr>
                <td>Subtotal Pedido:</td>
                <td className="align-right font-medium">{formatCurrency(order.subtotal - (order.totalDiscount || 0))}</td>
              </tr>
              {order.taxSubstitution && (
                <tr>
                  <td>Substituição Tributária:</td>
                  <td className="align-right text-orange font-medium">
                    +{formatCurrency(order.items.reduce((sum, item) => sum + (item.taxSubstitutionValue || 0), 0))}
                  </td>
                </tr>
              )}
              {order.withIPI && (
                <tr>
                  <td>IPI:</td>
                  <td className="align-right text-blue font-medium">+{formatCurrency(order.ipiValue || 0)}</td>
                </tr>
              )}
              {order.deliveryFee && order.deliveryFee > 0 && (
                <tr>
                  <td>Taxa de Entrega:</td>
                  <td className="align-right font-medium">{formatCurrency(order.deliveryFee)}</td>
                </tr>
              )}
              <tr className="summary-total">
                <td className="font-bold">Total:</td>
                <td className="align-right font-bold">{formatCurrency(order.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="print-card">
          <div className="print-card-title">Entrega</div>
          <div className="print-card-content">
            <p><span className="font-semibold">Tipo:</span> {order.shipping === 'delivery' ? 'Entrega' : 'Retirada'}</p>
            
            {transportCompanyName && (
              <p><span className="font-semibold">Transportadora:</span> {transportCompanyName}</p>
            )}
            
            {order.shipping === 'delivery' && order.deliveryLocation && (
              <p><span className="font-semibold">Região:</span> {order.deliveryLocation === 'capital' ? 'Capital' : 'Interior'}</p>
            )}
            
            {order.shipping === 'delivery' && order.deliveryFee && order.deliveryFee > 0 && (
              <p><span className="font-semibold">Taxa de Entrega:</span> {formatCurrency(order.deliveryFee)}</p>
            )}
            
            <p><span className="font-semibold">Peso Total do Pedido:</span> {formatWeight(totalOrderWeight)}</p>
            <p><span className="font-semibold">Total de Volumes:</span> {totalVolumes}</p>
          </div>
        </div>
      </div>

      {/* Notes section */}
      {order.notes && (
        <div className="print-card">
          <div className="print-card-title">Observações</div>
          <div className="print-notes">{order.notes}</div>
        </div>
      )}

      {/* Footer */}
      <div className="print-footer">
        <p>Este documento não possui valor fiscal. Para mais informações entre em contato conosco.</p>
      </div>
    </div>
  );
};

export default PrintableOrder;
