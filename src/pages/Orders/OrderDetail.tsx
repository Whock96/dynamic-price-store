import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as ReactDOM from 'react-dom/client';
import { useCompany } from '@/context/CompanyContext';
import { PrintContextWrapper } from '@/components/orders/PrintContextWrapper';
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
import { InvoiceCard } from '@/components/orders/InvoiceCard';
import { printStyles } from '@/styles/printStyles';
import { fetchDuplicatas, upsertDuplicata, deleteDuplicata } from "@/integrations/supabase/duplicata";
import { uploadBoletoPdf, deleteBoletoPdf } from "@/integrations/supabase/boletoPdfService";
import DuplicatasCard from "@/components/orders/DuplicatasCard";
import DuplicataForm from "@/components/orders/DuplicataForm";
import DuplicataDetailsDialog from "@/components/orders/DuplicataDetailsDialog";
import { Duplicata, RefTable } from "@/types/duplicata";

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getOrderById, updateOrder } = useOrders();
  const { order: supabaseOrder, isLoading: isSupabaseLoading, fetchOrderData } = useOrderData(id);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transportCompany, setTransportCompany] = useState<any>(null);
  const [isLoadingTransport, setIsLoadingTransport] = useState(false);
  const [totalOrderWeight, setTotalOrderWeight] = useState(0);
  const [totalVolumes, setTotalVolumes] = useState(0);
  const [duplicatas, setDuplicatas] = useState<Duplicata[]>([]);
  const [isLoadingDuplicatas, setIsLoadingDuplicatas] = useState(true);
  const [showDuplicataForm, setShowDuplicataForm] = useState(false);
  const [editingDuplicata, setEditingDuplicata] = useState<Duplicata | null>(null);
  const [isSavingDuplicata, setIsSavingDuplicata] = useState(false);
  const [showDuplicataDetails, setShowDuplicataDetails] = useState(false);
  const [selectedDuplicata, setSelectedDuplicata] = useState<Duplicata | null>(null);
  const [isLoadingLookup, setIsLoadingLookup] = useState(true);
  const [lookup, setLookup] = useState<{
    modos: RefTable[];
    portadores: RefTable[];
    bancos: RefTable[];
    statuses: RefTable[];
  }>({
    modos: [],
    portadores: [],
    bancos: [],
    statuses: []
  });
  const { companyInfo } = useCompany();

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
      weight += Number(item.totalWeight || 0);
      volumes += Number(item.quantity || 0);
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

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(0);
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(2)} kg`;
  };

  const formatCubicVolume = (volume: number) => {
    return `${volume.toFixed(3)} m³`;
  };

  const handlePrintOrder = () => {
    console.log('Opening print window for order with company info:', companyInfo);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão.");
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pedido #${order.orderNumber || '1'} - Impressão</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          ${printStyles}
        </style>
      </head>
      <body>
        <div id="printable-root"></div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    const printRoot = printWindow.document.getElementById('printable-root');
    if (printRoot && order) {
      console.log('Rendering PrintableOrder with companyInfo:', companyInfo);
      
      const root = ReactDOM.createRoot(printRoot);
      root.render(
        <React.StrictMode>
          <PrintContextWrapper companyInfo={companyInfo}>
            <PrintableOrder 
              order={order}
              companyInfo={companyInfo}
              onPrint={() => {
                console.log('PrintableOrder rendered, initiating print...');
                printWindow.focus();
                printWindow.print();
              }}
            />
          </PrintContextWrapper>
        </React.StrictMode>
      );
    } else {
      toast.error("Erro ao preparar impressão. Tente novamente.");
      printWindow.close();
    }
  };

  const handlePrintInvoice = () => {
    console.log('Opening print window for invoice with company info:', companyInfo);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão.");
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Faturamento #${order.orderNumber || '1'} - Impressão</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          ${printStyles}
        </style>
      </head>
      <body>
        <div id="invoice-root"></div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    const invoiceRoot = printWindow.document.getElementById('invoice-root');
    if (invoiceRoot && order) {
      console.log('Rendering PrintableInvoice with companyInfo:', companyInfo);
      
      const root = ReactDOM.createRoot(invoiceRoot);
      root.render(
        <React.StrictMode>
          <PrintContextWrapper companyInfo={companyInfo}>
            <PrintableInvoice 
              order={order}
              companyInfo={companyInfo}
              onPrint={() => {
                console.log('PrintableInvoice rendered, initiating print...');
                printWindow.focus();
                printWindow.print();
              }}
            />
          </PrintContextWrapper>
        </React.StrictMode>
      );
    } else {
      toast.error("Erro ao preparar impressão do faturamento.");
      printWindow.close();
    }
  };

  const handleInvoicePdfDelete = async () => {
    if (order && id) {
      await updateOrder(id, { invoicePdfPath: null });
      fetchOrderData();
    }
  };

  const getStatusBadge = (status: string) => {
    return <OrderStatusBadge status={status as any} />;
  };

  useEffect(() => {
    async function loadLookups() {
      setIsLoadingLookup(true);
      try {
        const { data: modosData } = await supabase
          .from("modo_pagamento")
          .select("*")
          .order("nome", { ascending: true });
          
        const { data: portadoresData } = await supabase
          .from("portador")
          .select("*")
          .order("nome", { ascending: true });
          
        const { data: bancosData } = await supabase
          .from("bancos")
          .select("*")
          .order("nome", { ascending: true });
          
        const { data: statusesData } = await supabase
          .from("payment_status")
          .select("*")
          .order("nome", { ascending: true });
          
        setLookup({
          modos: modosData as RefTable[] || [],
          portadores: portadoresData as RefTable[] || [],
          bancos: bancosData as RefTable[] || [],
          statuses: statusesData as RefTable[] || [],
        });
      } catch (err) {
        console.error("Erro ao carregar opções para duplicatas:", err);
        toast.error("Erro ao carregar opções para duplicatas");
      } finally {
        setIsLoadingLookup(false);
      }
    }
    loadLookups();
  }, []);

  useEffect(() => {
    if (order?.id) {
      setIsLoadingDuplicatas(true);
      fetchDuplicatas(order.id)
        .then(data => setDuplicatas(data))
        .catch(err => {
          console.error("Erro ao buscar duplicatas:", err);
          toast.error("Erro ao buscar duplicatas");
        })
        .finally(() => setIsLoadingDuplicatas(false));
    }
  }, [order?.id]);

  const handleCreateDuplicata = () => {
    const newDuplicata: Partial<Duplicata> = {
      orderId: order?.id,
      dataEmissao: new Date().toISOString().split('T')[0],
      dataVencimento: new Date().toISOString().split('T')[0],
      valor: 0,
      valorAcrescimo: 0,
      valorDesconto: 0,
      numeroDuplicata: ''
    };
    
    setEditingDuplicata(newDuplicata as Duplicata);
    setShowDuplicataForm(true);
  };

  const handleEditDuplicata = (duplicata: Duplicata) => {
    setEditingDuplicata(duplicata);
    setShowDuplicataForm(true);
  };

  const handleDeleteDuplicata = async (duplicata: Duplicata) => {
    if (window.confirm(`Deseja excluir a duplicata ${duplicata.numeroDuplicata}?`)) {
      try {
        await deleteDuplicata(duplicata.id);
        toast.success("Duplicata excluída com sucesso");
        
        // Recarregar a lista de duplicatas
        if (order?.id) {
          const updatedDuplicatas = await fetchDuplicatas(order.id);
          setDuplicatas(updatedDuplicatas);
        }
      } catch (error) {
        console.error("Erro ao excluir duplicata:", error);
        toast.error("Erro ao excluir duplicata");
      }
    }
  };

  const handleDeleteBoletoPdf = async (duplicata: Duplicata) => {
    if (!duplicata.id || !duplicata.pdfBoletoPath) return;
    
    if (window.confirm("Tem certeza que deseja excluir o PDF do boleto?")) {
      try {
        await deleteBoletoPdf(duplicata.pdfBoletoPath);
        
        // Atualizar a duplicata sem o PDF
        await upsertDuplicata({
          ...duplicata,
          pdfBoletoPath: null
        });
        
        toast.success("PDF da duplicata excluído com sucesso");
        
        // Recarregar a lista de duplicatas
        if (order?.id) {
          const updatedDuplicatas = await fetchDuplicatas(order.id);
          setDuplicatas(updatedDuplicatas);
        }
      } catch (error) {
        console.error("Erro ao excluir o PDF do boleto:", error);
        toast.error("Erro ao excluir o PDF do boleto");
      }
    }
  };

  const handleSaveDuplicata = async (formData: Partial<Duplicata>, file: File | null) => {
    try {
      setIsSavingDuplicata(true);
      
      // Garantir que orderId está definido
      if (!formData.orderId && order?.id) {
        formData.orderId = order.id;
      }
      
      // Processar o upload do arquivo PDF se houver
      if (file) {
        const pdfPath = await uploadBoletoPdf(file, formData.id);
        formData.pdfBoletoPath = pdfPath;
      }
      
      // Salvar ou atualizar a duplicata
      const savedDuplicata = await upsertDuplicata(formData);
      
      toast.success(formData.id ? "Duplicata atualizada com sucesso" : "Duplicata criada com sucesso");
      
      // Fechar o formulário e recarregar a lista
      setShowDuplicataForm(false);
      setEditingDuplicata(null);
      
      // Atualizar a lista de duplicatas
      if (order?.id) {
        const updatedDuplicatas = await fetchDuplicatas(order.id);
        setDuplicatas(updatedDuplicatas);
      }
    } catch (error) {
      console.error("Erro ao salvar duplicata:", error);
      toast.error("Erro ao salvar duplicata");
    } finally {
      setIsSavingDuplicata(false);
    }
  };

  const handleViewDuplicataDetails = (duplicata: Duplicata) => {
    setSelectedDuplicata(duplicata);
    setShowDuplicataDetails(true);
  };

  const handleCloseDuplicataDetails = () => {
    setShowDuplicataDetails(false);
    setSelectedDuplicata(null);
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
          Voltar para lista de pedidos
        </Button>
      </div>
    );
  }

  const orderNumber = order.orderNumber || order.order_number || 1;
  const totalDiscount = order.totalDiscount || order.total_discount || 0;
  const appliedDiscounts = order.appliedDiscounts || order.discountOptions || [];
  const items = order.items || [];
  const shipping = order.shipping || 'delivery';
  const notes = order.observations || order.notes || '';
  const fullInvoice = order.fullInvoice !== undefined ? order.fullInvoice : (order.full_invoice !== undefined ? order.full_invoice : true);
  const taxSubstitution = order.taxSubstitution !== undefined ? order.taxSubstitution : (order.tax_substitution !== undefined ? order.tax_substitution : false);
  const withSuframa = order.withSuframa !== undefined ? order.withSuframa : (order.with_suframa !== undefined ? order.with_suframa : false);
  const paymentMethod = order.paymentMethod || order.payment_method || 'cash';
  const paymentTerms = order.paymentTerms || order.payment_terms || '';
  const deliveryLocation = order.deliveryLocation || order.delivery_location || null;
  const deliveryFee = order.deliveryFee || order.delivery_fee || 0;
  const halfInvoicePercentage = order.halfInvoicePercentage || order.half_invoice_percentage || 50;
  const withIPI = order.withIPI !== undefined ? order.withIPI : (order.with_ipi !== undefined ? order.with_ipi : false);
  
  const ipiValue = withIPI 
    ? (order.ipiValue || order.ipi_value || 0)
    : 0;
  
  const userName = order.user?.name || 'Usuário do Sistema';
  console.log("OrderDetail - Order user details:", {
    userId: order.userId || order.user_id,
    userName: order.user?.name,
    userObject: order.user
  });
  
  const taxSubstitutionValue = taxSubstitution ? (7.8 / 100) * order.subtotal : 0;

  // Check if any item has a different discount than total discount percentage
  // If all items have the same discount as total discount percentage, we'll hide the card
  const shouldShowDiscountCard = items.some(item => 
    item.discount !== item.totalDiscountPercentage
  );

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
            </div>
            <p className="text-muted-foreground">
              Criado em {format(new Date(order.createdAt || order.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-ferplas-500 hover:bg-ferplas-600 button-transition"
            onClick={() => navigate(`/orders/${id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar Pedido
          </Button>
          <Button 
            variant="outline" 
            onClick={handlePrintOrder}
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Pedido
          </Button>
          <Button 
            variant="outline" 
            onClick={handlePrintInvoice}
          >
            <Receipt className="mr-2 h-4 w-4" />
            Imprimir Faturamento
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
              <p className="text-lg font-semibold">
                {order.customer?.companyName || order.customers?.company_name || "Cliente não identificado"}
              </p>
              <p className="text-sm text-gray-500">
                CNPJ/CPF: {order.customer?.document || order.customers?.document || "N/A"}
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                Endereço
              </h3>
              <p className="text-md">
                {order.customer?.street || order.customers?.street || "Endereço não disponível"}, 
                {order.customer?.number || order.customers?.number || "S/N"}
                {(order.customer?.complement || order.customers?.complement) && 
                  ` - ${order.customer?.complement || order.customers?.complement}`}
              </p>
              {(order.customer?.neighborhood || order.customers?.neighborhood) && (
                <p className="text-md">
                  Bairro: {order.customer?.neighborhood || order.customers?.neighborhood}
                </p>
              )}
              <p className="text-md">
                {order.customer?.city || order.customers?.city || "Cidade não informada"}/
                {order.customer?.state || order.customers?.state || "Estado não informado"} - 
                {order.customer?.zipCode || order.customers?.zip_code || "CEP não informado"}
              </p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 flex items-center">
                  <Phone className="h-4 w-4 mr-1 text-gray-400" />
                  Telefone
                </h3>
                <p className="text-md">{formatPhoneNumber(order.customer?.phone || order.customers?.phone)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 flex items-center">
                  <Mail className="h-4 w-4 mr-1 text-gray-400" />
                  Email
                </h3>
                <p className="text-md">{order.customer?.email || order.customers?.email || "Não informado"}</p>
              </div>
            </div>
            
            {(order.customer?.id || order.customers?.id) && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(`/customers/${order.customer?.id || order.customers?.id}`)}
              >
                <User className="mr-2 h-4 w-4" />
                Ver Detalhes do Cliente
              </Button>
            )}
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
                    {format(new Date(order.createdAt || order.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-sm text-gray-500">Por {userName}</p>
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
                      {format(new Date(new Date(order.createdAt || order.created_at).getTime() + 24 * 60 * 60 * 1000), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-gray-500">Por Administrador</p>
                  </div>
                </div>
              )}
              
              {order.status === 'invoiced' && (
                <div className="flex items-start">
                  <div className="min-w-8 min-h-8 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                    <Receipt className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">Pedido Faturado</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(new Date(order.createdAt || order.created_at).getTime() + 2 * 24 * 60 * 60 * 1000), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-gray-500">Por Financeiro</p>
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
                      {format(new Date(new Date(order.createdAt || order.created_at).getTime() + 3 * 24 * 60 * 60 * 1000), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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
                      {format(new Date(new Date(order.createdAt || order.created_at).getTime() + 2 * 24 * 60 * 60 * 1000), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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
                <span>Total dos Produtos:</span>
                <span>{formatCurrency(order.productsTotal || 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Descontos:</span>
                <span>-{formatCurrency(totalDiscount)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Subtotal Pedido:</span>
                <span>{formatCurrency(order.subtotal || 0)}</span>
              </div>
              {order.taxSubstitution && (
                <div className="flex justify-between text-sm text-amber-600">
                  <span>Substituição Tributária:</span>
                  <span>+{formatCurrency(order.taxSubstitutionTotal || 0)}</span>
                </div>
              )}
              {order.withIPI && (
                <div className="flex justify-between text-sm text-blue-600">
                  <span>IPI:</span>
                  <span>+{formatCurrency(order.ipiValue || 0)}</span>
                </div>
              )}
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Taxa de Entrega:</span>
                  <span>{formatCurrency(order.deliveryFee || 0)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-medium text-lg">
                <span>Total:</span>
                <span className="text-ferplas-600">{formatCurrency(order.total || 0)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Condições de Pagamento</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Forma de Pagamento:</span>
                  <span>{paymentMethod === 'cash' ? 'À Vista' : 'A Prazo'}</span>
                </div>
                {paymentMethod === 'credit' && (
                  <div className="flex justify-between text-sm">
                    <span>Prazos de Pagamento:</span>
                    <span>{paymentTerms || 'Não informado'}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Tipo de Nota:</span>
                  <span>{fullInvoice ? 'Nota Cheia' : 'Meia Nota'}</span>
                </div>
                {!fullInvoice && halfInvoicePercentage && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Percentual da Nota:</span>
                      <span>{halfInvoicePercentage}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tipo de Meia Nota:</span>
                      <span>{order.halfInvoiceType === 'quantity' ? 'Na Quantidade' : 'No Preço'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {shouldShowDiscountCard && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Descontos e Acréscimos Aplicados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Discount options applied globally */}
              {appliedDiscounts && appliedDiscounts.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Descontos Globais</h3>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <ul className="list-disc pl-5 space-y-1">
                      {appliedDiscounts.map((discount: any, index: number) => (
                        <li key={index} className="text-sm">
                          {discount.name}: <span className="font-medium text-red-600">{discount.value}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Special discounts per item */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Descontos por Item</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Desconto Padrão</TableHead>
                        <TableHead className="text-right">Desconto Especial</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.filter(item => item.discount !== item.totalDiscountPercentage).map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.product?.name || `Produto #${index + 1}`}</TableCell>
                          <TableCell className="text-right">{item.totalDiscountPercentage}%</TableCell>
                          <TableCell className="text-right font-medium text-red-600">{item.discount}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ... keep existing code for remaining content */}
    </div>
  );
};

export default OrderDetail;
