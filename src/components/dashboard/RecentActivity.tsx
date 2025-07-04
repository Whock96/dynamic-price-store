
import React from 'react';
import { ShoppingCart, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface RecentActivityProps {
  isLoading: boolean;
  recentOrders: any[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ isLoading, recentOrders }) => {
  const navigate = useNavigate();
  
  return (
    <Card className="card-transition">
      <CardHeader>
        <CardTitle>Atividades Recentes</CardTitle>
        <CardDescription>Últimas ações realizadas na plataforma</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-start space-x-4 border-b pb-4 last:border-0">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order, i) => (
                <div key={order.id} className="flex items-start justify-between space-x-4 border-b pb-4 last:border-0">
                  <div className="flex items-start space-x-4">
                    <div className="rounded-full bg-ferplas-100 p-2">
                      <ShoppingCart className="h-4 w-4 text-ferplas-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Pedido #{order.order_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Cliente: {order.customers?.company_name || 'Cliente não encontrado'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Ver Detalhes
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">Nenhum pedido recente encontrado</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
