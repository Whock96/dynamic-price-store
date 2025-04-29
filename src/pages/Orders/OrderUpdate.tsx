
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useOrders } from '@/context/OrderContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrderData } from '@/hooks/use-order-data';
import { supabase, uploadInvoicePdf, deleteInvoicePdf } from '@/integrations/supabase/client';
import { User, TransportCompany, Order } from '@/types/types';
import { FileUpload } from '@/components/ui/file-upload';

const OrderUpdate = () => {
  const { id } = useParams<{ id: string }>();
  const { updateOrder, updateOrderStatus } = useOrders();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [shipping, setShipping] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [salespeople, setSalespeople] = useState<User[]>([]);
  const [selectedSalespersonId, setSelectedSalespersonId] = useState<string>('none');
  const [isLoadingSalespeople, setIsLoadingSalespeople] = useState(true);
  const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([]);
  const [selectedTransportCompanyId, setSelectedTransportCompanyId] = useState<string>('none');
  const [isLoadingTransportCompanies, setIsLoadingTransportCompanies] = useState(true);
  
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoicePdf, setInvoicePdf] = useState<File | null>(null);
  const [invoicePdfPath, setInvoicePdfPath] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingPdf, setIsDeletingPdf] = useState(false);
  
  const { order, isLoading, fetchOrderData } = useOrderData(id);

  useEffect(() => {
    const fetchSalespeople = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, username, user_type_id');
          
        if (error) throw error;
        
        if (data) {
          const mappedSalespeople: User[] = data.map(sp => ({
            id: sp.id,
            name: sp.name,
            username: sp.username,
            role: 'salesperson',
            permissions: [],
            email: '',
            createdAt: new Date(),
            userTypeId: sp.user_type_id || ''
          }));
          
          setSalespeople(mappedSalespeople);
        }
      } catch (error) {
        console.error('Error fetching salespeople:', error);
        toast.error('Erro ao carregar vendedores');
      } finally {
        setIsLoadingSalespeople(false);
      }
    };
    
    fetchSalespeople();
  }, []);

  useEffect(() => {
    const fetchTransportCompanies = async () => {
      try {
        const { data, error } = await supabase
          .from('transport_companies')
          .select('*');
          
        if (error) throw error;
        
        if (data) {
          setTransportCompanies(data as TransportCompany[]);
        }
      } catch (error) {
        console.error('Error fetching transport companies:', error);
        toast.error('Erro ao carregar transportadoras');
      } finally {
        setIsLoadingTransportCompanies(false);
      }
    };
    
    fetchTransportCompanies();
  }, []);

  useEffect(() => {
    if (order) {
      setStatus(order.status || 'pending');
      setNotes(order.notes || order.observations || '');
      setShipping((order.shipping || 'delivery') as 'delivery' | 'pickup');
      setPaymentMethod((order.paymentMethod || 'cash') as 'cash' | 'credit');
      setPaymentTerms(order.paymentTerms || '');
      setSelectedSalespersonId(order.userId || 'none');
      setSelectedTransportCompanyId(order.transportCompanyId ? order.transportCompanyId : 'none');
      
      setInvoiceNumber(order.invoiceNumber || '');
      setInvoicePdfPath(order.invoicePdfPath || null);
      
      console.log("[ORDER UPDATE] Loading order data:", {
        orderId: order.id,
        invoiceNumber: order.invoiceNumber,
        invoicePdfPath: order.invoicePdfPath
      });
    }
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order || !id) return;
    
    const updates: Partial<Order> = {};

    if (status !== order.status) {
      updateOrderStatus(id, status as any);
    }

    if (notes !== order.notes) updates.notes = notes;
    if (shipping !== order.shipping) updates.shipping = shipping;
    if (paymentMethod !== order.paymentMethod) updates.paymentMethod = paymentMethod;
    if (paymentTerms !== order.paymentTerms) updates.paymentTerms = paymentTerms;
    if (selectedSalespersonId !== order.userId) {
      updates.userId = selectedSalespersonId === 'none' ? null : selectedSalespersonId;
    }
    if (selectedTransportCompanyId !== order.transportCompanyId) {
      updates.transportCompanyId = selectedTransportCompanyId === 'none' ? null : selectedTransportCompanyId;
    }
    if (invoiceNumber !== (order.invoiceNumber || '')) {
      updates.invoiceNumber = invoiceNumber.trim() || null;
    }

    if (invoicePdf) {
      setIsUploading(true);
      try {
        console.log('[ORDER UPDATE] Trying to upload invoice PDF:', invoicePdf.name);
        const publicUrl = await uploadInvoicePdf(invoicePdf, id);
        console.log('[ORDER UPDATE] Upload successful, URL received:', publicUrl);
        
        if (!publicUrl) {
          throw new Error('Failed to upload invoice file');
        }
        
        updates.invoicePdfPath = publicUrl;
        console.log('[ORDER UPDATE] Invoice PDF URL updated:', publicUrl);
      } catch (error: any) {
        console.error('[ORDER UPDATE] Error uploading invoice PDF:', error);
        let errorMessage = error.message || 'Unknown error';
        toast.error(`Error uploading invoice file: ${errorMessage}`);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    if (Object.keys(updates).length > 0) {
      try {
        console.log('[ORDER UPDATE] Updating order with new data:', updates);
        await updateOrder(id, updates);
        toast.success('Pedido atualizado com sucesso');
        navigate(`/orders/${id}`);
      } catch (error: any) {
        console.error('Error updating order:', error);
        toast.error(`Erro ao atualizar pedido: ${error.message || 'Erro desconhecido'}`);
      }
    } else {
      toast.info('Nenhuma alteração foi feita');
      navigate(`/orders/${id}`);
    }
  };

  const handlePdfDelete = async () => {
    if (!id || !invoicePdfPath) return;
    
    setIsDeletingPdf(true);
    try {
      console.log('[INVOICE PDF] Trying to delete invoice PDF:', invoicePdfPath);
      const deleteSuccess = await deleteInvoicePdf(invoicePdfPath);
      
      if (!deleteSuccess) {
        throw new Error('Failed to delete invoice PDF file');
      }
      
      await updateOrder(id, { invoicePdfPath: null });
      
      setInvoicePdfPath(null);
      setInvoicePdf(null);
      
      toast.success('Invoice PDF file deleted successfully');
      console.log('[INVOICE PDF] Invoice PDF deleted successfully');
      
      if (fetchOrderData) {
        await fetchOrderData();
      }
    } catch (error: any) {
      console.error('[INVOICE PDF] Error deleting invoice PDF:', error);
      toast.error(`Error deleting invoice file: ${error.message || 'Unknown error'}`);
    } finally {
      setIsDeletingPdf(false);
    }
  };

  const handleShippingChange = (value: string) => {
    if (value === 'delivery' || value === 'pickup') {
      setShipping(value);
    }
  };

  const handlePaymentMethodChange = (value: string) => {
    if (value === 'cash' || value === 'credit') {
      setPaymentMethod(value);
    }
  };

  if (isLoading || isLoadingSalespeople || isLoadingTransportCompanies) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold mb-2">Pedido não encontrado</h2>
        <p className="text-muted-foreground mb-6">O pedido solicitado não foi encontrado.</p>
        <Button onClick={() => navigate('/orders')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para lista de pedidos
        </Button>
      </div>
    );
  }

  const orderNumber = order.orderNumber || id?.split('-')[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Editar Pedido #{orderNumber}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/orders/${id}`}>
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button 
            onClick={handleSubmit} 
            className="bg-ferplas-500 hover:bg-ferplas-600"
            disabled={isUploading || isDeletingPdf}
          >
            <Save className="mr-2 h-4 w-4" />
            {isUploading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Informações do Pedido</span>
            <OrderStatusBadge status={status as any} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Detalhes</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Cliente</label>
                  <div className="mt-1 border rounded-md p-3 bg-gray-50">
                    {order.customer?.companyName || "Cliente não encontrado"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Data</label>
                  <div className="mt-1 border rounded-md p-3 bg-gray-50">
                    {formatDate(order.createdAt)}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Vendedor</label>
                  <Select 
                    value={selectedSalespersonId} 
                    onValueChange={setSelectedSalespersonId}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Selecione um vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {salespeople.map((sp) => (
                        <SelectItem key={sp.id} value={sp.id}>
                          {sp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Transportadora</label>
                  <Select 
                    value={selectedTransportCompanyId} 
                    onValueChange={setSelectedTransportCompanyId}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Selecione uma transportadora" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {transportCompanies.map((tc) => (
                        <SelectItem key={tc.id} value={tc.id}>
                          {tc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="invoiced">Faturado</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="canceled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Forma de Entrega</label>
                  <Select value={shipping} onValueChange={handleShippingChange}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Selecione a forma de entrega" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delivery">Entrega</SelectItem>
                      <SelectItem value="pickup">Retirada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Forma de Pagamento</label>
                  <Select value={paymentMethod} onValueChange={handlePaymentMethodChange}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">À Vista</SelectItem>
                      <SelectItem value="credit">A Prazo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentMethod === 'credit' && (
                  <div>
                    <label className="text-sm font-medium">Condições de Pagamento</label>
                    <Input
                      className="mt-1"
                      placeholder="Ex: 30/60/90 dias"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Observações</label>
                  <Textarea 
                    className="mt-1" 
                    placeholder="Observações sobre o pedido"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Resumo do Pedido</h3>
              <div className="border rounded-md overflow-hidden">
                <div className="bg-gray-50 p-4">
                  <h4 className="font-medium">Itens</h4>
                </div>
                <div className="p-4 space-y-3">
                  {order.items && order.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <div className="font-medium">
                          {item.product?.name || "Produto não encontrado"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.quantity} x {formatCurrency(item.finalPrice)}
                        </div>
                      </div>
                      <div className="font-medium">{formatCurrency(item.subtotal)}</div>
                    </div>
                  ))}
                </div>
                <div className="border-t p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-700">Subtotal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-700">Desconto total</span>
                    <span>- {formatCurrency(order.totalDiscount)}</span>
                  </div>
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-700">Taxa de entrega</span>
                      <span>{formatCurrency(order.deliveryFee)}</span>
                    </div>
                  )}
                  {order.taxSubstitution && (
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-700">Substituição Tributária</span>
                      <span>+ {formatCurrency((7.8 / 100) * order.subtotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold mt-4 pt-4 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações de Faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invoiceNumber">Número da Nota Fiscal</Label>
              <Input
                id="invoiceNumber"
                className="mt-1"
                placeholder="Informe o número da NFe"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                disabled={isUploading || isDeletingPdf}
              />
            </div>
            
            <div>
              <Label>Arquivo PDF da NFe</Label>
              <FileUpload
                onChange={(file) => {
                  console.log('[ORDER UPDATE] Invoice file selected:', file?.name);
                  setInvoicePdf(file);
                }}
                value={invoicePdfPath}
                accept="application/pdf,.pdf"
                maxSize={10}
                isLoading={isUploading || isDeletingPdf}
                onDelete={invoicePdfPath ? handlePdfDelete : undefined}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formatos aceitos: PDF. Tamanho máximo: 10MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderUpdate;
