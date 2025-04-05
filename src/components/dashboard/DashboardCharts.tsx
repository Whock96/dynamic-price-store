
import React from 'react';
import { PieChart, BarChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DashboardCharts: React.FC = () => {
  return (
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
  );
};

export default DashboardCharts;
