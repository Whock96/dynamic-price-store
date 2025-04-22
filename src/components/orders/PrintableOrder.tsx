import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Order } from '@/types/types';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/formatters';

interface PrintableOrderProps {
  order: Order;
  companyInfo: any;
  onPrint?: () => void;
}

const PrintableOrder: React.FC<PrintableOrderProps> = ({ order, companyInfo, onPrint }) => {
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
    const timer = setTimeout(() => {
      if (onPrint) {
        console.log('Triggering print callback');
        onPrint();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [onPrint]);

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(2)} kg`;
  };

  const formatCubicVolume = (volume: number) => {
    return `${volume.toFixed(3)} m³`;
  };

  const orderNumber = order.orderNumber ? order.orderNumber.toString() : '1';
  
  const invoiceTypeText = order.fullInvoice ? 'Nota Cheia' : 'Meia Nota';
  
  const halfInvoiceText = !order.fullInvoice && order.halfInvoicePercentage ? 
    `(${order.halfInvoicePercentage}%)` : '';
    
  let totalOrderWeight = 0;
  let totalVolumes = 0;
  let totalCubicVolume = 0;

  order.items.forEach(item => {
    totalOrderWeight += Number(item.totalWeight || 0);
    totalVolumes += Number(item.quantity || 0);
    totalCubicVolume += Number(item.totalCubicVolume || 0);
  });

  // Usar o valor do IPI diretamente da ordem, não recalcular
  const totalIpiValue = order.ipiValue || 0;

  return (
    <div className="print-container">
      <div className="print-header">
        <div className="print-header-logo">
          <img src="/lovable-uploads/68daf61d-816f-4f86-8b3f-4f0970296cf0.png" alt="Logo" />
        </div>
        <div className="print-header-company">
          <p className="company-name">{companyInfo.name}</p>
          <p>CNPJ: {companyInfo.document} | IE: {companyInfo.stateRegistration}</p>
          <p>{companyInfo.address} - {companyInfo.city}/{companyInfo.state} - {companyInfo.zipCode}</p>
          <p>Tel: {companyInfo.phone} | {companyInfo.email}</p>
          {companyInfo.website && <p>{companyInfo.website}</p>}
        </div>
      </div>

      <div className="print-title">
        <h1>PEDIDO #{orderNumber}</h1>
        <p>Emitido em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
      </div>

      <div className="print-grid">
        <div className="print-card">
          <div className="print-card-title">Cliente</div>
          <div className="print-card-content">
            <p className="font-semibold">{order.customer.companyName}</p>
            <p>CNPJ/CPF: {order.customer.document}</p>
            {order.customer.stateRegistration && <p>IE: {order.customer.stateRegistration}</p>}
            <p>{order.customer.street}, {order.customer.number} {order.customer.complement && `- ${order.customer.complement}`}</p>
            <p>{order.customer.city}/{order.customer.state} - {order.customer.zipCode}</p>
            <p>Tel: {order.customer.phone}</p>
            {order.customer.whatsapp && <p>WhatsApp: {order.customer.whatsapp}</p>}
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
            <p><span className="font-semibold">Forma de Pagamento:</span> {order.paymentMethod === 'cash' ? 'À Vista' : 'A Prazo'}</p>
            {order.paymentMethod === 'credit' && order.paymentTerms && (
              <p><span className="font-semibold">Prazos de Pagamento:</span> {order.paymentTerms}</p>
            )}
            <p><span className="font-semibold">Tipo de Nota:</span> {invoiceTypeText}</p>
            {!order.fullInvoice && order.halfInvoicePercentage && (
              <p><span className="font-semibold">Percentual da Nota:</span> {order.halfInvoicePercentage}%</p>
            )}
            {!order.fullInvoice && order.halfInvoiceType && (
              <p><span className="font-semibold">Tipo de Meia Nota:</span> {order.halfInvoiceType === 'quantity' ? 'Na Quantidade' : 'No Preço'}</p>
            )}
            <p><span className="font-semibold">Substituição Tributária:</span> {order.taxSubstitution ? 'Sim' : 'Não'}</p>
            <p><span className="font-semibold">IPI:</span> {order.withIPI ? 'Sim' : 'Não'}</p>
            <p><span className="font-semibold">SUFRAMA:</span> {order.suframa ? 'Sim' : 'Não'}</p>
          </div>
        </div>
      </div>

      <div className="print-card">
        <div className="print-card-title">Itens do Pedido</div>
        <table className="print-table">
          <thead>
            <tr>
              <th style={{width: '25%'}}>Produto</th>
              <th className="align-right" style={{width: '12%'}}>Preço Unit.</th>
              <th className="align-center" style={{width: '8%'}}>Desc.</th>
              <th className="align-right" style={{width: '12%'}}>Preço Final</th>
              {order.taxSubstitution && (
                <th className="align-right" style={{width: '8%'}}>ST</th>
              )}
              {order.withIPI && (
                <th className="align-right" style={{width: '8%'}}>IPI</th>
              )}
              <th className="align-right" style={{width: '12%'}}>Total</th>
              <th className="align-center" style={{width: '7%'}}>Qtd.</th>
              <th className="align-center" style={{width: '8%'}}>Unid.</th>
              <th className="align-right" style={{width: '12%'}}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={item?.id || `item-${index}`}>
                <td>{item?.product?.name || `Produto ${index + 1}`}</td>
                <td className="align-right">{formatCurrency((item as any).listPrice || item?.product?.listPrice || 0)}</td>
                <td className="align-center">{item?.totalDiscountPercentage || item?.discount || 0}%</td>
                <td className="align-right">{formatCurrency(item?.finalPrice || 0)}</td>
                {order.taxSubstitution && (
                  <td className="align-right">{formatCurrency(item?.taxSubstitutionValue || 0)}</td>
                )}
                {order.withIPI && (
                  <td className="align-right">{formatCurrency(item?.ipiValue || 0)}</td>
                )}
                <td className="align-right">{formatCurrency(item?.totalWithTaxes || 0)}</td>
                <td className="align-center">{item?.quantity || 0}</td>
                <td className="align-center">{(item.quantity || 0) * (item.product?.quantityPerVolume || 1)}</td>
                <td className="align-right">{formatCurrency(item?.subtotal || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="print-grid">
        <div className="print-card">
          <div className="print-card-title">Resumo Financeiro</div>
          <table className="print-financial-summary">
            <tbody>
              <tr>
                <td>Total dos Produtos:</td>
                <td className="align-right font-medium">{formatCurrency(order.productsTotal || 0)}</td>
              </tr>
              <tr>
                <td>Descontos:</td>
                <td className="align-right text-red">-{formatCurrency(order.totalDiscount || 0)}</td>
              </tr>
              <tr>
                <td>Subtotal do Pedido:</td>
                <td className="align-right font-medium">{formatCurrency(order.subtotal || 0)}</td>
              </tr>
              {order.taxSubstitution && (
                <tr>
                  <td>Substituição Tributária:</td>
                  <td className="align-right text-orange">
                    +{formatCurrency(order.taxSubstitutionTotal || 0)}
                  </td>
                </tr>
              )}
              {order.withIPI && (
                <tr>
                  <td>IPI:</td>
                  <td className="align-right text-blue">+{formatCurrency(order.ipiValue || 0)}</td>
                </tr>
              )}
              {order.deliveryFee > 0 && (
                <tr>
                  <td>Taxa de Entrega:</td>
                  <td className="align-right">{formatCurrency(order.deliveryFee || 0)}</td>
                </tr>
              )}
              <tr className="summary-total">
                <td>Total:</td>
                <td className="align-right">{formatCurrency(order.total || 0)}</td>
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
            
            {order.shipping === 'delivery' && order.deliveryFee > 0 && (
              <p><span className="font-semibold">Taxa de Entrega:</span> {formatCurrency(order.deliveryFee)}</p>
            )}
            
            <p><span className="font-semibold">Peso Total do Pedido:</span> {formatWeight(totalOrderWeight)}</p>
            <p><span className="font-semibold">Total de Volumes:</span> {totalVolumes}</p>
            <p><span className="font-semibold">Cubagem Total:</span> {formatCubicVolume(totalCubicVolume)}</p>
          </div>
        </div>
      </div>

      {order.notes && (
        <div className="print-notes">
          <div className="print-card-title">Observações</div>
          <p>{order.notes}</p>
        </div>
      )}

      <div className="print-footer">
        <p>Este documento não possui valor fiscal. Para mais informações entre em contato conosco.</p>
      </div>
    </div>
  );
};

export default PrintableOrder;
