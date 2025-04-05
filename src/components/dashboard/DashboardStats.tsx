
import React from 'react';
import { DollarSign, Users, ShoppingCart, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardData } from '@/hooks/useDashboardData';

interface DashboardStatsProps {
  dashboardData: DashboardData;
  isLoading: boolean;
  formatCurrency: (value: number) => string;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  dashboardData,
  isLoading,
  formatCurrency
}) => {
  const stats = [
    { 
      title: 'Total de Vendas', 
      value: isLoading ? <Skeleton className="h-8 w-28" /> : formatCurrency(dashboardData.totalSales), 
      icon: <DollarSign className="h-5 w-5 text-ferplas-500" />, 
      change: '+12.5%', 
      timeframe: 'desde mês passado' 
    },
    { 
      title: 'Clientes', 
      value: isLoading ? <Skeleton className="h-8 w-16" /> : dashboardData.customerCount, 
      icon: <Users className="h-5 w-5 text-ferplas-500" />, 
      change: '+5.2%', 
      timeframe: 'desde mês passado' 
    },
    { 
      title: 'Pedidos', 
      value: isLoading ? <Skeleton className="h-8 w-16" /> : dashboardData.orderCount, 
      icon: <ShoppingCart className="h-5 w-5 text-ferplas-500" />, 
      change: '+8.1%', 
      timeframe: 'desde mês passado' 
    },
    { 
      title: 'Produtos', 
      value: isLoading ? <Skeleton className="h-8 w-16" /> : dashboardData.productCount, 
      icon: <Package className="h-5 w-5 text-ferplas-500" />, 
      change: '+3.2%', 
      timeframe: 'desde mês passado' 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="card-transition">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              <span className={stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}>
                {stat.change}
              </span>{' '}
              {stat.timeframe}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
