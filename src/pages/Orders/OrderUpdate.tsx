
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOrders } from '@/context/OrderContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { formatDocument } from '@/utils/formatters';
import { useTransportCompanies } from '@/context/TransportCompanyContext';
import { toast } from 'sonner';

// Definição do esquema de validação
const orderUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'invoiced', 'completed', 'canceled']),
  shipping: z.enum(['delivery', 'pickup']),
  fullInvoice: z.boolean(),
  taxSubstitution: z.boolean(),
  paymentMethod: z.enum(['cash', 'credit']),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  observations: z.string().optional(),
  deliveryLocation: z.enum(['capital', 'interior']).optional().nullable(),
  halfInvoicePercentage: z.number().min(0).max(100).optional(),
  deliveryFee: z.number().min(0).optional(),
  withIPI: z.boolean(),
  ipiValue: z.number().min(0).optional(),
  transportCompanyId: z.string().optional().nullable(),
});

type OrderUpdateFormValues = z.infer<typeof orderUpdateSchema>;

const OrderUpdate = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOrderById, updateOrder } = useOrders();
  const { user, hasPermission } = useAuth();
  const { companies, isLoading: isLoadingCompanies } = useTransportCompanies();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDelivery, setIsDelivery] = useState(true);
  const [isFullInvoice, setIsFullInvoice] = useState(true);
  const [isWithIPI, setIsWithIPI] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<OrderUpdateFormValues>({
    resolver: zodResolver(orderUpdateSchema),
    defaultValues: {
      status: 'pending',
      shipping: 'delivery',
      fullInvoice: true,
      taxSubstitution: false,
      paymentMethod: 'cash',
      paymentTerms: '',
      notes: '',
      observations: '',
      deliveryLocation: null,
      halfInvoicePercentage: 0,
      deliveryFee: 0,
      withIPI: false,
      ipiValue: 0,
      transportCompanyId: null,
    }
  });

  const shipping = watch('shipping');
  const fullInvoice = watch('fullInvoice');
  const withIPI = watch('withIPI');

  useEffect(() => {
    setIsDelivery(shipping === 'delivery');
  }, [shipping]);

  useEffect(() => {
    setIsFullInvoice(fullInvoice);
  }, [fullInvoice]);

  useEffect(() => {
    setIsWithIPI(withIPI);
  }, [withIPI]);

  useEffect(() => {
    if (id) {
      const order = getOrderById(id);
      if (order) {
        reset({
          status: order.status,
          shipping: order.shipping,
          fullInvoice: order.fullInvoice,
          taxSubstitution: order.taxSubstitution,
          paymentMethod: order.paymentMethod,
          paymentTerms: order.paymentTerms || '',
          notes: order.notes || '',
          observations: order.observations || '',
          deliveryLocation: order.deliveryLocation,
          halfInvoicePercentage: order.halfInvoicePercentage || 0,
          deliveryFee: order.deliveryFee || 0,
          withIPI: order.withIPI || false,
          ipiValue: order.ipiValue || 0,
          transportCompanyId: order.transportCompanyId || null,
        });
        
        setIsDelivery(order.shipping === 'delivery');
        setIsFullInvoice(order.fullInvoice);
        setIsWithIPI(order.withIPI || false);
      }
    }
  }, [id, getOrderById, reset]);

  const onSubmit = async (data: OrderUpdateFormValues) => {
    if (!id) return;
    
    setIsSubmitting(true);
    
    try {
      await updateOrder(id, {
        ...data,
        deliveryLocation: isDelivery ? data.deliveryLocation : null,
        halfInvoicePercentage: !isFullInvoice ? data.halfInvoicePercentage : undefined,
        ipiValue: isWithIPI ? data.ipiValue : 0,
        transportCompanyId: isDelivery ? data.transportCompanyId : null,
      });
      
      toast.success('Pedido atualizado com sucesso!');
      navigate(`/orders/${id}`);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erro ao atualizar pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!id) {
    return <div>Pedido não encontrado</div>;
  }

  const order = getOrderById(id);
  
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Pedido não encontrado</h2>
        <p className="text-gray-600 mb-4">O pedido solicitado não existe ou você não tem permissão para editá-lo.</p>
        <Button 
          onClick={() => navigate('/orders')}
          className="bg-ferplas-500 hover:bg-ferplas-600"
        >
          Voltar para a lista de pedidos
        </Button>
      </div>
    );
  }

  if (!hasPermission('orders_manage')) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso Restrito</h2>
        <p className="text-gray-600 mb-4">Você não tem permissão para editar pedidos.</p>
        <Button 
          onClick={() => navigate(`/orders/${id}`)}
          className="bg-ferplas-500 hover:bg-ferplas-600"
        >
          Voltar para detalhes do pedido
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Editar Pedido #{order.orderNumber}
          </h1>
          <p className="text-muted-foreground">
            Cliente: {order.customer.companyName} ({formatDocument(order.customer.document)})
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/orders/${id}`)}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="bg-ferplas-500 hover:bg-ferplas-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={watch('status')}
                  onValueChange={(value) => setValue('status', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="invoiced">Faturado</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="canceled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="shipping">Tipo de Entrega</Label>
                <Select
                  value={watch('shipping')}
                  onValueChange={(value) => setValue('shipping', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de entrega" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delivery">Entrega</SelectItem>
                    <SelectItem value="pickup">Retirada</SelectItem>
                  </SelectContent>
                </Select>
                {errors.shipping && (
                  <p className="text-red-500 text-sm mt-1">{errors.shipping.message}</p>
                )}
              </div>

              {isDelivery && (
                <div>
                  <Label htmlFor="deliveryLocation">Local de Entrega</Label>
                  <Select
                    value={watch('deliveryLocation') || ''}
                    onValueChange={(value) => setValue('deliveryLocation', value === '' ? null : value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o local de entrega" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Não especificado</SelectItem>
                      <SelectItem value="capital">Capital</SelectItem>
                      <SelectItem value="interior">Interior</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.deliveryLocation && (
                    <p className="text-red-500 text-sm mt-1">{errors.deliveryLocation.message}</p>
                  )}
                </div>
              )}

              {isDelivery && (
                <div>
                  <Label htmlFor="transportCompanyId">Transportadora</Label>
                  <Select
                    value={watch('transportCompanyId') || ''}
                    onValueChange={(value) => setValue('transportCompanyId', value === '' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma transportadora" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma transportadora</SelectItem>
                      {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.transportCompanyId && (
                    <p className="text-red-500 text-sm mt-1">{errors.transportCompanyId.message}</p>
                  )}
                </div>
              )}

              {isDelivery && (
                <div>
                  <Label htmlFor="deliveryFee">Taxa de Entrega (R$)</Label>
                  <Input
                    id="deliveryFee"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("deliveryFee", { valueAsNumber: true })}
                  />
                  {errors.deliveryFee && (
                    <p className="text-red-500 text-sm mt-1">{errors.deliveryFee.message}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagamento e Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                <Select
                  value={watch('paymentMethod')}
                  onValueChange={(value) => setValue('paymentMethod', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">À vista</SelectItem>
                    <SelectItem value="credit">A prazo</SelectItem>
                  </SelectContent>
                </Select>
                {errors.paymentMethod && (
                  <p className="text-red-500 text-sm mt-1">{errors.paymentMethod.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="paymentTerms">Condições de Pagamento</Label>
                <Input
                  id="paymentTerms"
                  placeholder="Ex: 30/60/90 dias"
                  {...register("paymentTerms")}
                />
                {errors.paymentTerms && (
                  <p className="text-red-500 text-sm mt-1">{errors.paymentTerms.message}</p>
                )}
              </div>

              <Separator />

              <div className="flex items-center space-x-2">
                <Switch
                  id="fullInvoice"
                  checked={watch('fullInvoice')}
                  onCheckedChange={(checked) => setValue('fullInvoice', checked)}
                />
                <Label htmlFor="fullInvoice">Nota fiscal completa</Label>
              </div>

              {!isFullInvoice && (
                <div>
                  <Label htmlFor="halfInvoicePercentage">Percentual da Nota (%)</Label>
                  <Input
                    id="halfInvoicePercentage"
                    type="number"
                    min="0"
                    max="100"
                    {...register("halfInvoicePercentage", { valueAsNumber: true })}
                  />
                  {errors.halfInvoicePercentage && (
                    <p className="text-red-500 text-sm mt-1">{errors.halfInvoicePercentage.message}</p>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="taxSubstitution"
                  checked={watch('taxSubstitution')}
                  onCheckedChange={(checked) => setValue('taxSubstitution', checked)}
                />
                <Label htmlFor="taxSubstitution">Substituição tributária</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="withIPI"
                  checked={watch('withIPI')}
                  onCheckedChange={(checked) => setValue('withIPI', checked)}
                />
                <Label htmlFor="withIPI">Com IPI</Label>
              </div>

              {isWithIPI && (
                <div>
                  <Label htmlFor="ipiValue">Valor do IPI (R$)</Label>
                  <Input
                    id="ipiValue"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("ipiValue", { valueAsNumber: true })}
                  />
                  {errors.ipiValue && (
                    <p className="text-red-500 text-sm mt-1">{errors.ipiValue.message}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="observations">Observações do Pedido (visíveis para o cliente)</Label>
                <Textarea
                  id="observations"
                  placeholder="Adicione observações sobre o pedido aqui..."
                  className="min-h-[100px]"
                  {...register("observations")}
                />
                {errors.observations && (
                  <p className="text-red-500 text-sm mt-1">{errors.observations.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Notas Internas (visíveis apenas para a empresa)</Label>
                <Textarea
                  id="notes"
                  placeholder="Adicione notas internas aqui..."
                  className="min-h-[100px]"
                  {...register("notes")}
                />
                {errors.notes && (
                  <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderUpdate;
