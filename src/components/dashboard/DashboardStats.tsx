
import React from 'react';
import { DollarSign, Users, ShoppingCart, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsProps {
  isLoading: boolean;
  totalSales: number | React.ReactNode;
  customerCount: number | React.ReactNode;
  orderCount: number | React.ReactNode;
  productCount: number | React.ReactNode;
  formatCurrency: (value: number) => string;
}

const DashboardStats: React.FC<StatsProps> = ({
  isLoading,
  totalSales,
  customerCount,
  orderCount,
  productCount,
  formatCurrency
}) => {
  const stats = [
    { 
      title: 'Total de Vendas', 
      value: isLoading ? <Skeleton className="h-8 w-28" /> : typeof totalSales === 'number' ? formatCurrency(totalSales) : totalSales, 
      icon: <DollarSign className="h-5 w-5 text-ferplas-500" />
    },
    { 
      title: 'Clientes', 
      value: isLoading ? <Skeleton className="h-8 w-16" /> : customerCount, 
      icon: <Users className="h-5 w-5 text-ferplas-500" />
    },
    { 
      title: 'Pedidos', 
      value: isLoading ? <Skeleton className="h-8 w-16" /> : orderCount, 
      icon: <ShoppingCart className="h-5 w-5 text-ferplas-500" />
    },
    { 
      title: 'Produtos', 
      value: isLoading ? <Skeleton className="h-8 w-16" /> : productCount, 
      icon: <Package className="h-5 w-5 text-ferplas-500" />
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
