import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Search, ArrowLeft, Edit
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { UserType } from '@/types/types';
import { useSupabaseData } from '@/hooks/use-supabase-data';
import { formatDate } from '@/utils/formatters';
import { isAdministrador, ADMIN_USER_TYPE_ID, VENDEDOR_USER_TYPE_ID } from '@/utils/permissionUtils';

interface UserTypeWithDates extends UserType {
  createdAt: Date;
  updatedAt: Date;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

const UserTypeManagement = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserTypeDialogOpen, setIsUserTypeDialogOpen] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<UserTypeWithDates | null>(null);
  const [userTypeFormData, setUserTypeFormData] = useState({
    id: '',
    name: '',
    description: '',
    isActive: true,
  });

  const userTypesOptions = useMemo(() => ({
    orderBy: { column: 'name', ascending: true }
  }), []);

  const { 
    data: userTypesRaw, 
    isLoading, 
    fetchData: fetchUserTypes,
    updateRecord: updateUserType
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
    if (!currentUser || !isAdministrador(currentUser.userTypeId)) {
      toast.error('Você não tem permissão para acessar esta página');
      navigate('/dashboard');
      return;
    }
  }, [navigate, currentUser]);

  const handleOpenUserTypeDialog = (userType?: UserTypeWithDates) => {
    if (userType) {
      setSelectedUserType(userType);
      setUserTypeFormData({
        id: userType.id,
        name: userType.name,
        description: userType.description || '',
        isActive: userType.is_active !== false,
      });
      setIsUserTypeDialogOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserTypeFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveUserType = async () => {
    if (!userTypeFormData.name.trim()) {
      toast.error('O nome do tipo de usuário é obrigatório');
      return;
    }

    try {
      if (selectedUserType) {
        if (selectedUserType.id === ADMIN_USER_TYPE_ID || selectedUserType.id === VENDEDOR_USER_TYPE_ID) {
          await updateUserType(userTypeFormData.id, {
            description: userTypeFormData.description,
            updatedAt: new Date()
          });
          
          toast.success(`Descrição do tipo "${userTypeFormData.name}" atualizada com sucesso`);
        } else {
          toast.error('Apenas os tipos padrão podem ser gerenciados');
          return;
        }
      }
      
      fetchUserTypes();
      setIsUserTypeDialogOpen(false);
    } catch (err) {
      console.error('Error saving user type:', err);
      toast.error('Erro ao salvar tipo de usuário');
    }
  };

  const filteredUserTypes = useMemo(() => {
    return userTypes.filter(userType => {
      if (userType.id !== ADMIN_USER_TYPE_ID && userType.id !== VENDEDOR_USER_TYPE_ID) {
        return false;
      }
      
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
            <h1 className="text-3xl font-bold tracking-tight">Tipos de Usuário</h1>
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
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUserTypes.map((userType) => (
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
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 px-2 text-amber-600"
                        onClick={() => handleOpenUserTypeDialog(userType)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar Descrição
                      </Button>
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

      <Dialog open={isUserTypeDialogOpen} onOpenChange={setIsUserTypeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Descrição do Tipo de Usuário</DialogTitle>
            <DialogDescription>
              Atualize a descrição do tipo de usuário abaixo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                value={userTypeFormData.name}
                disabled={true}
                className="bg-gray-100"
              />
              <p className="text-xs text-muted-foreground mt-1">O nome do tipo de usuário não pode ser alterado.</p>
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                name="description"
                value={userTypeFormData.description}
                onChange={handleInputChange}
                placeholder="Ex: Acesso às funcionalidades de vendas"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserTypeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUserType} className="bg-ferplas-500 hover:bg-ferplas-600">
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserTypeManagement;
