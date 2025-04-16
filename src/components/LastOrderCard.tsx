
import React from 'react';
import { Order } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Calendar, FileText, Percent, ClipboardList, Receipt, Package, Briefcase } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

interface LastOrderCardProps {
  lastOrder: Order | null;
  isLoading: boolean;
}

const LastOrderCard: React.FC<LastOrderCardProps> = ({ lastOrder, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Dados do Último Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24">
            <div className="w-6 h-6 border-2 border-ferplas-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!lastOrder) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center">
          <span>Dados do Último Pedido</span>
          <span className="ml-2 text-xs text-gray-500">
            (#{lastOrder.orderNumber} - {formatDate(lastOrder.createdAt)})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex items-center mb-2">
              <CreditCard className="h-4 w-4 text-ferplas-500 mr-1" />
              <span className="text-sm font-medium text-gray-700">Forma de Pagamento:</span>
            </div>
            <p className="text-sm text-ferplas-600">
              {lastOrder.paymentMethod === 'cash' ? 'À Vista' : 'A Prazo'}
            </p>
            {lastOrder.paymentTerms && (
              <p className="text-xs text-gray-500 mt-1">Prazo: {lastOrder.paymentTerms}</p>
            )}
          </div>

          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex items-center mb-2">
              <FileText className="h-4 w-4 text-ferplas-500 mr-1" />
              <span className="text-sm font-medium text-gray-700">Tipo de Nota:</span>
            </div>
            <p className="text-sm text-ferplas-600">
              {lastOrder.fullInvoice ? 'Nota Cheia' : 'Meia Nota'}
            </p>
            {!lastOrder.fullInvoice && lastOrder.halfInvoicePercentage && (
              <div>
                <p className="text-xs text-gray-500 mt-1">
                  Percentual: {lastOrder.halfInvoicePercentage}%
                </p>
                <p className="text-xs text-gray-500">
                  Tipo: {lastOrder.halfInvoiceType === 'price' ? 'No Preço' : 'Na Quantidade'}
                </p>
              </div>
            )}
          </div>

          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex items-center mb-2">
              <Receipt className="h-4 w-4 text-ferplas-500 mr-1" />
              <span className="text-sm font-medium text-gray-700">Substituição Tributária:</span>
            </div>
            <p className="text-sm text-ferplas-600">
              {lastOrder.taxSubstitution ? 'Sim' : 'Não'}
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex items-center mb-2">
              <Package className="h-4 w-4 text-ferplas-500 mr-1" />
              <span className="text-sm font-medium text-gray-700">IPI:</span>
            </div>
            <p className="text-sm text-ferplas-600">
              {lastOrder.withIPI ? 'Sim' : 'Não'}
            </p>
            <p className="text-sm text-ferplas-600 mt-1">
              <span className="text-sm font-medium text-gray-700">SUFRAMA:</span> {lastOrder.withSuframa ? 'Sim' : 'Não'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LastOrderCard;
