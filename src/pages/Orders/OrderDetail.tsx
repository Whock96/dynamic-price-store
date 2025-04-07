import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useOrders } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { useSupabaseData } from '@/hooks/use-supabase-data';
import { useTransportCompanies } from '@/context/TransportCompanyContext';
import { Printer, FileText, Edit, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDocument, formatPhoneNumber } from '@/utils/formatters';
import { Order } from '@/types/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import PrintableOrder from '@/components/orders/PrintableOrder';

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOrderById, updateOrder, deleteOrder, isLoading } = useOrders();
  const { getCompanyById } = useTransportCompanies();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transportCompany, setTransportCompany] = useState<TransportCompany | null>(null);

  useEffect(() => {
    if (id) {
      const foundOrder = getOrderById(id);
      if (foundOrder) {
        setOrder(foundOrder);
        
        if (foundOrder.transportCompanyId) {
          const company = getCompanyById(foundOrder.transportCompanyId);
          if (company) {
            setTransportCompany(company);
          }
        }
      } else {
        toast.error("Pedido não encontrado");
        navigate('/orders');
      }
    }
  }, [id, getOrderById, navigate, getCompanyById]);

  const handleUpdateStatus = (status: string) => {
    if (order) {
      updateOrder(order.id, { status });
    }
  };

  const handleCancelOrder = () => {
    if (order) {
      setIsProcessing(true);
      deleteOrder(order.id)
        .then(() => {
          toast.success("Pedido cancelado com sucesso");
          navigate('/orders');
        })
        .catch((error) => {
          toast.error("Erro ao cancelar pedido");
          console.error(error);
        })
        .finally(() => {
          setIsProcessing(false);
        });
    }
  };

  const printOrder = () => {
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
            // This will trigger print when content is loaded
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

  const renderPrintableOrderHTML = (order: any, companyInfo: any) => {
    const invoiceTypeText = order.fullInvoice ? 'Nota Cheia' : 'Meia Nota';
    const halfInvoiceText = !order.fullInvoice && order.halfInvoicePercentage ? 
      `(${order.halfInvoicePercentage}%)` : '';
      
    let taxSubstitutionValue = 0;
    if (order.taxSubstitution) {
      taxSubstitutionValue = (7.8 / 100) * order.subtotal;
    }
    
    const ipiValue = (order.withIPI || order.with_ipi) ? (order.ipiValue || order.ipi_value || 0) : 0;
    
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
            Emitido em ${format(new Date(order.createdAt || order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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
            <p style="margin: 2px 0;"><span style="font-weight: 600;">IPI:</span> ${order.withIPI || order.with_ipi ? 'Sim' : 'Não'}</p>
          </div>
        </div>
        
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
                <th style="border: 1px solid #ddd; padding: 3px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map((item: any, index: number) => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 3px;">${item?.product?.name || item?.productName || `Produto ${index + 1}`}</td>
                  <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">
                    ${formatCurrency(item?.listPrice || item?.product?.listPrice || 0)}
                  </td>
                  <td style="border: 1px solid #ddd; padding: 3px; text-align: center;">${item?.discount || 0}%</td>
                  <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${formatCurrency(item?.finalPrice || 0)}</td>
                  <td style="border: 1px solid #ddd; padding: 3px; text-align: center;">${item?.quantity || 0}</td>
                  <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${formatCurrency(item?.subtotal || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
          <div>
            <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Entrega</h2>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Tipo:</span> ${(order.shipping || order.shipping) === 'delivery' ? 'Entrega' : 'Retirada'}</p>
            ${(order.shipping || order.shipping) === 'delivery' && (order.deliveryLocation || order.delivery_location) ? 
              `<p style="margin: 2px 0;"><span style="font-weight: 600;">Região:</span> ${(order.deliveryLocation || order.delivery_location) === 'capital' ? 'Capital' : 'Interior'}</p>` : ''}
            ${(order.shipping || order.shipping) === 'delivery' && (order.deliveryFee || order.delivery_fee) && (order.deliveryFee || order.delivery_fee) > 0 ? 
              `<p style="margin: 2px 0;"><span style="font-weight: 600;">Taxa:</span> ${formatCurrency(order.deliveryFee || order.delivery_fee)}</p>` : ''}
          </div>
          
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
                  -${formatCurrency(order.totalDiscount || order.total_discount || 0)}
                </td>
              </tr>
              ${(order.taxSubstitution || order.tax_substitution) ? `
                <tr>
                  <td style="padding: 2px 0;">Substituição Tributária (7.8%):</td>
                  <td style="padding: 2px 0; text-align: right; color: #ea580c; font-weight: 500;">
                    +${formatCurrency(taxSubstitutionValue)}
                  </td>
                </tr>
              ` : ''}
              ${(order.withIPI || order.with_ipi) && ipiValue > 0 ? `
                <tr>
                  <td style="padding: 2px 0;">IPI:</td>
                  <td style="padding: 2px 0; text-align: right; color: #ea580c; font-weight: 500;">
                    +${formatCurrency(ipiValue)}
                  </td>
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

  if (isLoading || !order) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="mr-2 p-0 h-9 w-9" 
            onClick={() => navigate('/orders')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Pedido #{order.orderNumber || order.id.substring(0, 8)}
            </h1>
            <p className="text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            className="gap-1"
            onClick={() => setIsPrintDialogOpen(true)}
          >
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
          
          <Button
            variant="outline" 
            className="gap-1"
            onClick={() => navigate(`/orders/${id}/edit`)}
          >
            <Edit className="h-4 w-4" /> Editar
          </Button>
          
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              className="gap-1" 
              disabled={order.status === 'canceled'}
            >
              <Trash2 className="h-4 w-4" /> Cancelar
            </Button>
          </AlertDialogTrigger>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <CardTitle>Detalhes do Pedido</CardTitle>
                <OrderStatusBadge status={order.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between">
                  <h3 className="font-medium text-base mb-2">Cliente</h3>
                  <Badge variant="outline">{formatDocument(order.customer.document)}</Badge>
                </div>
                <p className="text-lg font-semibold">{order.customer.companyName}</p>
                <div className="text-sm text-muted-foreground space-y-1 mt-2">
                  <p className="flex items-center gap-1">
                    <Phone size={14} /> {formatPhoneNumber(order.customer.phone)}
                  </p>
                  <p className="flex items-center gap-1">
                    <Mail size={14} /> {order.customer.email || 'Não informado'}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Vendedor</p>
                  <p className="font-medium">{order.user.name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Data do Pedido</p>
                  <p className="font-medium">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                  <div className="flex items-center gap-1">
                    <CreditCard size={14} />
                    <span className="font-medium">
                      {order.paymentMethod === 'cash' ? 'À Vista' : 'A Prazo'}
                    </span>
                  </div>
                </div>
                
                {order.paymentTerms && (
                  <div>
                    <p className="text-sm text-muted-foreground">Condições de Pagamento</p>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span className="font-medium">{order.paymentTerms}</span>
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Entrega</p>
                  <div className="flex items-center gap-1">
                    <Truck size={14} />
                    <span className="font-medium">
                      {order.shipping === 'delivery' ? 'Entrega' : 'Retirada'}
                    </span>
                  </div>
                </div>
                
                {order.shipping === 'delivery' && order.deliveryLocation && (
                  <div>
                    <p className="text-sm text-muted-foreground">Local de Entrega</p>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">
                        {order.deliveryLocation === 'capital' ? 'Capital' : 'Interior'}
                      </span>
                    </div>
                  </div>
                )}
                
                {order.transportCompanyId && transportCompany && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Transportadora</p>
                    <div className="flex items-center gap-1">
                      <Truck size={14} />
                      <span className="font-medium">{transportCompany.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDocument(transportCompany.document)}
                      {transportCompany.phone && (
                        <span className="ml-2">{formatPhoneNumber(transportCompany.phone)}</span>
                      )}
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-muted-foreground">NF Completa</p>
                  <div className="flex items-center gap-1">
                    <FileText size={14} />
                    <span className="font-medium">
                      {order.fullInvoice ? 'Sim' : 'Não'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Substituição Tributária</p>
                  <div className="flex items-center gap-1">
                    <Tag size={14} />
                    <span className="font-medium">
                      {order.taxSubstitution ? 'Sim' : 'Não'}
                    </span>
                  </div>
                </div>
                
                {order.withIPI && (
                  <div>
                    <p className="text-sm text-muted-foreground">IPI Incluso</p>
                    <div className="flex items-center gap-1">
                      <Check size={14} />
                      <span className="font-medium">Sim</span>
                    </div>
                  </div>
                )}
                
                {order.ipiValue && order.ipiValue > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Valor IPI</p>
                    <span className="font-medium">{formatCurrency(order.ipiValue)}</span>
                  </div>
                )}
              </div>
              
              {order.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Observações</p>
                    <div className="bg-muted p-3 rounded-md text-sm">
                      {order.notes}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Itens do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left font-medium text-sm">Produto</th>
                      <th className="p-2 text-center font-medium text-sm">Quant.</th>
                      <th className="p-2 text-right font-medium text-sm">Preço</th>
                      <th className="p-2 text-right font-medium text-sm">Desc.</th>
                      <th className="p-2 text-right font-medium text-sm">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {order.items.map((item: CartItem) => (
                      <tr key={item.id} className="hover:bg-muted/50">
                        <td className="p-2 text-left">
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-xs text-muted-foreground">{item.product.description}</div>
                        </td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-right">{formatCurrency(item.finalPrice)}</td>
                        <td className="p-2 text-right">{item.discount}%</td>
                        <td className="p-2 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              
              {order.totalDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desconto:</span>
                  <span className="text-red-500">-{formatCurrency(order.totalDiscount)}</span>
                </div>
              )}
              
              {order.deliveryFee && order.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de Entrega:</span>
                  <span>{formatCurrency(order.deliveryFee)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
              
              {order.appliedDiscounts && order.appliedDiscounts.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Descontos Aplicados</h4>
                  <ul className="text-sm space-y-1">
                    {order.appliedDiscounts.map((discount, index) => (
                      <li key={index} className="flex justify-between">
                        <span>{discount.name}:</span>
                        <span className={discount.type === 'discount' ? 'text-red-500' : 'text-green-500'}>
                          {discount.type === 'discount' ? '-' : '+'}{discount.value}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Status do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hourglass className="text-amber-500 h-5 w-5" />
                    <span className="font-medium">Status Atual:</span>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    disabled={order.status !== 'pending'}
                    onClick={() => handleUpdateStatus('confirmed')}
                  >
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Confirmar Pedido
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    disabled={order.status !== 'confirmed'}
                    onClick={() => handleUpdateStatus('invoiced')}
                  >
                    <FileText className="mr-2 h-4 w-4 text-blue-500" />
                    Faturar Pedido
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    disabled={order.status !== 'invoiced'}
                    onClick={() => handleUpdateStatus('completed')}
                  >
                    <Clipboard className="mr-2 h-4 w-4 text-indigo-500" />
                    Completar Pedido
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Impressão do Pedido</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[70vh] mt-6 rounded border p-4">
            <div className="print-container bg-white p-4" id="printSection">
              <PrintableOrder order={order} />
              
              {order.transportCompanyId && transportCompany && (
                <div className="mt-2">
                  <Label className="text-sm font-medium">Transportadora</Label>
                  <p>{transportCompany.name} - {formatDocument(transportCompany.document)}</p>
                  {transportCompany.phone && (
                    <p className="text-sm text-muted-foreground">
                      Tel: {formatPhoneNumber(transportCompany.phone)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPrintDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => printOrder()}
              className="bg-ferplas-500 hover:bg-ferplas-600"
            >
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter pedido</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              disabled={isProcessing}
              className={cn(
                "bg-red-500 hover:bg-red-600",
                isProcessing && "opacity-70 cursor-not-allowed"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Sim, cancelar pedido"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderDetail;
