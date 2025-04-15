
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Printer, Truck, Package, 
  Calendar, User, Phone, Mail, MapPin, Receipt, ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useOrders } from '@/context/OrderContext';
import { useOrderData } from '@/hooks/use-order-data';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import PrintableOrder from '@/components/orders/PrintableOrder';
import PrintableInvoice from '@/components/orders/PrintableInvoice';
import { supabase } from '@/integrations/supabase/client';

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getOrderById } = useOrders();
  const { order: supabaseOrder, isLoading: isSupabaseLoading } = useOrderData(id);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transportCompany, setTransportCompany] = useState<any>(null);
  const [isLoadingTransport, setIsLoadingTransport] = useState(false);
  const [totalOrderWeight, setTotalOrderWeight] = useState(0);
  const [totalVolumes, setTotalVolumes] = useState(0);

  const formatPhoneNumber = (phone: string | undefined | null) => {
    if (!phone) return 'Não informado';
    
    const numericOnly = phone.replace(/\D/g, '');
    
    if (numericOnly.length === 11) {
      return numericOnly.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numericOnly.length === 10) {
      return numericOnly.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return phone;
  };

  useEffect(() => {
    if (id) {
      console.log(`Fetching order with ID: ${id}`);
      
      const contextOrder = getOrderById(id);
      
      if (contextOrder) {
        console.log(`Found order in context:`, contextOrder);
        setOrder(contextOrder);
        setLoading(false);
        
        if (contextOrder.transportCompanyId) {
          fetchTransportCompany(contextOrder.transportCompanyId);
        }
        
        calculateOrderTotals(contextOrder.items);
      } else if (supabaseOrder) {
        console.log(`Found order in Supabase:`, supabaseOrder);
        setOrder(supabaseOrder);
        setLoading(false);
        
        if (supabaseOrder.transportCompanyId) {
          fetchTransportCompany(supabaseOrder.transportCompanyId);
        }
        
        calculateOrderTotals(supabaseOrder.items);
      } else if (!isSupabaseLoading) {
        console.error(`Order with ID ${id} not found`);
        toast.error("Pedido não encontrado");
        setLoading(false);
      }
    }
  }, [id, getOrderById, supabaseOrder, isSupabaseLoading]);

  const calculateOrderTotals = (items: any[]) => {
    if (!items || items.length === 0) {
      setTotalOrderWeight(0);
      setTotalVolumes(0);
      return;
    }

    let weight = 0;
    let volumes = 0;

    items.forEach(item => {
      const itemWeight = (item.quantity || 0) * (item.product?.weight || 0);
      weight += itemWeight;
      
      volumes += (item.quantity || 0);
    });

    setTotalOrderWeight(weight);
    setTotalVolumes(volumes);
  };

  const fetchTransportCompany = async (transportCompanyId: string) => {
    if (!transportCompanyId || transportCompanyId === 'none') return;
    
    setIsLoadingTransport(true);
    try {
      const { data, error } = await supabase
        .from('transport_companies')
        .select('*')
        .eq('id', transportCompanyId)
        .single();
        
      if (error) throw error;
      
      setTransportCompany(data);
    } catch (error) {
      console.error('Error fetching transport company:', error);
    } finally {
      setIsLoadingTransport(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(2)} kg`;
  };

  const handlePrintOrder = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Pedido #${order.orderNumber || '1'} - Impressão</title>
          <style>
            body { font-family: Arial, sans-serif; }
            @media print {
              body { 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important;
                font-size: 11px;
              }
            }
            @page { size: A4; margin: 8mm; }
          </style>
          <link rel="stylesheet" href="${window.location.origin}/src/index.css">
        </head>
        <body>
          <div id="printable-content"></div>
          <script>
            window.onload = function() {
              setTimeout(() => window.print(), 1000);
            };
          </script>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      const mountNode = printWindow.document.getElementById('printable-content');
      if (mountNode) {
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100vh';
        iframe.style.border = 'none';
        
        mountNode.appendChild(iframe);
        
        iframe.onload = function() {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            printWindow.document.title = `Pedido #${order.orderNumber || '1'} - Impressão`;
            
            const companyInfo = JSON.parse(localStorage.getItem('ferplas-company-info') || '{}');
            iframeDoc.body.innerHTML = renderPrintableOrderHTML(order, companyInfo);
          }
        };
        
        iframe.src = 'about:blank';
      }
    } else {
      toast.error("Não foi possível abrir a janela de impressão. Verifique se o seu navegador está bloqueando pop-ups.");
    }
  };

  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Faturamento #${order.orderNumber || '1'} - Impressão</title>
          <style>
            body { font-family: Arial, sans-serif; }
            @media print {
              body { 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important;
                font-size: 11px;
              }
            }
            @page { size: A4; margin: 8mm; }
          </style>
          <link rel="stylesheet" href="${window.location.origin}/src/index.css">
        </head>
        <body>
          <div id="printable-content"></div>
          <script>
            window.onload = function() {
              setTimeout(() => window.print(), 1000);
            };
          </script>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      const mountNode = printWindow.document.getElementById('printable-content');
      if (mountNode) {
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100vh';
        iframe.style.border = 'none';
        
        mountNode.appendChild(iframe);
        
        iframe.onload = function() {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            printWindow.document.title = `Faturamento #${order.orderNumber || '1'} - Impressão`;
            
            const companyInfo = JSON.parse(localStorage.getItem('ferplas-company-info') || '{}');
            iframeDoc.body.innerHTML = `<div id="invoice-root"></div>`;
            
            const invoiceElement = document.createElement('div');
            invoiceElement.innerHTML = '<div id="invoice-content"></div>';
            iframeDoc.getElementById('invoice-root')?.appendChild(invoiceElement);
            
            const invoiceRoot = iframeDoc.getElementById('invoice-content');
            if (invoiceRoot) {
              const invoiceComponent = document.createElement('div');
              invoiceComponent.innerHTML = renderPrintableInvoiceHTML(order, companyInfo);
              invoiceRoot.appendChild(invoiceComponent);
            }
          }
        };
        
        iframe.src = 'about:blank';
      }
    } else {
      toast.error("Não foi possível abrir a janela de impressão. Verifique se o seu navegador está bloqueando pop-ups.");
    }
  };

  const renderPrintableInvoiceHTML = (order: any, companyInfo: any) => {
    const invoiceTypeText = order.fullInvoice ? 'Nota Cheia' : 'Meia Nota';
    const halfInvoiceText = !order.fullInvoice && order.halfInvoicePercentage ? 
      `(${order.halfInvoicePercentage}%)` : '';
    
    const halfInvoicePercentage = order.halfInvoicePercentage || 50;
    const halfInvoiceType = order.halfInvoiceType || 'price';
      
    const subtotalAfterDiscount = order.subtotal - (order.totalDiscount || 0);
    const taxSubstitutionValue = order.taxSubstitution ? (7.8 / 100) * order.subtotal : 0;
    const ipiValue = (order.withIPI || order.with_ipi) ? (order.ipiValue || order.ipi_value || 0) : 0;
    const deliveryFee = order.deliveryFee || order.delivery_fee || 0;
    
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
    
    const totalWithInvoice = calculateTotalWithInvoice(
      subtotalAfterDiscount,
      halfInvoicePercentage,
      taxSubstitutionValue,
      ipiValue,
      deliveryFee
    );
    
    const totalWithoutInvoice = calculateTotalWithoutInvoice(subtotalAfterDiscount, halfInvoicePercentage);
    
    return `
      <div style="max-width: 800px; margin: 0 auto; padding: 12px; font-family: Arial, sans-serif; font-size: 11px;">
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
        
        <div style="text-align: center; margin-bottom: 8px;">
          <h1 style="font-size: 16px; font-weight: bold; border: 1px solid #ddd; display: inline-block; padding: 4px 12px; margin: 4px 0;">
            FATURAMENTO DO PEDIDO #${order.orderNumber || order.order_number || '1'}
          </h1>
          <p style="font-size: 10px; margin: 2px 0;">
            Emitido em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
          <div style="border: 1px solid #ddd; border-radius: 4px; padding: 8px;">
            <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Cliente</h2>
            <p style="font-weight: 600; margin: 2px 0;">${order.customer?.companyName || order.customers?.company_name || 'Cliente não identificado'}</p>
            <p style="margin: 2px 0;">CNPJ/CPF: ${order.customer?.document || order.customers?.document || 'N/A'}</p>
            ${(order.customer?.stateRegistration || order.customers?.state_registration) ? 
              `<p style="margin: 2px 0;">IE: ${order.customer?.stateRegistration || order.customers?.state_registration}</p>` : ''}
            <p style="margin: 2px 0;">${order.customer?.street || order.customers?.street || ''}, ${order.customer?.number || order.customers?.number || ''} ${order.customer?.complement ? `- ${order.customer.complement}` : (order.customers?.complement ? `- ${order.customers.complement}` : '')}</p>
            ${(order.customer?.neighborhood || order.customers?.neighborhood) ? 
              `<p style="margin: 2px 0;">Bairro: ${order.customer?.neighborhood || order.customers?.neighborhood}</p>` : ''}
            <p style="margin: 2px 0;">${order.customer?.city || order.customers?.city || 'N/A'}/${order.customer?.state || order.customers?.state || 'N/A'} - ${order.customer?.zipCode || order.customers?.zip_code || 'N/A'}</p>
            <p style="margin: 2px 0;">Tel: ${order.customer?.phone || order.customers?.phone || 'N/A'}</p>
            ${(order.customer?.whatsapp || order.customers?.whatsapp) ? 
              `<p style="margin: 2px 0;">WhatsApp: ${order.customer?.whatsapp || order.customers?.whatsapp}</p>` : ''}
          </div>
          
          <div style="border: 1px solid #ddd; border-radius: 4px; padding: 8px;">
            <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Dados do Pedido</h2>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Data:</span> ${format(new Date(order.createdAt || order.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Vendedor:</span> ${order.user?.name || 'Não informado'}</p>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Status:</span> ${
              order.status === 'pending' ? 'Pendente' : 
              order.status === 'confirmed' ? 'Confirmado' : 
              order.status === 'invoiced' ? 'Faturado' : 
              order.status === 'completed' ? 'Concluído' : 'Cancelado'
            }</p>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Pagamento:</span> ${(order.paymentMethod || order.payment_method) === 'cash' ? 'À Vista' : 'A Prazo'}</p>
            ${(order.paymentMethod || order.payment_method) === 'credit' && (order.paymentTerms || order.payment_terms) ? 
              `<p style="margin: 2px 0;"><span style="font-weight: 600;">Prazos:</span> ${order.paymentTerms || order.payment_terms}</p>` : ''}
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Tipo de Nota:</span> ${invoiceTypeText} ${halfInvoiceText}</p>
            ${!order.fullInvoice ? `<p style="margin: 2px 0;"><span style="font-weight: 600;">Tipo de Meia Nota:</span> ${halfInvoiceType === 'quantity' ? 'Na Quantidade' : 'No Preço'}</p>` : ''}
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Substituição Tributária:</span> ${order.taxSubstitution || order.tax_substitution ? 'Sim' : 'Não'}</p>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">IPI:</span> ${order.withIPI || order.with_ipi ? 'Sim' : 'Não'}</p>
          </div>
        </div>
        
        <div style="margin-bottom: 8px;">
          <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Itens do Pedido</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #ddd; padding: 3px; text-align: left;">Produto</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: right;">Preço Unitário</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: center;">Desc. Total (%)</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: right;">Preço Final</th>
                ${order.items.some((item: any) => (item?.taxSubstitutionValue || 0) > 0) ? 
                  `<th style="border: 1px solid #ddd; padding: 3px; text-align: right;">ST</th>` : ''}
                ${order.items.some((item: any) => (item?.ipiValue || 0) > 0) ? 
                  `<th style="border: 1px solid #ddd; padding: 3px; text-align: right;">IPI</th>` : ''}
                <th style="border: 1px solid #ddd; padding: 3px; text-align: right;">Total c/ Impostos</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: center;">Qtd. Volumes</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: center;">Total Unidades</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map((item: any, index: number) => {
                const totalUnits = (item.quantity || 0) * (item.product?.quantityPerVolume || 1);
                return `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 3px;">${item?.product?.name || `Produto ${index + 1}`}</td>
                    <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${formatCurrency((item as any).listPrice || item?.product?.listPrice || 0)}</td>
                    <td style="border: 1px solid #ddd; padding: 3px; text-align: center;">${item?.totalDiscountPercentage || item?.discount || 0}%</td>
                    <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${formatCurrency(item?.finalPrice || 0)}</td>
                    ${order.items.some((i: any) => (i?.taxSubstitutionValue || 0) > 0) ? 
                      `<td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${formatCurrency(item?.taxSubstitutionValue || 0)}</td>` : ''}
                    ${order.items.some((i: any) => (i?.ipiValue || 0) > 0) ? 
                      `<td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${formatCurrency(item?.ipiValue || 0)}</td>` : ''}
                    <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${formatCurrency(item?.totalWithTaxes || 0)}</td>
                    <td style="border: 1px solid #ddd; padding: 3px; text-align: center;">${item?.quantity || 0}</td>
                    <td style="border: 1px solid #ddd; padding: 3px; text-align: center;">${totalUnits}</td>
                    <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${formatCurrency(item?.subtotal || 0)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
          <div>
            <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Resumo Financeiro</h2>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 2px 0;">Total dos Produtos:</td>
                <td style="padding: 2px 0; text-align: right; font-weight: 500;">${formatCurrency(order.subtotal)}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0;">Descontos:</td>
                <td style="padding: 2px 0; text-align: right; color: #dc2626; font-weight: 500;">-${formatCurrency(order.totalDiscount || order.total_discount || 0)}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0;">Subtotal Pedido:</td>
                <td style="padding: 2px 0; text-align: right; font-weight: 500;">${formatCurrency(order.subtotal - (order.totalDiscount || order.total_discount || 0))}</td>
              </tr>
              ${(order.taxSubstitution || order.tax_substitution) ? `
                <tr>
                  <td style="padding: 2px 0;">Substituição Tributária:</td>
                  <td style="padding: 2px 0; text-align: right; color: #ea580c; font-weight: 500;">
                    +${formatCurrency(order.items.reduce((sum: number, item: any) => sum + (item.taxSubstitutionValue || 0), 0))}
                  </td>
                </tr>
              ` : ''}
              ${(order.withIPI || order.with_ipi) ? `
                <tr>
                  <td style="padding: 2px 0;">IPI:</td>
                  <td style="padding: 2px 0; text-align: right; color: #ea580c; font-weight: 500;">+${formatCurrency(order.ipiValue || order.ipi_value || 0)}</td>
                </tr>
              ` : ''}
              ${(order.deliveryFee || order.delivery_fee) && (order.deliveryFee || order.delivery_fee) > 0 ? `
                <tr>
                  <td style="padding: 2px 0;">Taxa de Entrega:</td>
                  <td style="padding: 2px 0; text-align: right; font-weight: 500;">${formatCurrency(order.deliveryFee || order.delivery_fee)}</td>
                </tr>
              ` : ''}
              <tr style="border-top: 1px solid #ddd;">
                <td style="padding: 3px 0; font-weight: bold;">Total:</td>
                <td style="padding: 3px 0; text-align: right; font-weight: bold;">${formatCurrency(order.total)}</td>
              </tr>
            </table>
          </div>
          
          <div>
            <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Entrega</h2>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Tipo:</span> ${(order.shipping || order.shipping) === 'delivery' ? 'Entrega' : 'Retirada'}</p>
            
            ${transportCompany ? `
              <p style="margin: 2px 0;"><span style="font-weight: 600;">Transportadora:</span> ${transportCompany.name}</p>
            ` : ''}
            
            ${(order.shipping || order.shipping) === 'delivery' && (order.deliveryLocation || order.delivery_location) ? `
              <p style="margin: 2px 0;"><span style="font-weight: 600;">Região:</span> ${(order.deliveryLocation || order.delivery_location) === 'capital' ? 'Capital' : 'Interior'}</p>
            ` : ''}
            
            ${(order.shipping || order.shipping) === 'delivery' && (order.deliveryFee || order.delivery_fee) && (order.deliveryFee || order.delivery_fee) > 0 ? `
              <p style="margin: 2px 0;"><span style="font-weight: 600;">Taxa de Entrega:</span> ${formatCurrency(order.deliveryFee || order.delivery_fee)}</p>
            ` : ''}
            
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Peso Total do Pedido:</span> ${formatWeight(totalOrderWeight)}</p>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Total de Volumes:</span> ${totalVolumes}</p>
          </div>
        </div>
        
        ${(order.notes || order.observations) ? `
          <div style="margin-bottom: 8px;">
            <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Observações</h2>
            <p style="border: 1px solid #ddd; padding: 4px; background-color: #f9f9f9; margin: 0;">${order.notes || order.observations}</p>
          </div>
        ` : ''}
        
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #666;">
          <p style="margin: 0;">Este documento não possui valor fiscal. Para mais informações entre em contato conosco.</p>
        </div>
      </div>
    `;
  };

  const renderPrintableOrderHTML = (order: any, companyInfo: any) => {
    const invoiceTypeText = order.fullInvoice ? 'Nota Cheia' : 'Meia Nota';
    const halfInvoiceText = !order.fullInvoice && order.halfInvoicePercentage ? 
      `(${order.halfInvoicePercentage}%)` : '';
      
    let totalOrderWeight = 0;
    let totalVolumes = 0;

    (order.items || []).forEach((item: any) => {
      const itemWeight = (item.quantity || 0) * (item.product?.weight || 0);
      totalOrderWeight += itemWeight;
      totalVolumes += (item.quantity || 0);
    });
    
    return `
      <div style="max-width: 800px; margin: 0 auto; padding: 12px; font-family: Arial, sans-serif; font-size: 11px;">
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
        
        <div style="text-align: center; margin-bottom: 8px;">
          <h1 style="font-size: 16px; font-weight: bold; border: 1px solid #ddd; display: inline-block; padding: 4px 12px; margin: 4px 0;">
            PEDIDO #${order.orderNumber || order.order_number || '1'}
          </h1>
          <p style="font-size: 10px; margin: 2px 0;">
            Emitido em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
          <div style="border: 1px solid #ddd; border-radius: 4px; padding: 8px;">
            <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Cliente</h2>
            <p style="font-weight: 600; margin: 2px 0;">${order.customer?.companyName || order.customers?.company_name || 'Cliente não identificado'}</p>
            <p style="margin: 2px 0;">CNPJ/CPF: ${order.customer?.document || order.customers?.document || 'N/A'}</p>
            ${(order.customer?.stateRegistration || order.customers?.state_registration) ? 
              `<p style="margin: 2px 0;">IE: ${order.customer?.stateRegistration || order.customers?.state_registration}</p>` : ''}
            <p style="margin: 2px 0;">${order.customer?.street || order.customers?.street || ''}, ${order.customer?.number || order.customers?.number || ''} ${order.customer?.complement ? `- ${order.customer.complement}` : (order.customers?.complement ? `- ${order.customers.complement}` : '')}</p>
            ${(order.customer?.neighborhood || order.customers?.neighborhood) ? 
              `<p style="margin: 2px 0;">Bairro: ${order.customer?.neighborhood || order.customers?.neighborhood}</p>` : ''}
            <p style="margin: 2px 0;">${order.customer?.city || order.customers?.city || 'N/A'}/${order.customer?.state || order.customers?.state || 'N/A'} - ${order.customer?.zipCode || order.customers?.zip_code || 'N/A'}</p>
            <p style="margin: 2px 0;">Tel: ${order.customer?.phone || order.customers?.phone || 'N/A'}</p>
            ${(order.customer?.whatsapp || order.customers?.whatsapp) ? 
              `<p style="margin: 2px 0;">WhatsApp: ${order.customer?.whatsapp || order.customers?.whatsapp}</p>` : ''}
          </div>
          
          <div style="border: 1px solid #ddd; border-radius: 4px; padding: 8px;">
            <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Dados do Pedido</h2>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Data:</span> ${format(new Date(order.createdAt || order.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Vendedor:</span> ${order.user?.name || 'Não informado'}</p>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Status:</span> ${
              order.status === 'pending' ? 'Pendente' : 
              order.status === 'confirmed' ? 'Confirmado' : 
              order.status === 'invoiced' ? 'Faturado' : 
              order.status === 'completed' ? 'Concluído' : 'Cancelado'
            }</p>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Pagamento:</span> ${(order.paymentMethod || order.payment_method) === 'cash' ? 'À Vista' : 'A Prazo'}</p>
            ${(order.paymentMethod || order.payment_method) === 'credit' && (order.paymentTerms || order.payment_terms) ? 
              `<p style="margin: 2px 0;"><span style="font-weight: 600;">Prazos:</span> ${order.paymentTerms || order.payment_terms}</p>` : ''}
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Tipo de Nota:</span> ${invoiceTypeText} ${halfInvoiceText}</p>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Substituição Tributária:</span> ${order.taxSubstitution || order.tax_substitution ? 'Sim' : 'Não'}</p>
          </div>
        </div>
        
        <div style="margin-bottom: 8px;">
          <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Itens do Pedido</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #ddd; padding: 3px; text-align: left;">Produto</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: right;">Preço Unitário</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: center;">Desc. Total (%)</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: right;">Preço Final</th>
                ${order.items.some((item: any) => (item?.taxSubstitutionValue || 0) > 0) ? 
                  `<th style="border: 1px solid #ddd; padding: 3px; text-align: right;">ST</th>` : ''}
                ${order.items.some((item: any) => (item?.ipiValue || 0) > 0) ? 
                  `<th style="border: 1px solid #ddd; padding: 3px; text-align: right;">IPI</th>` : ''}
                <th style="border: 1px solid #ddd; padding: 3px; text-align: right;">Total c/ Impostos</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: center;">Qtd. Volumes</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: center;">Total Unidades</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map((item: any, index: number) => {
                const totalUnits = (item.quantity || 0) * (item.product?.quantityPerVolume || 1);
                return `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 3px;">${item?.product?.name || `Produto ${index + 1}`}</td>
                    <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${formatCurrency((item as any).listPrice || item?.product?.listPrice || 0)}</td>
                    <td style="border: 1px solid #ddd; padding: 3px; text-align: center;">${item?.totalDiscountPercentage || item?.discount || 0}%</td>
                    <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${formatCurrency(item?.finalPrice || 0)}</td>
                    ${order.items.some((i: any) => (i?.taxSubstitutionValue || 0) > 0) ? 
                      `<td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${formatCurrency(item?.taxSubstitutionValue || 0)}</td>` : ''}
                    ${order.items.some((i: any) => (i?.ipiValue || 0) > 0) ? 
                      `<td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${formatCurrency(item?.ipiValue || 0)}</td>` : ''}
                    <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${formatCurrency(item?.totalWithTaxes || 0)}</td>
                    <td style="border: 1px solid #ddd; padding: 3px; text-align: center;">${item?.quantity || 0}</td>
                    <td style="border: 1px solid #ddd; padding: 3px; text-align: center;">${totalUnits}</td>
                    <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${formatCurrency(item?.subtotal || 0)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
          <div>
            <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Resumo Financeiro</h2>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 2px 0;">Total dos Produtos:</td>
                <td style="padding: 2px 0; text-align: right; font-weight: 500;">${formatCurrency(order.subtotal)}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0;">Descontos:</td>
                <td style="padding: 2px 0; text-align: right; color: #dc2626; font-weight: 500;">-${formatCurrency(order.totalDiscount || order.total_discount || 0)}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0;">Subtotal Pedido:</td>
                <td style="padding: 2px 0; text-align: right; font-weight: 500;">${formatCurrency(order.subtotal - (order.totalDiscount || order.total_discount || 0))}</td>
              </tr>
              ${(order.taxSubstitution || order.tax_substitution) ? `
                <tr>
                  <td style="padding: 2px 0;">Substituição Tributária:</td>
                  <td style="padding: 2px 0; text-align: right; color: #ea580c; font-weight: 500;">
                    +${formatCurrency(order.items.reduce((sum: number, item: any) => sum + (item.taxSubstitutionValue || 0), 0))}
                  </td>
                </tr>
              ` : ''}
              ${(order.withIPI || order.with_ipi) ? `
                <tr>
                  <td style="padding: 2px 0;">IPI:</td>
                  <td style="padding: 2px 0; text-align: right; color: #ea580c; font-weight: 500;">+${formatCurrency(order.ipiValue || order.ipi_value || 0)}</td>
                </tr>
              ` : ''}
              ${(order.deliveryFee || order.delivery_fee) && (order.deliveryFee || order.delivery_fee) > 0 ? `
                <tr>
                  <td style="padding: 2px 0;">Taxa de Entrega:</td>
                  <td style="padding: 2px 0; text-align: right; font-weight: 500;">${formatCurrency(order.deliveryFee || order.delivery_fee)}</td>
                </tr>
              ` : ''}
              <tr style="border-top: 1px solid #ddd;">
                <td style="padding: 3px 0; font-weight: bold;">Total:</td>
                <td style="padding: 3px 0; text-align: right; font-weight: bold;">${formatCurrency(order.total)}</td>
              </tr>
            </table>
          </div>
          
          <div>
            <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Entrega</h2>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Tipo:</span> ${(order.shipping || order.shipping) === 'delivery' ? 'Entrega' : 'Retirada'}</p>
            
            ${transportCompany ? `
              <p style="margin: 2px 0;"><span style="font-weight: 600;">Transportadora:</span> ${transportCompany.name}</p>
            ` : ''}
            
            ${(order.shipping || order.shipping) === 'delivery' && (order.deliveryLocation || order.delivery_location) ? `
              <p style="margin: 2px 0;"><span style="font-weight: 600;">Região:</span> ${(order.deliveryLocation || order.delivery_location) === 'capital' ? 'Capital' : 'Interior'}</p>
            ` : ''}
            
            ${(order.shipping || order.shipping) === 'delivery' && (order.deliveryFee || order.delivery_fee) && (order.deliveryFee || order.delivery_fee) > 0 ? `
              <p style="margin: 2px 0;"><span style="font-weight: 600;">Taxa de Entrega:</span> ${formatCurrency(order.deliveryFee || order.delivery_fee)}</p>
            ` : ''}
            
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Peso Total do Pedido:</span> ${formatWeight(totalOrderWeight)}</p>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Total de Volumes:</span> ${totalVolumes}</p>
          </div>
        </div>
        
        ${(order.notes || order.observations) ? `
          <div style="margin-bottom: 8px;">
            <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Observações</h2>
            <p style="border: 1px solid #ddd; padding: 4px; background-color: #f9f9f9; margin: 0;">${order.notes || order.observations}</p>
          </div>
        ` : ''}
        
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #666;">
          <p style="margin: 0;">Este documento não possui valor fiscal. Para mais informações entre em contato conosco.</p>
        </div>
      </div>
    `;
  };

  const getStatusBadge = (status: string) => {
    return <OrderStatusBadge status={status as any} />;
  };

  if (loading || isSupabaseLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ferplas-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-700">Pedido não encontrado</h2>
        <p className="text-gray-500 mt-2">O pedido que você está procurando não existe ou foi removido.</p>
        <Button 
          className="mt-6"
          onClick={() => navigate('/orders')}
        >
          Voltar para Pedidos
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">
            Pedido #{order.orderNumber}
          </CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={handlePrintOrder}>
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrintInvoice}>
              <Receipt className="h-4 w-4" />
            </Button>
            {user?.role === 'admin' && (
              <Button variant="secondary" size="icon" onClick={() => navigate(`/orders/edit/${order.id}`)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" onClick={() => navigate('/orders')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                Informações do Cliente
              </h3>
              <Separator />
              <p className="text-gray-500">
                <User className="mr-2 inline-block h-4 w-4" />
                {order.customer.companyName}
              </p>
              <p className="text-gray-500">
                <Phone className="mr-2 inline-block h-4 w-4" />
                {formatPhoneNumber(order.customer.phone)}
              </p>
              {order.customer.whatsapp && (
                <p className="text-gray-500">
                  <ShoppingCart className="mr-2 inline-block h-4 w-4" />
                  {formatPhoneNumber(order.customer.whatsapp)}
                </p>
              )}
              <p className="text-gray-500">
                <Mail className="mr-2 inline-block h-4 w-4" />
                {order.customer.email}
              </p>
              <p className="text-gray-500">
                <MapPin className="mr-2 inline-block h-4 w-4" />
                {order.customer.street}, {order.customer.number} - {order.customer.city}, {order.customer.state}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                Detalhes do Pedido
              </h3>
              <Separator />
              <p className="text-gray-500">
                <Calendar className="mr-2 inline-block h-4 w-4" />
                {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: ptBR })}
              </p>
              <p className="text-gray-500">
                <User className="mr-2 inline-block h-4 w-4" />
                Vendedor: {order.user?.name || 'Não informado'}
              </p>
              <p className="text-gray-500">
                {getStatusBadge(order.status)}
              </p>
              <p className="text-gray-500">
                <Truck className="mr-2 inline-block h-4 w-4" />
                {order.shipping === 'delivery' ? 'Entrega' : 'Retirada'}
                {order.deliveryLocation && ` (${order.deliveryLocation === 'capital' ? 'Capital' : 'Interior'})`}
              </p>
              {transportCompany && (
                <p className="text-gray-500">
                  <Truck className="mr-2 inline-block h-4 w-4" />
                  Transportadora: {transportCompany.name}
                </p>
              )}
              <p className="text-gray-500">
                <Package className="mr-2 inline-block h-4 w-4" />
                Volumes: {totalVolumes} ({formatWeight(totalOrderWeight)})
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDetail;
