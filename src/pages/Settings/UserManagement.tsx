
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
  DialogTrigger,
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
import { MENU_ITEMS } from '../../context/AuthContext';
import { toast } from 'sonner';
import { User, Permission } from '@/types/types';

// Mock data para usuários
const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    username: 'admin',
    name: 'Administrador',
    role: 'administrator',
    permissions: [],
    email: 'admin@ferplas.ind.br',
    createdAt: new Date(2023, 0, 15)
  },
  {
    id: 'user-2',
    username: 'joao',
    name: 'João Silva',
    role: 'salesperson',
    permissions: [],
    email: 'joao@ferplas.ind.br',
    createdAt: new Date(2023, 2, 10)
  },
  {
    id: 'user-3',
    username: 'maria',
    name: 'Maria Oliveira',
    role: 'salesperson',
    permissions: [],
    email: 'maria@ferplas.ind.br',
    createdAt: new Date(2023, 4, 22)
  },
  {
    id: 'user-4',
    username: 'carlos',
    name: 'Carlos Santos',
    role: 'employee',
    permissions: [],
    email: 'carlos@ferplas.ind.br',
    createdAt: new Date(2023, 6, 8)
  },
];

// Mock permissions baseadas nos menus disponíveis
const generatePermissions = (menuItems: any[]): Permission[] => {
  const permissions: Permission[] = [];
  
  menuItems.forEach(item => {
    permissions.push({
      id: `perm-${item.id}`,
      name: item.name,
      description: `Acesso ao menu ${item.name}`,
      isGranted: true
    });
    
    if (item.submenus && item.submenus.length > 0) {
      item.submenus.forEach((submenu: any) => {
        permissions.push({
          id: `perm-${submenu.id}`,
          name: `${item.name} > ${submenu.name}`,
          description: `Acesso ao submenu ${submenu.name} dentro de ${item.name}`,
          isGranted: true
        });
      });
    }
  });
  
  return permissions;
};

// Adicionar permissões aos usuários mock
const enrichUsersWithPermissions = (users: User[], menuItems: any[]): User[] => {
  const allPermissions = generatePermissions(menuItems);
  
  return users.map(user => {
    const userPermissions = allPermissions.map(perm => ({
      ...perm,
      isGranted: user.role === 'administrator' ? true : 
                user.role === 'salesperson' ? !perm.name.includes('Configurações') : 
                !perm.name.includes('Configurações') && !perm.name.includes('Pedidos')
    }));
    
    return {
      ...user,
      permissions: userPermissions
    };
  });
};

