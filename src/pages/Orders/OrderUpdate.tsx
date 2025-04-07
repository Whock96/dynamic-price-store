import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useOrders } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { useCustomers } from '@/context/CustomerContext';
import { useTransportCompanies } from '@/context/TransportCompanyContext';
import { CartItem, Order } from '@/types/types';
import { ArrowLeft, Save, ChevronsUpDown, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatters';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';

const OrderUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getOrderById, updateOrder, isLoading: orderLoading } = useOrders();
  const { getCustomerById } = useCustomers();
  const { companies } = useTransportCompanies();
  const { user, hasPermission } = useAuth();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFormTouched, setIsFormTouched] = useState(false);
  
  const [status, setStatus] = useState<Order['status']>('pending');
  const [shipping, setShipping] = useState<Order['shipping']>('pickup');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Order['paymentMethod']>('cash');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [fullInvoice, setFullInvoice] = useState(true);
  const [taxSubstitution, setTaxSubstitution] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState<'capital' | 'interior' | null>(null);
  const [halfInvoicePercentage, setHalfInvoicePercentage] = useState(50);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [withIPI, setWithIPI] = useState(false);
  const [ipiValue, setIpiValue] = useState(0);
  const [transportCompanyId, setTransportCompanyId] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    if (id) {
      const orderData = getOrderById(id);
      if (orderData) {
        setOrder(orderData);
        
        setStatus(orderData.status);
        setShipping(orderData.shipping);
        setNotes(orderData.notes || '');
        setPaymentMethod(orderData.paymentMethod);
        setPaymentTerms(orderData.paymentTerms || '');
        setFullInvoice(orderData.fullInvoice);
        setTaxSubstitution(orderData.taxSubstitution);
        setDeliveryLocation(orderData.deliveryLocation || null);
        setHalfInvoicePercentage(orderData.halfInvoicePercentage || 50);
        setDeliveryFee(orderData.deliveryFee || 0);
        setWithIPI(orderData.withIPI || false);
        setIpiValue(orderData.ipiValue || 0);
        setTransportCompanyId(orderData.transportCompanyId);
      } else {
        toast.error('Pedido não encontrado');
        navigate('/orders');
      }
    }
  }, [id, getOrderById, navigate]);
  
  useEffect(() => {
    setIsFormTouched(false);
  }, [order]);
  
  useEffect(() => {
    if (order) {
      const isChanged = 
        status !== order.status ||
        shipping !== order.shipping ||
        notes !== (order.notes || '') ||
        paymentMethod !== order.paymentMethod ||
        paymentTerms !== (order.paymentTerms || '') ||
        fullInvoice !== order.fullInvoice ||
        taxSubstitution !== order.taxSubstitution ||
        deliveryLocation !== order.deliveryLocation ||
        halfInvoicePercentage !== (order.halfInvoicePercentage || 50) ||
        deliveryFee !== (order.deliveryFee || 0) ||
        withIPI !== (order.withIPI || false) ||
        ipiValue !== (order.ipiValue || 0) ||
        transportCompanyId !== order.transportCompanyId;
      
      setIsFormTouched(isChanged);
    }
  }, [
    order, status, shipping, notes, paymentMethod, paymentTerms, 
    fullInvoice, taxSubstitution, deliveryLocation, halfInvoicePercentage,
    deliveryFee, withIPI, ipiValue, transportCompanyId
  ]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order || !id) return;
    
    setIsProcessing(true);
    
    const updatedOrder: Partial<Order> = {
      status,
      shipping,
      notes,
      paymentMethod,
      paymentTerms,
      fullInvoice,
      taxSubstitution,
      deliveryLocation,
      halfInvoicePercentage: !fullInvoice ? halfInvoicePercentage : undefined,
      deliveryFee: shipping === 'delivery' ? deliveryFee : 0,
      withIPI,
      ipiValue: withIPI ? ipiValue : 0,
      transportCompanyId: shipping === 'delivery' ? transportCompanyId : undefined
    };
    
    try {
      const success = await updateOrder(id, updatedOrder);
      
      if (success) {
        toast.success('Pedido atualizado com sucesso!');
        setIsFormTouched(false);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erro ao atualizar pedido');
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (!user) return null;
  
  if (!order) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800">Carregando...</h2>
          <p className="text-gray-600 mt-2">Aguarde enquanto buscamos os dados do pedido.</p>
        </div>
      </div>
    );
  }
  
  const customer = getCustomerById(order.customerId);
  
  if (!hasPermission('orders_edit')) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <h2 className="text-2xl font-semibold text-gray-800">Acesso Restrito</h2>
        <p className="mt-2 text-gray-600">Você não tem permissão para editar pedidos.</p>
        <Button asChild className="mt-4">
          <Link to={`/orders/${id}`}>Voltar para Detalhes</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <Link to={`/orders/${id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Editar Pedido #{order.orderNumber}</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Atualize informações como status, entrega, forma de pagamento e outros detalhes.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            asChild
          >
            <Link to={`/orders/${id}`}>Cancelar</Link>
          </Button>
          
          <Button 
            className="bg-ferplas-500 hover:bg-ferplas-600" 
            onClick={handleSubmit}
            disabled={isProcessing || !isFormTouched}
          >
            {isProcessing ? (
              <>
                <Save className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Detalhes do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status do Pedido</Label>
                  <div className="flex gap-2 items-center mt-1">
                    <OrderStatusBadge status={status} />
                    <Select value={status} onValueChange={(value: Order['status']) => setStatus(value)}>
                      <SelectTrigger className="w-full">
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
                  </div>
                </div>
                
                <div>
                  <Label>Cliente</Label>
                  <div className="mt-1 p-2 border rounded-md bg-gray-50">
                    <div className="font-medium">{customer?.companyName}</div>
                    <div className="text-sm text-gray-500">{formatDocument(customer?.document || '')}</div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label>Entrega</Label>
                    <div className="flex gap-4 mt-1">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="shipping-pickup" 
                          checked={shipping === 'pickup'}
                          onCheckedChange={() => setShipping('pickup')}
                        />
                        <Label htmlFor="shipping-pickup">Retirada</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="shipping-delivery" 
                          checked={shipping === 'delivery'}
                          onCheckedChange={() => setShipping('delivery')}
                        />
                        <Label htmlFor="shipping-delivery">Entrega</Label>
                      </div>
                    </div>
                  </div>
                  
                  {shipping === 'delivery' && (
                    <>
                      <div>
                        <Label>Local de Entrega</Label>
                        <div className="flex gap-4 mt-1">
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id="location-capital" 
                              checked={deliveryLocation === 'capital'}
                              onCheckedChange={() => setDeliveryLocation('capital')}
                            />
                            <Label htmlFor="location-capital">Capital</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id="location-interior" 
                              checked={deliveryLocation === 'interior'}
                              onCheckedChange={() => setDeliveryLocation('interior')}
                            />
                            <Label htmlFor="location-interior">Interior</Label>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="delivery-fee">Taxa de Entrega</Label>
                        <div className="relative mt-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">R$</span>
                          </div>
                          <Input
                            id="delivery-fee"
                            type="number"
                            className="pl-10"
                            step="0.01"
                            min="0"
                            value={deliveryFee}
                            onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="transport-company">Transportadora</Label>
                        <Select 
                          value={transportCompanyId} 
                          onValueChange={(value) => setTransportCompanyId(value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione uma transportadora" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Nenhuma</SelectItem>
                            {companies.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label>Faturamento</Label>
                    <div className="flex gap-4 mt-1">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="full-invoice" 
                          checked={fullInvoice}
                          onCheckedChange={() => setFullInvoice(true)}
                        />
                        <Label htmlFor="full-invoice">Nota Cheia</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="half-invoice" 
                          checked={!fullInvoice}
                          onCheckedChange={() => setFullInvoice(false)}
                        />
                        <Label htmlFor="half-invoice">Meia Nota</Label>
                      </div>
                    </div>
                  </div>
                  
                  {!fullInvoice && (
                    <div>
                      <Label htmlFor="half-invoice-percentage">Porcentagem da Meia Nota</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id="half-invoice-percentage"
                          type="number"
                          min="1"
                          max="99"
                          value={halfInvoicePercentage}
                          onChange={(e) => setHalfInvoicePercentage(parseInt(e.target.value) || 50)}
                        />
                        <span>%</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="tax-substitution" 
                      checked={taxSubstitution}
                      onCheckedChange={(checked) => setTaxSubstitution(checked)}
                    />
                    <Label htmlFor="tax-substitution">Substituição Tributária</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="with-ipi" 
                      checked={withIPI}
                      onCheckedChange={(checked) => setWithIPI(checked)}
                    />
                    <Label htmlFor="with-ipi">Incluir IPI</Label>
                  </div>
                  
                  {withIPI && (
                    <div>
                      <Label htmlFor="ipi-value">Valor do IPI</Label>
                      <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">R$</span>
                        </div>
                        <Input
                          id="ipi-value"
                          type="number"
                          className="pl-10"
                          step="0.01"
                          min="0"
                          value={ipiValue}
                          onChange={(e) => setIpiValue(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Forma de Pagamento</Label>
                  <div className="flex gap-4 mt-1">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="payment-cash" 
                        checked={paymentMethod === 'cash'}
                        onCheckedChange={() => setPaymentMethod('cash')}
                      />
                      <Label htmlFor="payment-cash">À Vista</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="payment-credit" 
                        checked={paymentMethod === 'credit'}
                        onCheckedChange={() => setPaymentMethod('credit')}
                      />
                      <Label htmlFor="payment-credit">A Prazo</Label>
                    </div>
                  </div>
                </div>
                
                {paymentMethod === 'credit' && (
                  <div>
                    <Label htmlFor="payment-terms">Prazo de Pagamento</Label>
                    <Input
                      id="payment-terms"
                      placeholder="Exemplo: 30/60/90 dias"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Observações adicionais sobre o pedido..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Itens</h3>
                <div className="mt-2 space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.product?.name} (x{item.quantity})</span>
                      <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-red-600">
                  <span>Descontos:</span>
                  <span>-{formatCurrency(order.totalDiscount || 0)}</span>
                </div>
                
                {shipping === 'delivery' && deliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Taxa de Entrega:</span>
                    <span>{formatCurrency(deliveryFee)}</span>
                  </div>
                )}
                
                {withIPI && ipiValue > 0 && (
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>IPI:</span>
                    <span>+{formatCurrency(ipiValue)}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-bold text-base mt-2 border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mt-2">
                <p>* O valor final pode mudar quando os itens são modificados.</p>
                <p>* Para alterar itens, crie um novo pedido.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderUpdate;
