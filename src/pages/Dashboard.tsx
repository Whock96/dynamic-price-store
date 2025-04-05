
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { ChartSection } from '@/components/dashboard/ChartSection';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { user } = useAuth();
  const { 
    dashboardData, 
    isLoading, 
    error, 
    formatCurrency,
    isSalesperson
  } = useDashboardData();

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardHeader error={error} isSalesperson={isSalesperson} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats */}
      <DashboardStats 
        dashboardData={dashboardData}
        isLoading={isLoading}
        formatCurrency={formatCurrency}
      />

      {/* Charts */}
      <ChartSection />

      {/* Recent Activity */}
      <RecentActivity 
        recentOrders={dashboardData.recentOrders}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Dashboard;
