
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useOrders } from '@/context/OrderContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupabaseData } from '@/hooks/use-supabase-data';

const OrderUpdate = () => {
  const { id } = useParams<{ id: string }>();
  const { getOrderById, updateOrder, updateOrderStatus, isLoading } = useOrders();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [withIPI, setWithIPI] = useState(false);
  
  // Use direct Supabase data for backup if context fails
  const { data: supabaseOrders, isLoading: isLoadingSupabase } = useSupabaseData('orders', {
    select: '*',
    filterKey: 'id',
    filterValue: id || '',
  });

  useEffect(() => {
    // First try to get the order from the context
    if (!isLoading && id) {
      const foundOrder = getOrderById(id);
      if (foundOrder) {
        console.log("Found order for editing from context:", foundOrder);
        setOrder(foundOrder);
        setStatus(foundOrder.status || 'pending');
        setNotes(foundOrder.notes || foundOrder.observations || '');
        setWithIPI(foundOrder.withIPI || false);
      } else if (supabaseOrders && supabaseOrders.length > 0) {
        // Fall back to direct Supabase data if context doesn't have the order
        const supabaseOrder = supabaseOrders[0];
        console.log("Found order for editing from Supabase:", supabaseOrder);
        setOrder(supabaseOrder);
        setStatus(supabaseOrder.status || 'pending');
        setNotes(supabaseOrder.notes || supabaseOrder.observations || '');
        setWithIPI(supabaseOrder.with_ipi || false);
      } else {
        toast.error('Pedido não encontrado');
        navigate('/orders');
      }
    }
  }, [id, getOrderById, isLoading, supabaseOrders, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order || !id) return;

    const updates: any = {};

    // Update status if it was changed
    if (status !== order.status) {
      updateOrderStatus(id, status as any);
    }

    // Update notes if they were changed
    if (notes !== order.notes) {
      updates.notes = notes;
    }

    // Update IPI if it was changed
    if (withIPI !== order.withIPI) {
      updates.withIPI = withIPI;
    }

    // Only call updateOrder if there are changes to make
    if (Object.keys(updates).length > 0) {
      updateOrder(id, updates);
    }

    toast.success('Pedido atualizado com sucesso');
    navigate(`/orders/${id}`);
  };

  if (isLoading || isLoadingSupabase) {
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

  // Calculate order number display
  const orderNumber = order.orderNumber || (order.order_number ? order.order_number : id?.split('-')[0]);

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
          <Button onClick={handleSubmit} className="bg-ferplas-500 hover:bg-ferplas-600">
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
                    {order.customer?.companyName || order.customers?.company_name || "Cliente não encontrado"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Data</label>
                  <div className="mt-1 border rounded-md p-3 bg-gray-50">
                    {formatDate(order.createdAt || order.created_at)}
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

                <div className="flex items-center space-x-2 py-2">
                  <Switch 
                    id="with-ipi" 
                    checked={withIPI} 
                    onCheckedChange={setWithIPI} 
                  />
                  <Label htmlFor="with-ipi">IPI</Label>
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
                  {(order.withIPI || order.with_ipi) && (order.ipiValue || order.ipi_value) > 0 && (
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-700">IPI</span>
                      <span>{formatCurrency(order.ipiValue || order.ipi_value)}</span>
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
