
import React from 'react';
import { PieChart, BarChart, Users, ShoppingCart, DollarSign, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock data for dashboard
  const stats = [
    { title: 'Total de Vendas', value: 'R$ 45.231,00', icon: <DollarSign className="h-5 w-5 text-ferplas-500" />, change: '+12.5%', timeframe: 'desde mês passado' },
    { title: 'Clientes', value: '302', icon: <Users className="h-5 w-5 text-ferplas-500" />, change: '+5.2%', timeframe: 'desde mês passado' },
    { title: 'Pedidos', value: '124', icon: <ShoppingCart className="h-5 w-5 text-ferplas-500" />, change: '+8.1%', timeframe: 'desde mês passado' },
    { title: 'Produtos', value: '198', icon: <Package className="h-5 w-5 text-ferplas-500" />, change: '+3.2%', timeframe: 'desde mês passado' },
  ];

  const quickActions = [
    { title: 'Novo Pedido', icon: <ShoppingCart className="h-5 w-5" />, path: '/cart', color: 'bg-ferplas-500 hover:bg-ferplas-600' },
    { title: 'Ver Produtos', icon: <Package className="h-5 w-5" />, path: '/products', color: 'bg-blue-500 hover:bg-blue-600' },
    { title: 'Ver Clientes', icon: <Users className="h-5 w-5" />, path: '/customers', color: 'bg-purple-500 hover:bg-purple-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Olá, {user?.name}</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao painel de controle da Ferplas. Aqui está o resumo das suas atividades.
        </p>
      </header>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            className={`h-auto py-6 ${action.color} text-white w-full transition-all duration-300 transform hover:shadow-lg hover:-translate-y-1`}
            onClick={() => navigate(action.path)}
          >
            <div className="flex flex-col items-center justify-center">
              <div className="rounded-full bg-white/20 p-3 mb-3">
                {action.icon}
              </div>
              <span className="text-lg font-medium">{action.title}</span>
            </div>
          </Button>
        ))}
      </div>

      {/* Stats */}
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

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="card-transition">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Vendas por Categoria</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Distribuição de vendas por categoria de produto</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <div className="h-full w-full bg-muted/20 rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">Gráfico de Vendas por Categoria</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-transition">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Vendas Mensais</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Histórico de vendas nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <div className="h-full w-full bg-muted/20 rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">Gráfico de Vendas Mensais</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="card-transition">
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
          <CardDescription>Últimas ações realizadas na plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-start space-x-4 border-b pb-4 last:border-0">
                <div className="rounded-full bg-ferplas-100 p-2">
                  <ShoppingCart className="h-4 w-4 text-ferplas-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Novo pedido #{10025 + i}</p>
                  <p className="text-sm text-muted-foreground">Cliente: Empresa ABC Ltda</p>
                  <p className="text-xs text-muted-foreground">
                    {i === 0
                      ? 'Há 5 minutos'
                      : i === 1
                      ? 'Há 2 horas'
                      : 'Ontem às 15:30'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
