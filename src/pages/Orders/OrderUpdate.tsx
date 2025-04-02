
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase, Tables } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

// Define custom types that include joined tables
interface OrderWithDetails extends Tables<'orders'> {
  customers: Tables<'customers'>;
  items: OrderItemWithProduct[];
  discounts: DiscountOption[];
}

interface OrderItemWithProduct extends Tables<'order_items'> {
  products: Tables<'products'>;
}

interface DiscountOption extends Tables<'discount_options'> {}

const OrderUpdate = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [statusOptions] = useState(['pending', 'confirmed', 'invoiced', 'completed', 'canceled']);
  
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [observations, setObservations] = useState('');

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      // Fetch order with customer details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          customers(*)
        `)
        .eq('id', id)
        .single();

      if (orderError) throw orderError;
      if (!orderData) throw new Error("Order not found");

      // Fetch order items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products(*)
        `)
        .eq('order_id', id);

      if (itemsError) throw itemsError;

      // Fetch discount options applied to this order
      const { data: discountData, error: discountError } = await supabase
        .from('order_discounts')
        .select(`
          discount_id
        `)
        .eq('order_id', id);

      if (discountError) throw discountError;

      // Fetch full discount details
      let discounts: DiscountOption[] = [];
      if (discountData && discountData.length > 0) {
        const discountIds = discountData.map(d => d.discount_id);
        const { data: discountDetails, error: discountDetailsError } = await supabase
          .from('discount_options')
          .select('*')
          .in('id', discountIds);

        if (discountDetailsError) throw discountDetailsError;
        discounts = discountDetails as DiscountOption[];
      }

      // Combine all data
      const fullOrder = {
        ...orderData,
        items: itemsData || [],
        discounts: discounts || []
      } as OrderWithDetails;

      setOrder(fullOrder);
      setStatus(fullOrder.status);
      setNotes(fullOrder.notes || '');
      setObservations(fullOrder.observations || '');
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Erro ao carregar dados do pedido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!order || !id) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: status as 'pending' | 'confirmed' | 'invoiced' | 'completed' | 'canceled',
          notes,
          observations,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Pedido atualizado com sucesso');
      navigate(`/orders/${id}`);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erro ao atualizar pedido');
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', {locale: ptBR});
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Skeleton className="h-8 w-48" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="text-xl font-semibold">Pedido não encontrado</h2>
        <p className="text-muted-foreground mb-4">O pedido solicitado não foi encontrado ou foi removido.</p>
        <Button onClick={() => navigate('/orders')}>Voltar para Pedidos</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Atualizar Pedido #{order.order_number}</h1>
        </div>
        <Button onClick={handleSave} className="bg-ferplas-500 hover:bg-ferplas-600">
          <Save className="mr-2 h-4 w-4" /> Salvar Alterações
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status do Pedido</Label>
                  <Select 
                    value={status} 
                    onValueChange={(value) => setStatus(value)}
                  >
                    <SelectTrigger className="w-full" id="status">
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          <div className="flex items-center">
                            <OrderStatusBadge status={option as any} />
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data de Criação</Label>
                  <Input 
                    value={formatDate(order.created_at)} 
                    disabled 
                    className="bg-muted"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea 
                  id="notes" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione notas sobre este pedido"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="observations">Observações</Label>
                <Textarea 
                  id="observations" 
                  value={observations} 
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Observações adicionais"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Cliente</h4>
                <p className="text-base">{order.customers?.company_name}</p>
                <p className="text-sm text-muted-foreground">{order.customers?.document}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Valores</h4>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Descontos:</span>
                  <span className="font-medium">{formatCurrency(order.total_discount)}</span>
                </div>
                <div className="flex justify-between items-center border-t mt-1 pt-1">
                  <span className="text-base font-medium">Total:</span>
                  <span className="text-base font-bold">{formatCurrency(order.total)}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Detalhes</h4>
                <div className="text-sm space-y-1">
                  <p>Forma de envio: {order.shipping === 'delivery' ? 'Entrega' : 'Retirada'}</p>
                  <p>Forma de pagamento: {order.payment_method === 'cash' ? 'À Vista' : 'A Prazo'}</p>
                  {order.payment_method === 'credit' && order.payment_terms && (
                    <p>Condições de pagamento: {order.payment_terms}</p>
                  )}
                  {order.shipping === 'delivery' && order.delivery_location && (
                    <p>Local de entrega: {order.delivery_location === 'capital' ? 'Capital' : 'Interior'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderUpdate;
