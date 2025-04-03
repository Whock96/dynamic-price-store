
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useOrders } from '@/context/OrderContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Order } from '@/types/types';
import { useOrderManagement } from '@/hooks/use-order-management';

const OrderUpdate = () => {
  const { id } = useParams<{ id: string }>();
  const { getOrderById, updateOrder, updateOrderStatus, isLoading: isLoadingFromContext } = useOrders();
  const { fetchOrderById, isLoading: isLoadingFromDb } = useOrderManagement();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [failedContextLoad, setFailedContextLoad] = useState(false);

  const loadOrder = async () => {
    if (!id) {
      toast.error("ID do pedido não encontrado");
      setIsLoading(false);
      return;
    }

    console.log(`[OrderUpdate] Loading order with ID: ${id}`);
    setIsLoading(true);
    
    // Try to get the order from context first
    const contextOrder = getOrderById(id);
    
    if (contextOrder) {
      console.log(`[OrderUpdate] Order found in context:`, contextOrder);
      setOrder(contextOrder);
      setStatus(contextOrder.status);
      setNotes(contextOrder.notes || contextOrder.observations || '');
      setFailedContextLoad(false);
    } else {
      // If not found in context, fetch directly from Supabase
      console.log(`[OrderUpdate] Order not found in context, fetching from Supabase...`);
      setFailedContextLoad(true);
      
      try {
        const supabaseOrder = await fetchOrderById(id);
        
        if (supabaseOrder) {
          console.log(`[OrderUpdate] Order fetched from Supabase:`, supabaseOrder);
          setOrder(supabaseOrder);
          setStatus(supabaseOrder.status);
          setNotes(supabaseOrder.notes || supabaseOrder.observations || '');
        } else {
          console.error(`[OrderUpdate] Order not found in Supabase`);
          toast.error("Pedido não encontrado");
        }
      } catch (error) {
        console.error(`[OrderUpdate] Error fetching order:`, error);
        toast.error("Erro ao carregar o pedido");
      }
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadOrder();
      toast.success("Dados do pedido atualizados");
    } catch (error) {
      toast.error("Erro ao atualizar os dados do pedido");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order || !id) {
      toast.error("Pedido não encontrado");
      return;
    }

    setIsRefreshing(true);
    
    try {
      // Atualizar status se ele foi alterado
      if (status !== order.status) {
        await updateOrderStatus(id, status as any);
      }

      // Atualizar notas se foram alteradas
      if (notes !== order.notes && notes !== order.observations) {
        await updateOrder(id, { notes });
      }

      toast.success('Pedido atualizado com sucesso');
      navigate(`/orders/${id}`);
    } catch (error) {
      console.error('[OrderUpdate] Error updating order:', error);
      toast.error('Erro ao atualizar pedido');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading || isLoadingFromContext) {
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
        <div className="flex space-x-4">
          <Button onClick={() => navigate('/orders')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para lista de pedidos
          </Button>
          
          {failedContextLoad && (
            <Button 
              onClick={handleRefresh}
              className="bg-ferplas-500 hover:bg-ferplas-600"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Tentar novamente
            </Button>
          )}
        </div>
      </div>
    );
  }

  const orderNumber = order.orderNumber || '—';

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
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Link to={`/orders/${id}`}>
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button 
            onClick={handleSubmit} 
            className="bg-ferplas-500 hover:bg-ferplas-600"
            disabled={isRefreshing}
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar
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
                    {order.customer?.companyName || "Cliente não especificado"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Data</label>
                  <div className="mt-1 border rounded-md p-3 bg-gray-50">
                    {formatDate(new Date(order.createdAt))}
                  </div>
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
                  {order.items && order.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <div className="font-medium">{item.product.name}</div>
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
                  {(order.deliveryFee || 0) > 0 && (
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-700">Taxa de entrega</span>
                      <span>{formatCurrency(order.deliveryFee || 0)}</span>
                    </div>
                  )}
                  {(order.withIPI && order.ipiValue && order.ipiValue > 0) && (
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-700">IPI</span>
                      <span>{formatCurrency(order.ipiValue)}</span>
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
    </div>
  );
};

export default OrderUpdate;