const UserManagement = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedTab, setSelectedTab] = useState('basic');
  const [formData, setFormData] = useState({
    id: '',
    username: '',
    name: '',
    role: 'employee',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);

  // Verificar se o usuário atual é administrador
  useEffect(() => {
    if (currentUser?.role !== 'administrator') {
      toast.error('Você não tem permissão para acessar esta página');
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Inicializar dados de usuários com permissões
  useEffect(() => {
    const enrichedUsers = enrichUsersWithPermissions(MOCK_USERS, MENU_ITEMS);
    setUsers(enrichedUsers);
  }, []);

  // Filtrar usuários com base na pesquisa e papel
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setIsEditMode(true);
      setSelectedUser(user);
      setFormData({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        password: '',
        confirmPassword: '',
      });
    } else {
      setIsEditMode(false);
      setSelectedUser(null);
      setFormData({
        id: `user-${Date.now()}`,
        username: '',
        name: '',
        role: 'employee',
        email: '',
        password: '',
        confirmPassword: '',
      });
    }
    
    setIsDialogOpen(true);
    setSelectedTab('basic');
  };

  const handleOpenPermissionsDialog = (user: User) => {
    setSelectedUser(user);
    setUserPermissions([...user.permissions]);
    setIsPermissionsDialogOpen(true);
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

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTogglePermission = (permissionId: string) => {
    setUserPermissions(prev =>
      prev.map(permission =>
        permission.id === permissionId
          ? { ...permission, isGranted: !permission.isGranted }
          : permission
      )
    );
  };

  const handleSavePermissions = () => {
    if (!selectedUser) return;
    
    setUsers(prev =>
      prev.map(user =>
        user.id === selectedUser.id
          ? { ...user, permissions: userPermissions }
          : user
      )
    );
    
    setIsPermissionsDialogOpen(false);
    toast.success(`Permissões de ${selectedUser.name} atualizadas com sucesso`);
  };

  const handleSaveUser = () => {
    // Validação básica
    if (!formData.username || !formData.name || !formData.email) {
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

    // Verificar se o username já existe
    const usernameExists = users.some(u => u.username === formData.username && u.id !== formData.id);
    if (usernameExists) {
      toast.error('Este nome de usuário já está em uso');
      return;
    }

    // Verificar se o email já existe
    const emailExists = users.some(u => u.email === formData.email && u.id !== formData.id);
    if (emailExists) {
      toast.error('Este email já está em uso');
      return;
    }

    if (isEditMode) {
      // Atualizar usuário existente
      setUsers(prev => prev.map(u => u.id === formData.id ? {
        ...u,
        username: formData.username,
        name: formData.name,
        role: formData.role as 'administrator' | 'salesperson' | 'employee',
        email: formData.email,
      } : u));
      toast.success(`Usuário "${formData.name}" atualizado com sucesso`);
    } else {
      // Adicionar novo usuário
      const allPermissions = generatePermissions(MENU_ITEMS);
      const newUserPermissions = allPermissions.map(perm => ({
        ...perm,
        isGranted: formData.role === 'administrator' ? true : 
                  formData.role === 'salesperson' ? !perm.name.includes('Configurações') : 
                  !perm.name.includes('Configurações') && !perm.name.includes('Pedidos')
      }));
      
      const newUser: User = {
        id: formData.id,
        username: formData.username,
        name: formData.name,
        role: formData.role as 'administrator' | 'salesperson' | 'employee',
        permissions: newUserPermissions,
        email: formData.email,
        createdAt: new Date()
      };
      
      setUsers(prev => [...prev, newUser]);
      toast.success(`Usuário "${formData.name}" adicionado com sucesso`);
    }
    
    handleCloseDialog();
  };

  const handleDeleteUser = (userId: string) => {
    // Não permitir excluir o próprio usuário
    if (userId === currentUser?.id) {
      toast.error('Você não pode excluir seu próprio usuário');
      return;
    }
    
    setUsers(prev => prev.filter(u => u.id !== userId));
    toast.success('Usuário removido com sucesso');
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'administrator':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Administrador</Badge>;
      case 'salesperson':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Vendedor</Badge>;
      case 'employee':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Funcionário</Badge>;
      default:
        return <Badge>Desconhecido</Badge>;
    }
  };

  // Agrupar permissões por categoria para exibição mais organizada
  const groupPermissionsByCategory = (permissions: Permission[]) => {
    const categories: Record<string, Permission[]> = {};
    
    permissions.forEach(permission => {
      const parts = permission.name.split(' > ');
      const category = parts[0];
      
      if (!categories[category]) {
        categories[category] = [];
      }
      
      categories[category].push(permission);
    });
    
    return categories;
  };

  const groupedPermissions = groupPermissionsByCategory(userPermissions);

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
              Adicione, edite e defina permissões de acesso para usuários
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
                <SelectItem value="administrator">Administradores</SelectItem>
                <SelectItem value="salesperson">Vendedores</SelectItem>
                <SelectItem value="employee">Funcionários</SelectItem>
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
                <TableHead>Data de Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
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
                      className="h-8 px-2 text-ferplas-600"
                      onClick={() => handleOpenPermissionsDialog(user)}
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Permissões
                    </Button>
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
          
          {filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-600">Nenhum usuário encontrado</h2>
              <p className="text-gray-500 mt-1">Tente ajustar seus filtros ou adicione um novo usuário.</p>
            </div>
          )}
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
                    <Label htmlFor="email">Email*</Label>
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
                    <Label htmlFor="role">Tipo de Usuário*</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value) => handleSelectChange('role', value)}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Selecione um tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="administrator">Administrador</SelectItem>
                        <SelectItem value="salesperson">Vendedor</SelectItem>
                        <SelectItem value="employee">Funcionário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Deixe em branco para manter a senha atual"
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmNewPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmNewPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirmar nova senha"
                  />
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

      {/* Dialog para gerenciar permissões */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permissões de Acesso</DialogTitle>
            <DialogDescription>
              Defina quais funcionalidades o usuário {selectedUser?.name} terá acesso.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([category, permissions]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-lg font-medium">{category}</h3>
                <Separator />
                
                <div className="space-y-3">
                  {permissions.map(permission => (
                    <div key={permission.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{permission.name}</p>
                        <p className="text-sm text-gray-500">{permission.description}</p>
                      </div>
                      <Switch
                        checked={permission.isGranted}
                        onCheckedChange={() => handleTogglePermission(permission.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePermissions} className="bg-ferplas-500 hover:bg-ferplas-600">
              <Save className="mr-2 h-4 w-4" />
              Salvar Permissões
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
