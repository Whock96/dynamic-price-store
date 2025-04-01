
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Users, Tag, Percent, Settings as SettingsIcon, 
  ShieldCheck, Bell, Database, Server, Building2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Only administrators should access this page
  if (user?.role !== 'administrator') {
    navigate('/dashboard');
    return null;
  }

  const settingsModules = [
    {
      title: 'Dados da Empresa',
      description: 'Informações corporativas',
      icon: <Building2 className="h-8 w-8 text-ferplas-500" />,
      path: '/settings/company',
      color: 'bg-ferplas-50 border-ferplas-100',
      highlight: true,
      priority: true,  // New priority property
    },
    {
      title: 'Gerenciar Produtos',
      description: 'Adicionar, editar e gerenciar produtos',
      icon: <Package className="h-8 w-8 text-ferplas-500" />,
      path: '/settings/products',
      color: 'bg-ferplas-50 border-ferplas-100',
    },
    {
      title: 'Gerenciar Usuários',
      description: 'Controlar acesso e permissões',
      icon: <Users className="h-8 w-8 text-blue-500" />,
      path: '/settings/users',
      color: 'bg-blue-50 border-blue-100',
    },
    {
      title: 'Gerenciar Categorias',
      description: 'Organizar produtos em categorias',
      icon: <Tag className="h-8 w-8 text-purple-500" />,
      path: '/settings/categories',
      color: 'bg-purple-50 border-purple-100',
    },
    {
      title: 'Gerenciar Descontos',
      description: 'Configurar regras de desconto',
      icon: <Percent className="h-8 w-8 text-orange-500" />,
      path: '/settings/discounts',
      color: 'bg-orange-50 border-orange-100',
    },
    {
      title: 'Configurações Gerais',
      description: 'Parâmetros do sistema',
      icon: <SettingsIcon className="h-8 w-8 text-gray-500" />,
      path: '/settings/general',
      color: 'bg-gray-50 border-gray-100',
    },
    {
      title: 'Segurança e Acesso',
      description: 'Autenticação e segurança',
      icon: <ShieldCheck className="h-8 w-8 text-emerald-500" />,
      path: '/settings/security',
      color: 'bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Notificações',
      description: 'Configurar alertas e emails',
      icon: <Bell className="h-8 w-8 text-amber-500" />,
      path: '/settings/notifications',
      color: 'bg-amber-50 border-amber-100',
    },
    {
      title: 'Banco de Dados',
      description: 'Backup e restauração',
      icon: <Database className="h-8 w-8 text-indigo-500" />,
      path: '/settings/database',
      color: 'bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Integração API',
      description: 'Conexão com serviços externos',
      icon: <Server className="h-8 w-8 text-rose-500" />,
      path: '/settings/api',
      color: 'bg-rose-50 border-rose-100',
    },
  ];

  // Sort modules to put priority ones at the top
  const sortedModules = [...settingsModules].sort((a, b) => {
    if (a.priority && !b.priority) return -1;
    if (!a.priority && b.priority) return 1;
    return 0;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie todos os aspectos da sua loja virtual.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedModules.map((module, index) => (
          <Card 
            key={index} 
            className={`cursor-pointer hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border ${module.color} ${module.highlight ? 'ring-2 ring-ferplas-300' : ''} ${module.priority ? 'border-2 border-ferplas-400' : ''}`}
            onClick={() => navigate(module.path)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-md bg-white border ${module.highlight ? 'border-ferplas-300' : ''}`}>
                  {module.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end">
                <div className="text-sm font-medium hover:underline text-gray-600">
                  Configurar →
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
          <CardDescription>Detalhes técnicos da aplicação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Versão do Sistema</h3>
              <p className="text-lg">1.0.0</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Última Atualização</h3>
              <p className="text-lg">
                {new Date().toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Ambiente</h3>
              <p className="text-lg">Produção</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Usuários Ativos</h3>
              <p className="text-lg">12</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
