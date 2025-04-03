import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Printer, Truck, Package, 
  Calendar, User, Phone, Mail, MapPin, Receipt, ShoppingCart, RefreshCcw
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
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import PrintableOrder from '@/components/orders/PrintableOrder';
import { Order } from '@/types/types';
import { useOrderManagement } from '@/hooks/use-order-management';

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getOrderById, orders, fetchOrders } = useOrders();
  const { fetchOrderById, isLoading: isLoadingDirect } = useOrderManagement();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingDirectFetch, setUsingDirectFetch] = useState(false);

  useEffect(() => {
    const loadOrders = async () => {
      if (orders.length === 0) {
        await fetchOrders();
      }
    };
    
    loadOrders();
  }, [orders.length, fetchOrders]);

  useEffect(() => {
    const getOrderDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      console.log(`Attempting to fetch order with ID: ${id}`);
      console.log(`Current orders in context: ${orders.length}`);
      
      console.log("Available order IDs:", orders.map(o => o.id));
      
      const foundOrder = getOrderById(id);
      
      if (foundOrder) {
        console.log("Found order in context:", foundOrder);
        setOrder(foundOrder);
        setUsingDirectFetch(false);
      } else {
        console.log(`Order with ID ${id} not found in context, trying direct fetch...`);
        
        const directOrder = await fetchOrderById(id);
        
        if (directOrder) {
          console.log("Found order via direct fetch:", directOrder);
          setOrder(directOrder);
          setUsingDirectFetch(true);
        } else {
          console.error(`Order with ID ${id} not found at all`);
          toast.error("Pedido não encontrado");
          setOrder(null);
        }
      }
      
      setLoading(false);
    };

    getOrderDetails();
  }, [id, getOrderById, orders, fetchOrderById]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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

  const renderPrintableOrderHTML = (order: any, companyInfo: any) => {
    const invoiceTypeText = order.fullInvoice ? 'Nota Cheia' : 'Meia Nota';
    const halfInvoiceText = !order.fullInvoice && order.halfInvoicePercentage ? 
      `(${order.halfInvoicePercentage}%)` : '';
      
    let taxSubstitutionValue = 0;
    if (order.taxSubstitution) {
      taxSubstitutionValue = (7.8 / 100) * order.subtotal;
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
            <p style="font-weight: 600; margin: 2px 0;">${order.customer.companyName}</p>
            <p style="margin: 2px 0;">CNPJ/CPF: ${order.customer.document}</p>
            <p style="margin: 2px 0;">${order.customer.street}, ${order.customer.number} ${order.customer.complement ? `- ${order.customer.complement}` : ''}</p>
            <p style="margin: 2px 0;">${order.customer.city}/${order.customer.state} - ${order.customer.zipCode}</p>
            <p style="margin: 2px 0;">Tel: ${order.customer.phone}</p>
          </div>
          
          <div style="border: 1px solid #ddd; border-radius: 4px; padding: 8px;">
            <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Dados do Pedido</h2>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Data:</span> ${format(new Date(order.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
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
        
        ${order.notes ? `
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

  const getStatusBadge = (status: string) => {
    return <OrderStatusBadge status={status as any} />;
  };

  const handleRefreshOrder = async () => {
    if (!id) return;
    
    setLoading(true);
    
    try {
      const refreshedOrder = await fetchOrderById(id);
      
      if (refreshedOrder) {
        setOrder(refreshedOrder);
        toast.success("Pedido atualizado com sucesso!");
        
        fetchOrders();
      } else {
        toast.error("Pedido não encontrado");
      }
    } catch (error) {
      console.error("Error refreshing order:", error);
      toast.error("Erro ao atualizar pedido");
    } finally {
      setLoading(false);
    }
  };

  if (loading || isLoadingDirect) {
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
        <div className="flex flex-col gap-3 items-center mt-6">
          <Button 
            onClick={handleRefreshOrder}
            className="bg-ferplas-500 hover:bg-ferplas-600"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Tentar atualizar pedido
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/orders')}
          >
            Voltar para lista de pedidos
          </Button>
        </div>
      </div>
    );
  }

  const orderNumber = order.orderNumber ? order.orderNumber : 1;

  const totalDiscount = order.totalDiscount || 0;
  const appliedDiscounts = order.discountOptions || [];
  const items = order.items || [];
  const shipping = order.shipping || 'delivery';
  const notes = order.observations || order.notes || '';
  const fullInvoice = order.fullInvoice || false;
  const taxSubstitution = order.taxSubstitution || false;
  const paymentMethod = order.paymentMethod || 'cash';
  const paymentTerms = order.paymentTerms || '';
  const deliveryLocation = order.deliveryLocation || null;
  const deliveryFee = order.deliveryFee || 0;
  const halfInvoicePercentage = order.halfInvoicePercentage || 50;
  const withIPI = order.withIPI || false;
  const ipiValue = order.ipiValue || 0;
  
  const taxSubstitutionValue = taxSubstitution ? (7.8 / 100) * order.subtotal : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4 text-gray-500"
            onClick={() => navigate('/orders')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center">
              <h1 className="text-3xl font-bold tracking-tight">Pedido #{orderNumber}</h1>
              <div className="ml-4">{getStatusBadge(order.status)}</div>
              {usingDirectFetch && (
                <div className="ml-4 text-amber-500 text-sm flex items-center">
                  <span className="px-2 py-1 bg-amber-100 rounded-full text-xs">Visualização direta</span>
                  <Button 
                    variant="link" 
                    className="text-xs text-amber-600 p-1 h-auto" 
                    onClick={handleRefreshOrder}
                  >
                    <RefreshCcw className="h-3 w-3 mr-1" /> Sincronizar
                  </Button>
                </div>
              )}
            </div>
            <p className="text-muted-foreground">
              Criado em {format(new Date(order.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {user?.role === 'administrator' && order.status !== 'canceled' && (
            <Button 
              className="bg-ferplas-500 hover:bg-ferplas-600 button-transition"
              onClick={() => navigate(`/orders/${id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar Pedido
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={handlePrintOrder}
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Pedido
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Empresa</h3>
              <p className="text-lg font-semibold">{order.customer.companyName}</p>
              <p className="text-sm text-gray-500">CNPJ/CPF: {order.customer.document}</p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                Endereço
              </h3>
              <p className="text-md">
                {order.customer.street}, {order.customer.number}
                {order.customer.complement && ` - ${order.customer.complement}`}
              </p>
              <p className="text-md">
                {order.customer.city}/{order.customer.state} - {order.customer.zipCode}
              </p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 flex items-center">
                  <Phone className="h-4 w-4 mr-1 text-gray-400" />
                  Telefone
                </h3>
                <p className="text-md">{order.customer.phone}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 flex items-center">
                  <Mail className="h-4 w-4 mr-1 text-gray-400" />
                  Email
                </h3>
                <p className="text-md">{order.customer.email}</p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate(`/customers/${order.customer.id}`)}
            >
              <User className="mr-2 h-4 w-4" />
              Ver Detalhes do Cliente
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Histórico do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="min-w-8 min-h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Pedido Criado</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  <p className="text-sm text-gray-500">Por {order.user?.name || 'Usuário'}</p>
                </div>
              </div>
              
              {order.status !== 'pending' && (
                <div className="flex items-start">
                  <div className="min-w-8 min-h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Pedido Confirmado</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(new Date(order.createdAt).getTime() + 24 * 60 * 60 * 1000), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-gray-500">Por Administrador</p>
                  </div>
                </div>
              )}
              
              {order.status === 'completed' && (
                <div className="flex items-start">
                  <div className="min-w-8 min-h-8 rounded-full bg-ferplas-100 flex items-center justify-center mr-3">
                    <Truck className="h-4 w-4 text-ferplas-600" />
                  </div>
                  <div>
                    <p className="font-medium">Pedido Entregue</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(new Date(order.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-gray-500">Entregue por Transporte Ferplas</p>
                  </div>
                </div>
              )}
              
              {order.status === 'canceled' && (
                <div className="flex items-start">
                  <div className="min-w-8 min-h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                    <Calendar className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">Pedido Cancelado</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(new Date(order.createdAt).getTime() + 2 * 24 * 60 * 60 * 1000), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-gray-500">Por Cliente</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Descontos:</span>
                <span>-{formatCurrency(totalDiscount)}</span>
              </div>
              {withIPI && ipiValue > 0 && (
                <div className="flex justify-between text-sm text-blue-600">
                  <span>IPI:</span>
                  <span>+{formatCurrency(ipiValue)}</span>
                </div>
              )}
              {taxSubstitution && taxSubstitutionValue > 0 && (
                <div className="flex justify-between text-sm text-orange-600">
                  <span>Substituição Tributária (7.8%):</span>
                  <span>+{formatCurrency(taxSubstitutionValue)}</span>
                </div>
              )}
              {deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Taxa de Entrega:</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-medium text-lg">
                <span>Total:</span>
                <span className="text-ferplas-600">{formatCurrency(order.total)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Condições de Pagamento</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Forma de Pagamento:</span>
                  <span>{paymentMethod === 'cash' ? 'À Vista' : 'A Prazo'}</span>
                </div>
                {paymentMethod === 'credit' && paymentTerms && (
                  <div className="flex justify-between text-sm">
                    <span>Prazos de Pagamento:</span>
                    <span>{paymentTerms}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Tipo de Nota:</span>
                  <span>{fullInvoice ? 'Nota Cheia' : 'Meia Nota'}</span>
                </div>
                {!fullInvoice && halfInvoicePercentage && (
                  <div className="flex justify-between text-sm">
                    <span>Percentual da Nota:</span>
                    <span>{halfInvoicePercentage}%</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Substituição Tributária:</span>
                  <span>{taxSubstitution ? 'Sim' : 'Não'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>IPI:</span>
                  <span>{withIPI ? 'Sim' : 'Não'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Itens do Pedido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Preço Unitário</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Preço Final</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any, index: number) => (
                <TableRow key={item?.id || `item-${index}`}>
                  <TableCell className="font-medium">
                    {item?.product?.name || item?.productName || `Produto ${index + 1}`}
                  </TableCell>
                  <TableCell>{formatCurrency(item?.listPrice || item?.product?.listPrice || 0)}</TableCell>
                  <TableCell>{item?.discount || 0}%</TableCell>
                  <TableCell>{formatCurrency(item?.finalPrice || 0)}</TableCell>
                  <TableCell>{item?.quantity || 0}</TableCell>
                  <TableCell>{formatCurrency(item?.subtotal || 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="h-12 w-12 text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-600">Nenhum item no pedido</h2>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center">
            <Receipt className="mr-2 h-5 w-5" />
            Descontos e Acréscimos Aplicados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {appliedDiscounts && appliedDiscounts.length > 0 ? (
              appliedDiscounts.map((discount: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full ${discount.type === 'discount' ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center mr-3`}>
                      <span className={`${discount.type === 'discount' ? 'text-green-600' : 'text-red-600'} font-bold`}>
                        {discount.type === 'discount' ? '-' : '+'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{discount.name}</p>
                      <p className="text-sm text-gray-500">
                        {discount.type === 'discount' ? 'Desconto' : 'Acréscimo'} de {discount.value}%
                      </p>
                    </div>
                  </div>
                  <span className={`font-medium ${discount.type === 'discount' ? 'text-green-600' : 'text-red-600'}`}>
                    {discount.type === 'discount' ? '-' : '+'}
                    {discount.value}%
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                Nenhum desconto ou acréscimo aplicado.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center">
            <Truck className="mr-2 h-5 w-5" />
            Entrega
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Tipo de Entrega</h3>
              <p className="text-lg flex items-center">
                {shipping === 'delivery' ? (
                  <>
                    <Truck className="h-4 w-4 mr-2 text-ferplas-500" />
                    Entrega
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2 text-ferplas-500" />
                    Retirada
                  </>
                )}
              </p>
            </div>
            
            {shipping === 'delivery' && deliveryLocation && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Região de Entrega</h3>
                <p className="text-lg">
                  {deliveryLocation === 'capital' ? 'Capital' : 'Interior'}
                </p>
              </div>
            )}
            
            {shipping === 'delivery' && deliveryFee > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Taxa de Entrega</h3>
                <p className="text-lg">{formatCurrency(deliveryFee)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm bg-gray-50 border border-gray-200 rounded p-3">
              {notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderDetail;
