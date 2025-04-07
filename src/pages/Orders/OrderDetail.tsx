
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Phone, Mail, CreditCard, Calendar, Truck, Tag, Check, Badge, 
  Clipboard, Hourglass, Loader2
} from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { useTransportCompanies } from '@/context/TransportCompanyContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import PrintableOrder from '@/components/orders/PrintableOrder';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate, formatPhone } from '@/utils/formatters';
import { CartItem, TransportCompany } from '@/types/types';
import { toast } from 'sonner';

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOrderById, updateOrderStatus, isLoading } = useOrders();
  const { user, hasPermission } = useAuth();
  const { getCompanyById } = useTransportCompanies();
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  if (!id) {
    return <div>Pedido não encontrado</div>;
  }

  const order = getOrderById(id);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ferplas-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Pedido não encontrado</h2>
        <p className="text-gray-600 mb-4">O pedido solicitado não existe ou você não tem permissão para visualizá-lo.</p>
        <Button 
          onClick={() => navigate('/orders')}
          className="bg-ferplas-500 hover:bg-ferplas-600"
        >
          Voltar para a lista de pedidos
        </Button>
      </div>
    );
  }

  const transportCompany = order.transportCompanyId 
    ? getCompanyById(order.transportCompanyId) 
    : undefined;

  const handleStatusUpdate = async (status: "pending" | "confirmed" | "invoiced" | "completed" | "canceled") => {
    if (!id) return;
    
    setIsStatusUpdating(true);
    
    if (status === 'canceled' && !isConfirmingCancel) {
      setIsConfirmingCancel(true);
      setIsStatusUpdating(false);
      return;
    }
    
    if (status === 'canceled' && isConfirmingCancel) {
      setIsConfirmingCancel(false);
    }
    
    try {
      await updateOrderStatus(id, status);
      toast.success(`Status do pedido atualizado para ${status}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Erro ao atualizar status do pedido');
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const renderIpiInfo = () => {
    if (!order.withIPI) return null;
    
    return (
      <div className="mt-2 text-sm">
        <span className="text-gray-500">IPI:</span> {formatCurrency(order.ipiValue || 0)}
      </div>
    );
  };

  const renderPaymentTerms = () => {
    if (!order.paymentTerms) return 'Não informado';
    
    return order.paymentTerms;
  };

  const renderHalfInvoiceInfo = () => {
    if (order.fullInvoice) return null;
    
    return (
      <div className="mt-2 text-sm">
        <span className="text-gray-500">Faturamento parcial:</span> {order.halfInvoicePercentage || 0}%
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      {isPrintMode ? (
        <div className="print-container">
          <div className="print-controls mb-4 flex justify-between items-center bg-white p-4 rounded-lg shadow-sm print:hidden">
            <Button
              variant="outline"
              onClick={() => setIsPrintMode(false)}
            >
              Voltar
            </Button>
            <Button
              onClick={() => window.print()}
              className="bg-ferplas-500 hover:bg-ferplas-600"
            >
              Imprimir
            </Button>
          </div>
          <PrintableOrder order={order} transportCompany={transportCompany} />
        </div>
      ) : (
        <>
          <header className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Pedido #{order.orderNumber}
              </h1>
              <p className="text-muted-foreground">
                {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {order.status !== 'completed' && order.status !== 'canceled' && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/orders/${id}/edit`)}
                  disabled={!hasPermission('orders_manage')}
                >
                  Editar
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setIsPrintMode(true)}
              >
                Imprimir
              </Button>
              <Button
                className="bg-ferplas-500 hover:bg-ferplas-600"
                onClick={() => navigate('/orders')}
              >
                Voltar
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status e informações gerais */}
            <Card className="md:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span>Status</span>
                  <OrderStatusBadge status={order.status} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap justify-between items-start gap-4">
                  {/* Cliente e Vendedor */}
                  <div className="flex-1 min-w-[250px]">
                    <h3 className="font-semibold text-lg mb-2">Cliente</h3>
                    <div className="space-y-2">
                      <p className="text-lg font-medium">{order.customer.companyName}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Badge className="mr-2">{order.customer.document}</Badge>
                      </div>
                      {order.customer.phone && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="w-4 h-4 mr-2" />
                          {formatPhone(order.customer.phone)}
                        </div>
                      )}
                      {order.customer.email && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="w-4 h-4 mr-2" />
                          {order.customer.email}
                        </div>
                      )}
                    </div>
                    <Separator className="my-3" />
                    <h3 className="font-semibold text-lg mb-2">Vendedor</h3>
                    <p className="text-base">{order.user?.name || 'Não informado'}</p>
                  </div>

                  {/* Pagamento e entrega */}
                  <div className="flex-1 min-w-[250px]">
                    <h3 className="font-semibold text-lg mb-2">Pagamento</h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <CreditCard className="w-4 h-4 mr-2" />
                        <span className="text-gray-500">Forma de pagamento:</span>
                        <span className="ml-2">
                          {order.paymentMethod === 'cash' ? 'À vista' : 'A prazo'}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="text-gray-500">Condições:</span>
                        <span className="ml-2">{renderPaymentTerms()}</span>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <h3 className="font-semibold text-lg mb-2">Entrega</h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Truck className="w-4 h-4 mr-2" />
                        <span className="text-gray-500">Tipo:</span>
                        <span className="ml-2">
                          {order.shipping === 'delivery' ? 'Entrega' : 'Retirada'}
                        </span>
                      </div>
                      {order.shipping === 'delivery' && (
                        <>
                          <div className="flex items-center text-sm">
                            <span className="text-gray-500 ml-6">Local:</span>
                            <span className="ml-2">
                              {order.deliveryLocation === 'capital' ? 'Capital' : 
                               order.deliveryLocation === 'interior' ? 'Interior' : 
                               'Não especificado'}
                            </span>
                          </div>
                          {transportCompany && (
                            <div className="flex items-center text-sm">
                              <Truck className="w-4 h-4 mr-2" />
                              <span className="text-gray-500">Transportadora:</span>
                              <span className="ml-2">
                                {transportCompany.name}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Faturamento e taxas */}
                  <div className="flex-1 min-w-[250px]">
                    <h3 className="font-semibold text-lg mb-2">Faturamento</h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Tag className="w-4 h-4 mr-2" />
                        <span className="text-gray-500">Nota fiscal:</span>
                        <span className="ml-2">
                          {order.fullInvoice ? 'Completa' : 'Parcial'}
                        </span>
                      </div>
                      {renderHalfInvoiceInfo()}
                      <div className="flex items-center text-sm">
                        <Check className="w-4 h-4 mr-2" />
                        <span className="text-gray-500">Substituição tributária:</span>
                        <span className="ml-2">
                          {order.taxSubstitution ? 'Sim' : 'Não'}
                        </span>
                      </div>
                      {renderIpiInfo()}
                    </div>
                  </div>
                </div>
                <Separator className="my-4" />
                
                {/* Gerenciamento de Status */}
                {hasPermission('orders_manage') && order.status !== 'completed' && order.status !== 'canceled' && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-lg mb-2">Gerenciar Status</h3>
                    <div className="flex flex-wrap gap-2">
                      {order.status !== 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate('pending')}
                          disabled={isStatusUpdating}
                        >
                          {isStatusUpdating ? <Hourglass className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Pendente
                        </Button>
                      )}
                      <Separator orientation="vertical" className="h-8" />
                      {order.status !== 'confirmed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate('confirmed')}
                          disabled={isStatusUpdating}
                          className="border-green-500 text-green-600 hover:bg-green-50"
                        >
                          {isStatusUpdating ? <Hourglass className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Confirmar
                        </Button>
                      )}
                      {order.status !== 'invoiced' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate('invoiced')}
                          disabled={isStatusUpdating}
                          className="border-blue-500 text-blue-600 hover:bg-blue-50"
                        >
                          {isStatusUpdating ? <Hourglass className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Faturado
                        </Button>
                      )}
                      {/* Fixed the comparison issue on this line */}
                      {order.status !== 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate('completed')}
                          disabled={isStatusUpdating}
                          className="border-purple-500 text-purple-600 hover:bg-purple-50"
                        >
                          {isStatusUpdating ? <Hourglass className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Concluído
                        </Button>
                      )}
                      <Separator orientation="vertical" className="h-8" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate('canceled')}
                        disabled={isStatusUpdating}
                        className={cn(
                          "border-red-500 text-red-600 hover:bg-red-50",
                          isConfirmingCancel && "bg-red-50"
                        )}
                      >
                        {isStatusUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {isConfirmingCancel ? 'Confirmar Cancelamento?' : 'Cancelar Pedido'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Items do pedido */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Itens do Pedido</CardTitle>
              </CardHeader>
              <ScrollArea className="h-[500px] md:h-auto md:max-h-[600px]">
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 text-left">Produto</th>
                          <th className="py-2 text-right">Preço</th>
                          <th className="py-2 text-right">Qtd</th>
                          <th className="py-2 text-right">Desc.</th>
                          <th className="py-2 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item: CartItem) => (
                          <tr key={item.id} className="border-b">
                            <td className="py-2">
                              <div className="font-medium">{item.product.name}</div>
                            </td>
                            <td className="py-2 text-right">{formatCurrency(item.finalPrice)}</td>
                            <td className="py-2 text-right">{item.quantity}</td>
                            <td className="py-2 text-right">{item.discount ? `${item.discount}%` : '-'}</td>
                            <td className="py-2 text-right">{formatCurrency(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex flex-col items-end space-y-1">
                    <div className="flex justify-between w-60">
                      <span className="text-gray-500">Subtotal:</span>
                      <span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between w-60">
                      <span className="text-gray-500">Descontos:</span>
                      <span>-{formatCurrency(order.totalDiscount)}</span>
                    </div>
                    {order.deliveryFee && order.deliveryFee > 0 && (
                      <div className="flex justify-between w-60">
                        <span className="text-gray-500">Taxa de entrega:</span>
                        <span>{formatCurrency(order.deliveryFee)}</span>
                      </div>
                    )}
                    <Separator className="w-60 my-1" />
                    <div className="flex justify-between w-60 font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </CardContent>
              </ScrollArea>
            </Card>

            {/* Observações e notas */}
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-1">Observações do Pedido</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {order.observations || 'Nenhuma observação registrada.'}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-1">Notas Internas</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {order.notes || 'Nenhuma nota registrada.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderDetail;
