
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Search, Edit, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { UserType } from '@/types/types';
import { useSupabaseData } from '@/hooks/use-supabase-data';
import { formatDate } from '@/utils/formatters';
import { isAdministrador } from '@/utils/permissionUtils';

interface UserTypeWithDates extends UserType {
  createdAt: Date;
  updatedAt: Date;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

const UserTypeManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const userTypesOptions = useMemo(() => ({
    orderBy: { column: 'name', ascending: true }
  }), []);

  const { 
    data: userTypesRaw, 
    isLoading
  } = useSupabaseData<UserTypeWithDates>('user_types', userTypesOptions);

  const userTypes = useMemo(() => {
    return userTypesRaw.map(userType => {
      return {
        ...userType,
        createdAt: userType.createdAt || (userType.created_at ? new Date(userType.created_at) : new Date()),
        updatedAt: userType.updatedAt || (userType.updated_at ? new Date(userType.updated_at) : new Date()),
      };
    });
  }, [userTypesRaw]);

  useEffect(() => {
    if (user && !isAdministrador(user.userTypeId)) {
      toast.error('Você não tem permissão para acessar esta página');
      navigate('/dashboard');
      return;
    }
  }, [navigate, user]);

  const filteredUserTypes = useMemo(() => {
    return userTypes.filter(userType => {
      return userType.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (userType.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [userTypes, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4 text-gray-500"
            onClick={() => navigate('/settings')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Tipos de Usuário</h1>
            <p className="text-muted-foreground">
              Visualize os tipos de usuário disponíveis no sistema
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar tipos de usuário..."
              className="pl-10 input-transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-ferplas-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-muted-foreground">Carregando tipos de usuário...</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead>ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUserTypes.map(userType => (
                  <TableRow key={userType.id} className={userType.is_active === false ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{userType.name}</TableCell>
                    <TableCell>{userType.description}</TableCell>
                    <TableCell>
                      {userType.is_active !== false ? (
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDate(userType.createdAt)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">
                      {userType.id}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {!isLoading && filteredUserTypes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="h-12 w-12 text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-600">Nenhum tipo de usuário encontrado</h2>
              <p className="text-gray-500 mt-1">Tente ajustar seus filtros.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Informação do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              O sistema utiliza dois tipos de usuário fixos:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Administrador (ID: 548dae75-9f43-4dd5-a476-5996430c40b7):</strong> Possui acesso completo a todas as funcionalidades do sistema.</li>
              <li><strong>Vendedor (ID: c5ee0433-3faf-46a4-a516-be7261bfe575):</strong> Possui acesso limitado ao Dashboard, Clientes, Pedidos e Carrinho, com dados filtrados para mostrar apenas o que foi criado pelo próprio usuário.</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              Não é possível adicionar ou modificar tipos de usuário diretamente pela interface. Para mais informações, consulte o suporte técnico.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserTypeManagement;
