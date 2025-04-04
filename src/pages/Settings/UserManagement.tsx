
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, Plus, Edit, Trash2, ArrowLeft, Save,
  Check, X, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { useAuth } from '@/context/AuthContext';
import { useUsers } from '@/hooks/use-users';
import { toast } from 'sonner';

const UserManagement = () => {
  const navigate = useNavigate();
  const { user: currentUser, hasPermission } = useAuth();
  const { users, userTypes, isLoading, createUser, updateUser, deleteUser } = useUsers();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState('basic');
  const [formData, setFormData] = useState({
    id: '',
    username: '',
    name: '',
    userTypeId: '',
    email: '',
    password: '',
    confirmPassword: '',
    isActive: true
  });

  // Check if user has permission to access this page
  useEffect(() => {
    if (!hasPermission('settings.users')) {
      navigate('/dashboard');
    }
  }, [hasPermission, navigate]);

  // Filter users based on search query and user type filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesUserType = userTypeFilter === 'all' || user.userType.id === userTypeFilter;
    
    return matchesSearch && matchesUserType;
  });

  const handleOpenDialog = (user?: typeof users[0]) => {
    if (user) {
      setIsEditMode(true);
      setFormData({
        id: user.id,
        username: user.username,
        name: user.name,
        userTypeId: user.userType.id,
        email: user.email || '',
        password: '',
        confirmPassword: '',
        isActive: user.isActive
      });
    } else {
      setIsEditMode(false);
      setFormData({
        id: '',
        username: '',
        name: '',
        userTypeId: userTypes.length > 0 ? userTypes[0].id : '',
        email: '',
        password: '',
        confirmPassword: '',
        isActive: true
      });
    }
    
    setIsDialogOpen(true);
    setSelectedTab('basic');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSaveUser = async () => {
    // Validação básica
    if (!formData.username || !formData.name || !formData.userTypeId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!isEditMode && (!formData.password || formData.password.length < 6)) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (!isEditMode && formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    let success;
    if (isEditMode) {
      // Atualizar usuário existente
      success = await updateUser(
        formData.id,
        formData.username,
        formData.name,
        formData.email,
        formData.userTypeId,
        formData.isActive,
        formData.password ? formData.password : undefined
      );
    } else {
      // Adicionar novo usuário
      success = await createUser(
        formData.username,
        formData.password,
        formData.name,
        formData.email,
        formData.userTypeId
      );
    }

    if (success) {
      setIsDialogOpen(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // Don't allow deleting the current user
    if (userId === currentUser?.id) {
      toast.error('Você não pode excluir seu próprio usuário');
      return;
    }
    
    await deleteUser(userId);
  };

  const getUserTypeBadge = (userTypeName: string) => {
    switch (userTypeName) {
      case 'Administrador':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Administrador</Badge>;
      case 'Vendedor':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Vendedor</Badge>;
      case 'Faturamento':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Faturamento</Badge>;
      case 'Estoque':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Estoque</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{userTypeName}</Badge>;
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
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {userTypes.map(userType => (
                  <SelectItem key={userType.id} value={userType.id}>
                    {userType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-ferplas-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-2 text-sm text-gray-500">Carregando usuários...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="h-12 w-12 text-gray-300" />
                      <p className="mt-2 text-lg font-medium text-gray-500">Nenhum usuário encontrado</p>
                      <p className="text-sm text-gray-400">Tente ajustar seus filtros ou adicione um novo usuário</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getUserTypeBadge(user.userType.name)}</TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.createdAt.toLocaleDateString('pt-BR', {
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para adicionar/editar usuário */}
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
                        {userTypes.map(userType => (
                          <SelectItem key={userType.id} value={userType.id}>
                            {userType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {isEditMode && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleToggleChange('isActive', checked)}
                    />
                    <Label htmlFor="isActive">Usuário ativo</Label>
                  </div>
                )}
                
                {!isEditMode && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="password">Senha*</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Digite a senha"
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
                          placeholder="Confirme a senha"
                        />
                      </div>
                    </div>
                  </>
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
                    placeholder="Confirme a nova senha"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleToggleChange('isActive', checked)}
                  />
                  <Label htmlFor="isActive">Usuário ativo</Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
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
