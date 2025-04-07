
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardStats from '@/components/dashboard/DashboardStats';
import QuickActions from '@/components/dashboard/QuickActions';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import RecentActivity from '@/components/dashboard/RecentActivity';

const Dashboard = () => {
  const { user } = useAuth();
  const { data, isLoading, error, formatCurrency, isSalespersonType } = useDashboardData();

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Olá, {user?.name}</h1>
        <p className="text-muted-foreground">
          {isSalespersonType 
            ? "Bem-vindo ao painel de controle da Ferplas. Aqui está o resumo dos seus clientes e pedidos."
            : "Bem-vindo ao painel de controle da Ferplas. Aqui está o resumo geral da empresa."}
        </p>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && !error && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-ferplas-500" />
          <span className="ml-2 text-lg text-muted-foreground">Carregando dados do dashboard...</span>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* Quick Actions */}
          <QuickActions />

          {/* Stats */}
          <DashboardStats 
            isLoading={isLoading}
            totalSales={data.totalSales}
            customerCount={data.customerCount}
            orderCount={data.orderCount}
            productCount={data.productCount}
            formatCurrency={formatCurrency}
          />

          {/* Charts */}
          <DashboardCharts />

          {/* Recent Activity */}
          <RecentActivity 
            isLoading={isLoading} 
            recentOrders={data.recentOrders}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;
