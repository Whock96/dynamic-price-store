
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { isAdministrador } from '@/utils/permissionUtils';

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const canAccessSettings = user && isAdministrador(user.userTypeId);

  if (!canAccessSettings) {
    toast.error('Você não tem permissão para acessar as configurações do sistema');
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema
        </p>
      </div>
      
      <SettingsTabs />
      
      <Card>
        <CardContent className="p-0">
          <Outlet />
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
