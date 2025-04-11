
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useOrders } from '@/context/OrderContext';
import { useOrderData } from '@/hooks/use-order-data';
import { useCompany } from '@/context/CompanyContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Printer, ArrowLeft, Edit } from 'lucide-react';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/utils/formatters';
import PageContainer from '@/components/layout/PageContainer';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getOrderById } = useOrders();
  const { companyInfo } = useCompany();
  const { order, isLoading, error, fetchOrderData } = useOrderData(id);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (error) {
      console.error("Error fetching order:", error);
    }
  }, [error]);

  const handlePrint = () => {
    setIsPrinting(true);
    const printContent = renderPrintableOrderHTML(order, companyInfo);

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(`
        <html>
          <head>
            <title>Pedido #${order?.orderNumber || '1'}</title>
            <style>
              @media print {
                body {
                  font-size: 10px;
                }
                /* Add more print-specific styles here */
              }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
          setIsPrinting(false);
        };
      };
    } else {
      console.error("Failed to open print window!");
      setIsPrinting(false);
    }
  };

  const renderPrintableOrderHTML = (order: any, companyInfo: any) => {
    // Determine invoice type text based on fullInvoice flag
    const invoiceTypeText = order.fullInvoice ? 'Nota Cheia' : 'Meia Nota';
    
    // Show percentage only if it's a half invoice
    const halfInvoiceText = !order.fullInvoice && order.halfInvoicePercentage ? 
      `(${order.halfInvoicePercentage}%)` : '';
      
    // Calculate tax substitution value if applicable
    let taxSubstitutionValue = 0;
    if (order.taxSubstitution) {
      // Using 7.8% which is the standard tax substitution rate in the system
      taxSubstitutionValue = (7.8 / 100) * order.subtotal;
    }
    
    // Calculate IPI if applicable
    const ipiValue = (order.withIPI || order.with_ipi) ? (order.ipiValue || order.ipi_value || 0) : 0;

    // Calculate total weight and volumes
    let totalWeight = 0;
    let totalVolumes = 0;
    
    if (order.items && order.items.length > 0) {
      order.items.forEach((item: any) => {
        totalWeight += (item.quantity || 0) * (item.product?.weight || 0);
        totalVolumes += (item.quantity || 0);
      });
    }
    
    return `
      <div style="max-width: 800px; margin: 0 auto; padding: 12px; font-family: Arial, sans-serif; font-size: 11px;">
        <!-- Company header - more compact -->
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 8px;">
          <div>
            <img src="/lovable-uploads/68daf61d-816f-4f86-8b3f-4f0970296cf0.png" width="150" height="60" style="object-fit: contain;" alt="Ferplas Logo">
          </div>
          <div style="text-align: right; font-size: 11px;">
            <p style="font-weight: bold; font-size: 14px; margin-bottom: 2px; margin-top: 0px;">${companyInfo.name || 'Ferplas Indústria e Comércio'}</p>
            <p style="margin: 2px 0;">CNPJ: ${companyInfo.document || '00.000.000/0000-00'} | IE: ${companyInfo.stateRegistration || '000.000.000.000'}</p>
            <p style="margin: 2px 0;">${companyInfo.address || 'Av. Principal, 1234'} - ${companyInfo.city || 'São Paulo'}/${companyInfo.state || 'SP'} - ${companyInfo.zipCode || '00000-000'}</p>
            <p style="margin: 2px 0;">Tel: ${companyInfo.phone || '(00) 0000-0000'} | ${companyInfo.email || 'contato@ferplas.com.br'}</p>
            ${companyInfo.website ? `<p style="margin: 2px 0;">${companyInfo.website}</p>` : ''}
          </div>
        </div>
        
        <!-- Order title -->
        <div style="text-align: center; margin-bottom: 8px;">
          <h1 style="font-size: 16px; font-weight: bold; border: 1px solid #ddd; display: inline-block; padding: 4px 12px; margin: 4px 0;">
            PEDIDO #${order.orderNumber || '1'}
          </h1>
          <p style="font-size: 10px; margin: 2px 0;">
            Emitido em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        
        <!-- Customer and order info -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
          <div style="border: 1px solid #ddd; border-radius: 4px; padding: 8px;">
            <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Cliente</h2>
            <p style="font-weight: 600; margin: 2px 0;">${order.customer?.companyName || 'Cliente não identificado'}</p>
            <p style="margin: 2px 0;">CNPJ/CPF: ${order.customer?.document || 'N/A'}</p>
            ${(order.customer?.stateRegistration) ? 
              `<p style="margin: 2px 0;">IE: ${order.customer?.stateRegistration}</p>` : ''}
            <p style="margin: 2px 0;">${order.customer?.street || ''}, ${order.customer?.number || ''} ${order.customer?.complement ? `- ${order.customer.complement}` : ''}</p>
            ${(order.customer?.neighborhood) ? 
              `<p style="margin: 2px 0;">Bairro: ${order.customer?.neighborhood}</p>` : ''}
            <p style="margin: 2px 0;">${order.customer?.city || 'N/A'}/${order.customer?.state || 'N/A'} - ${order.customer?.zipCode || 'N/A'}</p>
            <p style="margin: 2px 0;">Tel: ${order.customer?.phone || 'N/A'}</p>
            ${(order.customer?.whatsapp) ? 
              `<p style="margin: 2px 0;">WhatsApp: ${order.customer?.whatsapp}</p>` : ''}
          </div>
          
          <div style="border: 1px solid #ddd; border-radius: 4px; padding: 8px;">
            <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Dados do Pedido</h2>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Data:</span> ${format(new Date(order.createdAt || new Date()), "dd/MM/yyyy", { locale: ptBR })}</p>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Vendedor:</span> ${order.user?.name || 'Não informado'}</p>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Status:</span> ${
              order.status === 'pending' ? 'Pendente' : 
              order.status === 'confirmed' ? 'Confirmado' : 
              order.status === 'invoiced' ? 'Faturado' : 
              order.status === 'completed' ? 'Concluído' : 'Cancelado'
            }</p>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Pagamento:</span> ${order.paymentMethod === 'cash' ? 'À Vista' : 'A Prazo'}</p>
            ${order.paymentMethod === 'credit' && order.paymentTerms ? 
              `<p style="margin: 2px 0;"><span style="font-weight: 600;">Prazos:</span> ${order.paymentTerms}</p>` : ''}
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Tipo de Nota:</span> ${invoiceTypeText} ${halfInvoiceText}</p>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Substituição Tributária:</span> ${order.taxSubstitution ? 'Sim' : 'Não'}</p>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">IPI:</span> ${order.withIPI ? 'Sim' : 'Não'}</p>
          </div>
        </div>
        
        <!-- Order items -->
        <div style="margin-bottom: 8px;">
          <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Itens do Pedido</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #ddd; padding: 3px; text-align: left;">Produto</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: right;">Preço</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: center;">Desc.</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: right;">Final</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: center;">Qtd.</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: center;">Unid. Total</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: center;">Peso Total</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map((item: any, index: number) => {
                const totalUnits = (item.quantity || 0) * (item.product?.quantityPerVolume || 1);
                const totalWeight = (item.quantity || 0) * (item.product?.weight || 0);
                
                return `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 3px;">${item?.product?.name || `Produto ${index + 1}`}</td>
                  <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">
                    ${formatCurrency(item?.listPrice || item?.product?.listPrice || 0)}
                  </td>
                  <td style="border: 1px solid #ddd; padding: 3px; text-align: center;">${item?.discount || 0}%</td>
                  <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${formatCurrency(item?.finalPrice || 0)}</td>
                  <td style="border: 1px solid #ddd; padding: 3px; text-align: center;">${item?.quantity || 0}</td>
                  <td style="border: 1px solid #ddd; padding: 3px; text-align: center;">${totalUnits}</td>
                  <td style="border: 1px solid #ddd; padding: 3px; text-align: center;">${totalWeight.toFixed(2)} kg</td>
                  <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${formatCurrency(item?.subtotal || 0)}</td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- Two column layout for delivery and financial summary -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
          <!-- Delivery info -->
          <div>
            <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Entrega</h2>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Tipo:</span> ${order.shipping === 'delivery' ? 'Entrega' : 'Retirada'}</p>
            ${order.shipping === 'delivery' && order.deliveryLocation ? 
              `<p style="margin: 2px 0;"><span style="font-weight: 600;">Região:</span> ${order.deliveryLocation === 'capital' ? 'Capital' : 'Interior'}</p>` : ''}
            ${order.shipping === 'delivery' && order.deliveryFee && order.deliveryFee > 0 ? 
              `<p style="margin: 2px 0;"><span style="font-weight: 600;">Taxa:</span> ${formatCurrency(order.deliveryFee)}</p>` : ''}
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Peso Total:</span> ${totalWeight.toFixed(2)} kg</p>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Total de Volumes:</span> ${totalVolumes}</p>
          </div>
          
          <!-- Financial summary -->
          <div>
            <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Resumo Financeiro</h2>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 2px 0;">Subtotal:</td>
                <td style="padding: 2px 0; text-align: right; font-weight: 500;">${formatCurrency(order.subtotal)}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0;">Descontos:</td>
                <td style="padding: 2px 0; text-align: right; color: #dc2626; font-weight: 500;">
                  -${formatCurrency(order.totalDiscount || 0)}
                </td>
              </tr>
              ${order.taxSubstitution ? `
                <tr>
                  <td style="padding: 2px 0;">Substituição Tributária (7.8%):</td>
                  <td style="padding: 2px 0; text-align: right; color: #ea580c; font-weight: 500;">
                    +${formatCurrency(taxSubstitutionValue)}
                  </td>
                </tr>
              ` : ''}
              ${order.withIPI && ipiValue > 0 ? `
                <tr>
                  <td style="padding: 2px 0;">IPI:</td>
                  <td style="padding: 2px 0; text-align: right; color: #ea580c; font-weight: 500;">
                    +${formatCurrency(ipiValue)}
                  </td>
                </tr>
              ` : ''}
              ${order.deliveryFee && order.deliveryFee > 0 ? `
                <tr>
                  <td style="padding: 2px 0;">Taxa de Entrega:</td>
                  <td style="padding: 2px 0; text-align: right; font-weight: 500;">${formatCurrency(order.deliveryFee)}</td>
                </tr>
              ` : ''}
              <tr style="border-top: 1px solid #ddd;">
                <td style="padding: 3px 0; font-weight: bold;">Total:</td>
                <td style="padding: 3px 0; text-align: right; font-weight: bold;">${formatCurrency(order.total)}</td>
              </tr>
            </table>
          </div>
        </div>
        
        ${(order.notes) ? `
          <div style="margin-bottom: 8px;">
            <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Observações</h2>
            <p style="border: 1px solid #ddd; padding: 4px; background-color: #f9f9f9; margin: 0;">${order.notes}</p>
          </div>
        ` : ''}
        
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #666;">
          <p style="margin: 0;">Este documento não possui valor fiscal. Para mais informações entre em contato conosco.</p>
        </div>
      </div>
    `;
  };

  // Calculate total weight for the entire order
  const calculateTotalWeight = () => {
    if (!order || !order.items || order.items.length === 0) return 0;
    
    let totalWeight = 0;
    order.items.forEach((item) => {
      totalWeight += (item.quantity || 0) * (item.product?.weight || 0);
    });
    return totalWeight.toFixed(2);
  };

  // Calculate total volumes
  const calculateTotalVolumes = () => {
    if (!order || !order.items || order.items.length === 0) return 0;
    
    let totalVolumes = 0;
    order.items.forEach((item) => {
      totalVolumes += (item.quantity || 0);
    });
    return totalVolumes;
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
    <PageContainer>
      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Carregando detalhes do pedido...</p>}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
          {order && (
            <>
              <div className="mb-4 flex justify-between items-center">
                <div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/orders')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para a lista
                  </Button>
                </div>
                <div>
                  <Button variant="secondary" size="sm" onClick={handlePrint} disabled={isPrinting}>
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir
                  </Button>
                  <Button variant="default" size="sm" onClick={() => navigate(`/orders/${id}/edit`)} className="ml-2">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Número do Pedido:</strong> {order.orderNumber}
                </div>
                <div>
                  <strong>Status:</strong> <OrderStatusBadge status={order.status} />
                </div>
                <div>
                  <strong>Data do Pedido:</strong> {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
                <div>
                  <strong>Cliente:</strong> {order.customer?.companyName || 'Cliente não identificado'}
                </div>
              </div>

              <Separator className="my-4" />

              <div>
                <h3>Itens do Pedido</h3>
                {order.items && order.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Produto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantidade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unidades Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Peso Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Preço Unitário
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {order.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {item.product?.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {calculateTotalUnits(item)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {calculateItemWeight(item)} kg
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {formatCurrency(item.finalPrice)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {formatCurrency(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>Nenhum item neste pedido.</p>
                )}
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3>Entrega</h3>
                  <p><strong>Tipo:</strong> {order.shipping === 'delivery' ? 'Entrega' : 'Retirada'}</p>
                  {order.shipping === 'delivery' && order.deliveryLocation && (
                    <p><strong>Região:</strong> {order.deliveryLocation === 'capital' ? 'Capital' : 'Interior'}</p>
                  )}
                  {order.shipping === 'delivery' && order.deliveryFee && order.deliveryFee > 0 && (
                    <p><strong>Taxa de Entrega:</strong> {formatCurrency(order.deliveryFee)}</p>
                  )}
                  <p><strong>Peso Total do Pedido:</strong> {calculateTotalWeight()} kg</p>
                  <p><strong>Total de Volumes:</strong> {calculateTotalVolumes()}</p>
                </div>
                <div>
                  <h3>Resumo Financeiro</h3>
                  <p><strong>Subtotal:</strong> {formatCurrency(order.subtotal)}</p>
                  <p><strong>Desconto:</strong> {formatCurrency(order.totalDiscount || 0)}</p>
                  <p><strong>Total:</strong> {formatCurrency(order.total)}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default OrderDetail;

