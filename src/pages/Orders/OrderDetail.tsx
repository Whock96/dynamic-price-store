
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, FileText, Printer, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useOrderData } from '@/hooks/use-order-data';
import { Order } from '@/types/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const OrderDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, hasPermission } = useAuth();
  const { order, isLoading, error, fetchOrderData } = useOrderData(id);

  useEffect(() => {
    if (!id) {
      toast.error('ID do pedido não especificado.');
      navigate('/orders');
    }
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando detalhes do pedido...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertTriangle className="h-6 w-6 text-red-500 mb-2" />
        <p className="text-red-500">{error.message}</p>
        <Button variant="outline" onClick={() => navigate('/orders')}>
          Voltar para a lista de pedidos
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertTriangle className="h-6 w-6 text-yellow-500 mb-2" />
        <p className="text-yellow-500">Pedido não encontrado.</p>
        <Button variant="outline" onClick={() => navigate('/orders')}>
          Voltar para a lista de pedidos
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Confirmado</Badge>;
      case 'invoiced':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Faturado</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Concluído</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDateCustom = (date: Date) => {
    return format(date, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
  };

  const orderDate = new Date(order.createdAt);

  return (
    <div className="container mx-auto py-10 animate-fade-in">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate('/orders')} className="mr-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        {currentUser?.id !== order.userId && hasPermission('orders.edit') && (
          <Button variant="outline" onClick={() => navigate(`/orders/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Pedido
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Detalhes do Pedido #{order.orderNumber}</CardTitle>
              <CardDescription>
                Visualizando detalhes do pedido realizado em {formatDateCustom(orderDate)}
              </CardDescription>
            </div>
            <div className="space-x-2">
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Gerar Orçamento
              </Button>
              <Button variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold">Informações do Cliente</h3>
              <p>
                <strong>Cliente:</strong> {order.customer.companyName}
              </p>
              <p>
                <strong>CNPJ:</strong> {order.customer.document}
              </p>
              <p>
                <strong>Email:</strong> {order.customer.email || 'Não informado'}
              </p>
              <p>
                <strong>Telefone:</strong> {order.customer.phone || 'Não informado'}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Informações do Pedido</h3>
              <p>
                <strong>Status:</strong> {getStatusBadge(order.status)}
              </p>
              <p>
                <strong>Vendedor:</strong> {order.user.name}
              </p>
              <p>
                <strong>Data do Pedido:</strong> {formatDateCustom(orderDate)}
              </p>
              <p>
                <strong>Forma de Pagamento:</strong> {order.paymentMethod}
              </p>
              {order.paymentTerms && (
                <p>
                  <strong>Condições de Pagamento:</strong> {order.paymentTerms}
                </p>
              )}
              <p>
                <strong>Entrega:</strong> {order.shipping === 'delivery' ? 'Entrega' : 'Retirada'}
              </p>
              {order.shipping === 'delivery' && (
                <p>
                  <strong>Local de Entrega:</strong> {order.deliveryLocation === 'capital' ? 'Capital' : 'Interior'}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold">Itens do Pedido</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Preço Unitário</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.finalPrice)}</TableCell>
                    <TableCell>{item.discount}%</TableCell>
                    <TableCell>{formatCurrency(item.subtotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold">Observações</h3>
              <p>{order.notes || 'Nenhuma observação.'}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Resumo do Pedido</h3>
              <p>
                <strong>Subtotal:</strong> {formatCurrency(order.subtotal)}
              </p>
              <p>
                <strong>Desconto Total:</strong> {formatCurrency(order.totalDiscount)}
              </p>
              {order.deliveryFee && (
                <p>
                  <strong>Taxa de Entrega:</strong> {formatCurrency(order.deliveryFee)}
                </p>
              )}
              <p>
                <strong>Total:</strong> {formatCurrency(order.total)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDetail;
