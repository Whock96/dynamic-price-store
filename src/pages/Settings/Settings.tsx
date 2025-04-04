
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon, User, Package, Tags, Percent, Building, Database, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import MigrationTool from '@/components/settings/MigrationTool';
import { useAuth } from '@/context/AuthContext';

const Settings = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const settingsLinks = [
    { 
      icon: <User className="h-5 w-5" />,
      title: 'Usuários',
      description: 'Gerenciar usuários do sistema',
      path: '/settings/users',
      permission: 'users_manage'
    },
    { 
      icon: <Shield className="h-5 w-5" />,
      title: 'Tipos de Usuário',
      description: 'Configurar tipos de usuário e permissões',
      path: '/settings/user-types',
      permission: 'user_types_manage'
    },
    { 
      icon: <Package className="h-5 w-5" />,
      title: 'Produtos',
      description: 'Configurar produtos e preços',
      path: '/settings/products',
      permission: 'products_manage'
    },
    { 
      icon: <Tags className="h-5 w-5" />,
      title: 'Categorias',
      description: 'Gerenciar categorias e subcategorias',
      path: '/settings/categories',
      permission: 'categories_manage'
    },
    { 
      icon: <Percent className="h-5 w-5" />,
      title: 'Descontos',
      description: 'Configurar opções de desconto',
      path: '/settings/discounts',
      permission: 'discounts_manage'
    },
    { 
      icon: <Building className="h-5 w-5" />,
      title: 'Empresa',
      description: 'Configurações da empresa',
      path: '/settings/company',
      permission: 'settings_manage'
    },
  ];

  // Filter links based on user permissions
  const filteredLinks = settingsLinks.filter(link => hasPermission(link.permission));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold mb-1">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
      </header>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="database">Banco de Dados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredLinks.map((link, index) => (
              <Card key={index} className="cursor-pointer transition-all hover:shadow-md" onClick={() => navigate(link.path)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">{link.title}</CardTitle>
                  {link.icon}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="database">
          <div className="grid gap-4 md:grid-cols-2">
            <MigrationTool />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" /> 
                  Banco de Dados
                </CardTitle>
                <CardDescription>
                  Informações sobre o banco de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Provedor:</span>
                    <span className="text-sm">Supabase</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <span className="text-sm text-green-500">Conectado</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
