
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Edit, FileText, Truck, Package, 
  Calendar, User, Phone, Mail, MapPin, Receipt, ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getOrderById, updateOrderStatus } = useOrders();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      console.log(`Fetching order with ID: ${id}`);
      const fetchedOrder = getOrderById(id);
      console.log(`Fetched order:`, fetchedOrder);
      
      if (fetchedOrder) {
        setOrder(fetchedOrder);
      } else {
        console.error(`Order with ID ${id} not found`);
        toast.error("Pedido não encontrado");
      }
      
      setLoading(false);
    }
  }, [id, getOrderById]);

  const getStatusBadge = (status: string) => {
    return <OrderStatusBadge status={status as any} />;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handlePrintInvoice = () => {
    toast.info('Gerando nota fiscal...');
  };

  if (loading) {
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

  // Ensure these properties exist with default values
  const totalDiscount = order.totalDiscount || 0;
  const appliedDiscounts = order.discountOptions || [];
  const items = order.items || [];
  const shipping = order.shipping || 'delivery';
  const notes = order.observations || order.notes || '';
  const fullInvoice = order.fullInvoice || false;
  const taxSubstitution = order.taxSubstitution || false;
  const paymentMethod = order.paymentMethod || 'cash';
  const deliveryLocation = order.deliveryLocation || null;
  const deliveryFee = order.deliveryFee || 0;
  const halfInvoicePercentage = order.halfInvoicePercentage || 50;

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
              <h1 className="text-3xl font-bold tracking-tight">Pedido #{order.id.slice(-4)}</h1>
              <div className="ml-4">{getStatusBadge(order.status)}</div>
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
            onClick={handlePrintInvoice}
          >
            <FileText className="mr-2 h-4 w-4" />
            Nota Fiscal
          </Button>
        </div>
      </header>

      {/* Cliente */}
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

      {/* Histórico do Pedido + Resumo Financeiro (lado a lado) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Histórico do Pedido */}
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
              
              {order.status === 'delivered' && (
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

        {/* Resumo Financeiro */}
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

            {/* Condições de pagamento */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Condições de Pagamento</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Forma de Pagamento:</span>
                  <span>{paymentMethod === 'cash' ? 'À Vista' : 'A Prazo'}</span>
                </div>
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
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Itens do Pedido */}
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

      {/* Descontos e Acréscimos Aplicados */}
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

      {/* Entrega */}
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
                <h3 className="text-sm font-medium text-gray-500">Região</h3>
                <p className="text-lg">{deliveryLocation === 'capital' ? 'Capital' : 'Interior'}</p>
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

      {/* Informações Adicionais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Informações Adicionais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Vendedor</h3>
              <p className="text-lg">{order.user?.name || 'Vendedor não identificado'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Data do Pedido</h3>
              <p className="text-lg">
                {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status Atual</h3>
              <div className="mt-1">
                {getStatusBadge(order.status)}
              </div>
            </div>
          </div>

          {notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Observações</h3>
              <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                <p>{notes}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDetail;
