
import React from 'react';
import { useParams } from 'react-router-dom';
import { useOrders } from '@/context/OrderContext';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTransportCompanies } from '@/context/TransportCompanyContext';

const OrderPrint = () => {
  const { id } = useParams<{ id: string }>();
  const { orders } = useOrders();
  const navigate = useNavigate();
  const order = orders.find((o) => o.id === id);
  const { transportCompanies } = useTransportCompanies();

  const componentRef = React.useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    documentTitle: `Pedido_${order?.orderNumber || id?.split('-')[0]}`,
    onPrintError: (error) => console.error('Print error:', error),
    onAfterPrint: () => console.log('Print completed'),
    removeAfterPrint: false,
  });

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

  // Add a function to get transport company name
  const getTransportCompanyName = (id?: string) => {
    if (!id) return null;
    const transportCompany = transportCompanies.find(tc => tc.id === id);
    return transportCompany ? transportCompany.name : null;
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" onClick={() => navigate('/orders')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={() => {
          if (componentRef.current) {
            handlePrint(undefined, () => componentRef.current);
          }
        }}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      </div>

      <div ref={componentRef} className="print:w-full print:max-w-full">
        <Card className="w-full max-w-4xl mx-auto print:shadow-none print:border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">
              Pedido #{order.orderNumber || id?.split('-')[0]}
            </CardTitle>
            <p className="text-sm text-gray-500">
              Emitido em {formatDate(order.createdAt)}
            </p>
          </CardHeader>
          <CardContent className="px-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Informações do Cliente</h3>
              <p className="mb-1">
                <span className="font-medium">Cliente:</span> {order.customer.companyName}
              </p>
              <p className="mb-1">
                <span className="font-medium">CNPJ/CPF:</span> {order.customer.document}
              </p>
              <p className="mb-1">
                <span className="font-medium">Endereço:</span> {order.customer.street}, {order.customer.number}{' '}
                {order.customer.complement && `- ${order.customer.complement}`}
              </p>
              <p className="mb-1">
                <span className="font-medium">Bairro:</span> {order.customer.neighborhood}
              </p>
              <p className="mb-1">
                <span className="font-medium">Cidade/UF:</span> {order.customer.city}/{order.customer.state}
              </p>
              <p className="mb-1">
                <span className="font-medium">CEP:</span> {order.customer.zipCode}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Informações de Entrega</h3>
              <p className="mb-1">
                <span className="font-medium">Forma de Entrega:</span> {order.shipping === 'delivery' ? 'Entrega' : 'Retirada'}
              </p>
              {order.shipping === 'delivery' && (
                <p className="mb-1">
                  <span className="font-medium">Local de Entrega:</span> {order.deliveryLocation === 'capital' ? 'Capital' : 'Interior'}
                </p>
              )}
              {order.transportCompanyId && (
                <p className="mb-1">
                  <span className="font-medium">Transportadora:</span> {getTransportCompanyName(order.transportCompanyId)}
                </p>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Itens do Pedido</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Preço Unitário</TableHead>
                    <TableHead>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.finalPrice)}</TableCell>
                      <TableCell>{formatCurrency(item.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Resumo do Pedido</h3>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Desconto:</span>
                <span>{formatCurrency(order.totalDiscount)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Observações</h3>
              <p>{order.notes || order.observations || 'Nenhuma observação.'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderPrint;
