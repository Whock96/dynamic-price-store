
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface DashboardHeaderProps {
  error: string | null;
  isSalesperson: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ error, isSalesperson }) => {
  const { user } = useAuth();

  return (
    <header className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight">Olá, {user?.name}</h1>
      <p className="text-muted-foreground">
        {isSalesperson 
          ? 'Bem-vindo ao seu painel de controle. Aqui está o resumo dos seus clientes e pedidos.'
          : 'Bem-vindo ao painel de controle da Ferplas. Aqui está o resumo geral das atividades.'}
      </p>
      
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </header>
  );
};
