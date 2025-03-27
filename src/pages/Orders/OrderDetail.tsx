
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Edit, FileText, Truck, Package, 
  Calendar, User, Phone, Mail, MapPin 
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

// Simulando o pedido com base no ID da URL
const getOrderById = (id: string) => {
  // Aqui seria uma chamada à API para buscar o pedido pelo ID
  // Por enquanto, vamos simular um pedido
  const today = new Date();
  const date = new Date(today);
  date.setDate(today.getDate() - Math.floor(Math.random() * 30));
  
  const orderNumber = parseInt(id.split('-')[1], 10);
  
  return {
    id,
    number: `#${10000 + orderNumber - 1}`,
    customerId: `customer-${Math.floor(Math.random() * 10) + 1}`,
    customerName: `Cliente ${Math.floor(Math.random() * 10) + 1} Ltda.`,
    userId: `user-${Math.floor(Math.random() * 3) + 1}`,
    userName: orderNumber % 3 === 0 ? 'João Silva' : orderNumber % 3 === 1 ? 'Maria Oliveira' : 'Carlos Santos',
    items: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
      id: `item-${i}`,
      productId: `product-${i + 1}`,
      productName: `Produto ${i + 1}`,
      quantity: Math.floor(Math.random() * 10) + 1,
      listPrice: Math.floor(Math.random() * 900) + 100,
      discount: Math.floor(Math.random() * 10) + 5,
      finalPrice: Math.floor(Math.random() * 800) + 90,
      subtotal: Math.floor(Math.random() * 8000) + 900,
    })),
    appliedDiscounts: [
      { name: 'Retirada', value: 1, type: 'discount' },
      { name: 'Meia nota', value: 3, type: 'discount' },
      { name: 'A Vista', value: 1, type: 'discount' },
    ],
    shipping: orderNumber % 2 === 0 ? 'delivery' : 'pickup',
    fullInvoice: orderNumber % 2 === 0,
    taxSubstitution: orderNumber % 3 === 0,
    paymentMethod: orderNumber % 2 === 0 ? 'cash' : 'credit',
    notes: 'Observações do cliente: entregar no período da tarde.',
    subtotal: Math.floor(Math.random() * 9000) + 1000,
    totalDiscount: Math.floor(Math.random() * 500) + 100,
    total: Math.floor(Math.random() * 8500) + 900,
    status: orderNumber % 4 === 0 ? 'pending' : orderNumber % 4 === 1 ? 'confirmed' : orderNumber % 4 === 2 ? 'delivered' : 'canceled',
    createdAt: date,
    customer: {
      id: `customer-${Math.floor(Math.random() * 10) + 1}`,
      companyName: `Cliente ${Math.floor(Math.random() * 10) + 1} Ltda.`,
      document: Math.random().toString().slice(2, 13),
      street: `Rua ${Math.floor(Math.random() * 100) + 1}`,
      number: `${Math.floor(Math.random() * 1000) + 1}`,
      complement: orderNumber % 2 === 0 ? `Sala ${Math.floor(Math.random() * 10) + 1}` : '',
      city: orderNumber % 4 === 0 ? 'São Paulo' : orderNumber % 4 === 1 ? 'Rio de Janeiro' : orderNumber % 4 === 2 ? 'Belo Horizonte' : 'Curitiba',
      state: orderNumber % 4 === 0 ? 'SP' : orderNumber % 4 === 1 ? 'RJ' : orderNumber % 4 === 2 ? 'MG' : 'PR',
      zipCode: `${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 900) + 100}`,
      phone: `(${Math.floor(Math.random() * 90) + 10}) ${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 9000) + 1000}`,
      email: `cliente${Math.floor(Math.random() * 100)}@example.com`,
    }
  };
};

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      // Simulando uma chamada à API
      setTimeout(() => {
        const fetchedOrder = getOrderById(id);
        setOrder(fetchedOrder);
        setLoading(false);
      }, 500);
    }
  }, [id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Confirmado</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Entregue</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
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
              <h1 className="text-3xl font-bold tracking-tight">Pedido {order.number}</h1>
              <div className="ml-4">{getStatusBadge(order.status)}</div>
            </div>
            <p className="text-muted-foreground">
              Criado em {format(order.createdAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {user?.role === 'administrator' && order.status === 'pending' && (
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
                    {format(order.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  <p className="text-sm text-gray-500">Por {order.userName}</p>
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
                      {format(new Date(order.createdAt.getTime() + 24 * 60 * 60 * 1000), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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
                      {format(new Date(order.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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
                      {format(new Date(order.createdAt.getTime() + 2 * 24 * 60 * 60 * 1000), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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
                <span>-{formatCurrency(order.totalDiscount)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium text-lg">
                <span>Total:</span>
                <span className="text-ferplas-600">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Itens do Pedido */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Itens do Pedido</CardTitle>
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
              {order.items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell>{formatCurrency(item.listPrice)}</TableCell>
                  <TableCell>{item.discount}%</TableCell>
                  <TableCell>{formatCurrency(item.finalPrice)}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatCurrency(item.subtotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Descontos Aplicados */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Descontos Aplicados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.appliedDiscounts.map((discount: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-ferplas-100 flex items-center justify-center mr-3">
                    {discount.type === 'discount' ? '-' : '+'}
                  </div>
                  <div>
                    <p className="font-medium">{discount.name}</p>
                    <p className="text-sm text-gray-500">
                      {discount.type === 'discount' ? 'Desconto' : 'Acréscimo'} de {discount.value}%
                    </p>
                  </div>
                </div>
                <span className="font-medium text-ferplas-600">
                  {discount.type === 'discount' ? '-' : '+'}
                  {discount.value}%
                </span>
              </div>
            ))}
            
            {order.appliedDiscounts.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                Nenhum desconto aplicado.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detalhes do Pedido */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Detalhes do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Vendedor</h3>
              <p className="text-lg">{order.userName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Tipo de Entrega</h3>
              <p className="text-lg flex items-center">
                {order.shipping === 'delivery' ? (
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
            <div>
              <h3 className="text-sm font-medium text-gray-500">Nota Fiscal</h3>
              <p className="text-lg">{order.fullInvoice ? 'Nota Cheia' : 'Meia Nota'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Substituição Tributária</h3>
              <p className="text-lg">{order.taxSubstitution ? 'Sim' : 'Não'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Forma de Pagamento</h3>
              <p className="text-lg">{order.paymentMethod === 'cash' ? 'À Vista' : 'A Prazo'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Data do Pedido</h3>
              <p className="text-lg">
                {format(order.createdAt, "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          {order.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500">Observações</h3>
              <p className="mt-1">{order.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDetail;
