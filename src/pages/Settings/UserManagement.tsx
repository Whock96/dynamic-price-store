
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, Plus, Edit, Trash2, ArrowLeft, Save,
  Check, X, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { useSupabaseData } from '@/hooks/use-supabase-data';
import { supabase } from '@/integrations/supabase/client';

interface UserData {
  id: string;
  username: string;
  name: string;
  email: string | null;
  password?: string;
  user_type_id: string;
  user_type?: {
    id: string;
    name: string;
    description: string | null;
  };
  created_at: string;
  is_active: boolean;
}

interface UserTypeOption {
  id: string;
  name: string;
  description: string | null;
  is_active?: boolean;
}

const UserManagement = () => {
  const navigate = useNavigate();
  const { user: currentUser, hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedTab, setSelectedTab] = useState('basic');
  const [formData, setFormData] = useState({
    id: '',
    username: '',
    name: '',
    userTypeId: '',
    email: '',
    password: '',
    confirmPassword: '',
    isActive: true,
  });

  const { 
    data: users, 
    isLoading: isLoadingUsers, 
    fetchData: fetchUsers,
    createRecord: createUser,
    updateRecord: updateUser,
    deleteRecord: deleteUser
  } = useSupabaseData<UserData>('users', {
    select: `
      *,
      user_type:user_types(*)
    `,
    orderBy: { column: 'name', ascending: true }
  });

  const { 
    data: userTypes, 
    isLoading: isLoadingUserTypes 
  } = useSupabaseData<UserTypeOption>('user_types', {
    orderBy: { column: 'name', ascending: true },
    isActive: true
  });

  useEffect(() => {
    if (!hasPermission('users_manage')) {
      toast.error('Você não tem permissão para acessar esta página');
      navigate('/dashboard');
    }
  }, [navigate, hasPermission]);

  const handleOpenDialog = (user?: UserData) => {
    if (user) {
      setIsEditMode(true);
      setSelectedUser(user);
      
      // Check if the user's type is still active
      const userTypeExists = userTypes.some(type => type.id === user.user_type_id);
      
      if (!userTypeExists) {
        toast.warning(`O tipo de usuário atual não está mais disponível. Por favor, selecione um novo tipo.`);
      }
      
      setFormData({
        id: user.id,
        username: user.username,
        name: user.name,
        userTypeId: userTypeExists ? user.user_type_id : (userTypes.length > 0 ? userTypes[0].id : 'no_type'),
        email: user.email || '',
        password: '',
        confirmPassword: '',
        isActive: user.is_active,
      });
    } else {
      setIsEditMode(false);
      setSelectedUser(null);
      setFormData({
        id: '',
        username: '',
        name: '',
        userTypeId: userTypes.length > 0 ? userTypes[0].id : 'no_type',
        email: '',
        password: '',
        confirmPassword: '',
        isActive: true,
      });
    }
    
    setIsDialogOpen(true);
    setSelectedTab('basic');
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveUser = async () => {
    if (!formData.username || !formData.name || !formData.userTypeId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!isEditMode && (!formData.password || formData.password.length < 4)) {
      toast.error('A senha deve ter pelo menos 4 caracteres');
      return;
    }

    if (!isEditMode && formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (!userTypes.some(type => type.id === formData.userTypeId)) {
      toast.error('O tipo de usuário selecionado não existe ou foi inativado');
      return;
    }

    try {
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('username', formData.username)
        .neq('id', isEditMode ? formData.id : '');
      
      if (checkError) throw checkError;
      
      if (existingUsers && existingUsers.length > 0) {
        toast.error('Este nome de usuário já está em uso');
        return;
      }
      
      if (isEditMode) {
        const updateData: any = {
          name: formData.name,
          username: formData.username,
          email: formData.email || null,
          user_type_id: formData.userTypeId,
          is_active: formData.isActive,
          updated_at: new Date().toISOString()
        };
        
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        await updateUser(formData.id, updateData);
        toast.success(`Usuário "${formData.name}" atualizado com sucesso`);
      } else {
        await createUser({
          name: formData.name,
          username: formData.username,
          email: formData.email || null,
          password: formData.password,
          user_type_id: formData.userTypeId,
          is_active: formData.isActive
        });
        
        toast.success(`Usuário "${formData.name}" adicionado com sucesso`);
      }
      
      fetchUsers();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving user:', err);
      toast.error('Erro ao salvar usuário');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error('Você não pode excluir seu próprio usuário');
      return;
    }
    
    try {
      await deleteUser(userId);
      toast.success('Usuário removido com sucesso');
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('Erro ao excluir usuário');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || (user.user_type && user.user_type.name === roleFilter);
    
    return matchesSearch && matchesRole;
  });

  const uniqueUserTypes = [...new Set(users
    .filter(user => user.user_type)
    .map(user => user.user_type?.name)
    .filter(Boolean))];

  const getUserTypeBadge = (userType?: string) => {
    if (!userType) return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Não definido</Badge>;
    
    switch (userType.toLowerCase()) {
      case 'administrator':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Administrador</Badge>;
      case 'salesperson':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Vendedor</Badge>;
      case 'billing':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Faturamento</Badge>;
      case 'inventory':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Estoque</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{userType}</Badge>;
    }
  };

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
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Usuários</h1>
            <p className="text-muted-foreground">
              Adicione, edite e gerencie usuários do sistema
            </p>
          </div>
        </div>
        <Button 
          className="bg-ferplas-500 hover:bg-ferplas-600 button-transition"
          onClick={() => handleOpenDialog()}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar usuários por nome, username ou email..."
                className="pl-10 input-transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {uniqueUserTypes.map(type => (
                  type ? <SelectItem key={type} value={type}>{type}</SelectItem> : null
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoadingUsers ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-ferplas-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-muted-foreground">Carregando usuários...</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>{user.user_type ? getUserTypeBadge(user.user_type.name) : getUserTypeBadge()}</TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 px-2 text-amber-600"
                        onClick={() => handleOpenDialog(user)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 px-2 text-red-600"
                            disabled={user.id === currentUser?.id}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Excluir
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação irá remover permanentemente o usuário "{user.name}" do sistema. 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {!isLoadingUsers && filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-600">Nenhum usuário encontrado</h2>
              <p className="text-gray-500 mt-1">Tente ajustar seus filtros ou adicione um novo usuário.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Atualize as informações do usuário abaixo.' 
                : 'Preencha os dados para adicionar um novo usuário ao sistema.'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
              <TabsTrigger value="security" disabled={!isEditMode}>Segurança</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Completo*</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="username">Nome de Usuário*</Label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Ex: joaosilva"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Ex: joao@ferplas.ind.br"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="userTypeId">Tipo de Usuário*</Label>
                    <Select 
                      value={formData.userTypeId} 
                      onValueChange={(value) => handleSelectChange('userTypeId', value)}
                    >
                      <SelectTrigger id="userTypeId">
                        <SelectValue placeholder="Selecione um tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {userTypes.length > 0 ? (
                          userTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no_type">
                            Nenhum tipo de usuário disponível
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {userTypes.length === 0 && (
                      <p className="text-sm text-red-500 mt-1">
                        Nenhum tipo de usuário ativo encontrado. Adicione um tipo primeiro.
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-gray-300 text-ferplas-600 focus:ring-ferplas-500"
                  />
                  <Label htmlFor="isActive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Usuário ativo
                  </Label>
                </div>
                
                {!isEditMode && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="password">Senha*</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Senha"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="confirmPassword">Confirmar Senha*</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirmar senha"
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="security" className="mt-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="password">Nova Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Deixe em branco para manter a senha atual"
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirmar nova senha"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-gray-300 text-ferplas-600 focus:ring-ferplas-500"
                  />
                  <Label htmlFor="isActive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Usuário ativo
                  </Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} className="bg-ferplas-500 hover:bg-ferplas-600">
              <Save className="mr-2 h-4 w-4" />
              {isEditMode ? 'Salvar Alterações' : 'Adicionar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
