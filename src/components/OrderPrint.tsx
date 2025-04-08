
import React, { forwardRef } from 'react';
import { Order } from '@/types/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useTransportCompanies } from '@/context/TransportCompanyContext';

interface OrderPrintProps {
  order: Order;
}

const OrderPrint = forwardRef<HTMLDivElement, OrderPrintProps>(({ order }, ref) => {
  const { transportCompanies } = useTransportCompanies();
  
  // Add a function to get transport company name
  const getTransportCompanyName = (id: string | null | undefined) => {
    if (!id) return 'Não especificada';
    const company = transportCompanies.find(c => c.id === id);
    return company ? company.name : 'Não especificada';
  };
  
  return (
    <div className="p-6 bg-white print:p-0" ref={ref}>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Pedido #{order.orderNumber}</h1>
        <p className="text-sm text-gray-500">
          Criado em {formatDate(order.createdAt)}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="font-medium border-b pb-1 mb-2">Informações do Cliente</h3>
          <div className="text-sm space-y-1">
            <p>
              <span className="font-medium">Cliente: </span>
              {order.customer.companyName}
            </p>
            <p>
              <span className="font-medium">CNPJ/CPF: </span>
              {order.customer.document}
            </p>
            <p>
              <span className="font-medium">Endereço: </span>
              {order.customer.street}, {order.customer.number}
              {order.customer.complement && `, ${order.customer.complement}`}
            </p>
            <p>
              <span className="font-medium">Cidade/UF: </span>
              {order.customer.city}/{order.customer.state}
            </p>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium border-b pb-1 mb-2">Informações do Pedido</h3>
          <div className="text-sm space-y-1">
            <p>
              <span className="font-medium">Vendedor: </span>
              {order.user.name}
            </p>
            <p>
              <span className="font-medium">Status: </span>
              {order.status}
            </p>
            <p>
              <span className="font-medium">Forma de Envio: </span>
              {order.shipping === 'delivery' ? 'Entrega' : 'Retirada'}
            </p>
            <p>
              <span className="font-medium">Forma de Pagamento: </span>
              {order.paymentMethod === 'cash' ? 'Dinheiro' : 'Crédito'}
            </p>
            
            {/* Display Transport Company */}
            {order.transportCompanyId && (
              <p>
                <span className="font-medium">Transportadora: </span>
                {getTransportCompanyName(order.transportCompanyId)}
              </p>
            )}
            
            <p>
              <span className="font-medium">Observações: </span>
              {order.observations || 'Nenhuma'}
            </p>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="font-medium border-b pb-1 mb-2">Itens do Pedido</h3>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left font-medium text-sm py-2">Produto</th>
              <th className="text-left font-medium text-sm py-2">Quantidade</th>
              <th className="text-left font-medium text-sm py-2">Preço Unitário</th>
              <th className="text-left font-medium text-sm py-2">Desconto</th>
              <th className="text-left font-medium text-sm py-2">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="text-sm py-2">{item.product.name}</td>
                <td className="text-sm py-2">{item.quantity}</td>
                <td className="text-sm py-2">{formatCurrency(item.product.listPrice)}</td>
                <td className="text-sm py-2">{item.discount}%</td>
                <td className="text-sm py-2">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-8 text-right">
        <p className="text-lg font-medium">Subtotal: {formatCurrency(order.subtotal)}</p>
        <p className="text-lg font-medium">Desconto: {formatCurrency(order.totalDiscount)}</p>
        <p className="text-2xl font-bold">Total: {formatCurrency(order.total)}</p>
      </div>
    </div>
  );
});

OrderPrint.displayName = 'OrderPrint';

export default OrderPrint;
