import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Search, Plus, Edit, Trash2, ArrowLeft, Save,
  Check, X, Users, Eye, EyeOff, FolderOpen, LayoutDashboard,
  ShoppingCart, Package, Settings, UsersRound, Percent, Tag,
  Building2, FileEdit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { UserType, Permission } from '@/types/types';
import { useSupabaseData } from '@/hooks/use-supabase-data';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/utils/formatters';
import PermissionCheckbox from '@/components/permissions/PermissionCheckbox';

interface UserTypeWithDates extends UserType {
  createdAt: Date;
  updatedAt: Date;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

const PAGE_GROUPS = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5 mr-2" />,
    description: 'Página inicial do sistema',
    permissions: [
      { code: 'dashboard_access', name: 'Dashboard', description: 'Acesso à página inicial' }
    ]
  },
  {
    id: 'products',
    name: 'Produtos',
    icon: <Package className="h-5 w-5 mr-2" />,
    description: 'Gerenciamento de produtos',
    permissions: [
      { code: 'products_view', name: 'Visualizar Produtos', description: 'Ver lista de produtos' },
      { code: 'products_manage', name: 'Gerenciar Produtos', description: 'Adicionar, editar e excluir produtos' }
    ]
  },
  {
    id: 'customers',
    name: 'Clientes',
    icon: <UsersRound className="h-5 w-5 mr-2" />,
    description: 'Gerenciamento de clientes',
    permissions: [
      { code: 'customers_view', name: 'Visualizar Clientes', description: 'Ver lista de clientes' },
      { code: 'customers_manage', name: 'Gerenciar Clientes', description: 'Adicionar, editar e excluir clientes' }
    ]
  },
  {
    id: 'orders',
    name: 'Pedidos',
    icon: <FileEdit className="h-5 w-5 mr-2" />,
    description: 'Gerenciamento de pedidos',
    permissions: [
      { code: 'orders_view', name: 'Visualizar Pedidos', description: 'Ver lista e detalhes de pedidos' },
      { code: 'orders_manage', name: 'Gerenciar Pedidos', description: 'Criar e atualizar pedidos' }
    ]
  },
  {
    id: 'cart',
    name: 'Carrinho',
    icon: <ShoppingCart className="h-5 w-5 mr-2" />,
    description: 'Acesso ao carrinho de compras',
    permissions: [
      { code: 'orders_manage', name: 'Gerenciar Carrinho', description: 'Acesso ao carrinho e criação de pedidos' }
    ]
  },
  {
    id: 'settings',
    name: 'Configurações',
    icon: <Settings className="h-5 w-5 mr-2" />,
    description: 'Configurações do sistema',
    permissions: [
      { code: 'settings_view', name: 'Acessar Configurações', description: 'Acesso à página de configurações' },
      { code: 'settings_manage', name: 'Gerenciar Configurações', description: 'Alterar configurações da empresa' },
      { code: 'categories_manage', name: 'Gerenciar Categorias', description: 'Configurar categorias de produtos' },
      { code: 'discounts_manage', name: 'Gerenciar Descontos', description: 'Configurar opções de desconto' },
      { code: 'users_view', name: 'Visualizar Usuários', description: 'Ver lista de usuários' },
      { code: 'users_manage', name: 'Gerenciar Usuários', description: 'Adicionar, editar e excluir usuários' },
      { code: 'user_types_manage', name: 'Gerenciar Tipos de Usuário', description: 'Configurar tipos de usuário e permissões' }
    ]
  }
];

const UserTypeManagement = () => {
  const navigate = useNavigate();
  const { user: currentUser, hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserTypeDialogOpen, setIsUserTypeDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<UserTypeWithDates | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [userTypeFormData, setUserTypeFormData] = useState({
    id: '',
    name: '',
    description: '',
    isActive: true,
  });

  const userTypesOptions = useMemo(() => ({
    orderBy: { column: 'name', ascending: true }
  }), []);

  const permissionsOptions = useMemo(() => ({
    orderBy: { column: 'name', ascending: true }
  }), []);

  const { 
    data: userTypesRaw, 
    isLoading, 
    fetchData: fetchUserTypes,
    createRecord: createUserType,
    updateRecord: updateUserType,
    deleteRecord: deleteUserType
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

  const {
    data: allPermissions,
    isLoading: isLoadingPermissions,
    fetchData: fetchAllPermissions
  } = useSupabaseData<Permission>('permissions', permissionsOptions);

  useEffect(() => {
    if (!hasPermission('user_types_manage')) {
      toast.error('Você não tem permissão para acessar esta página');
      navigate('/dashboard');
      return;
    }
  }, [navigate, hasPermission]);

  const fetchUserTypePermissions = async (userTypeId: string) => {
    try {
      const { data: permLinks, error: permLinksError } = await supabase
        .from('user_type_permissions')
        .select('permission_id')
        .eq('user_type_id', userTypeId);
        
      if (permLinksError) throw permLinksError;
      
      if (permLinks) {
        const grantedPermissionIds = new Set(permLinks.map(p => p.permission_id));
        
        const updatedPermissions = allPermissions.map(p => ({
          ...p,
          isGranted: grantedPermissionIds.has(p.id)
        }));
        
        setSelectedPermissions(updatedPermissions);
      }
    } catch (err) {
      console.error('Error fetching user type permissions:', err);
      toast.error('Erro ao carregar permissões do tipo de usuário');
      setSelectedPermissions(allPermissions.map(p => ({ ...p, isGranted: false })));
    }
  };

  const handleOpenUserTypeDialog = (userType?: UserTypeWithDates) => {
    if (userType) {
      setIsEditMode(true);
      setSelectedUserType(userType);
      setUserTypeFormData({
        id: userType.id,
        name: userType.name,
        description: userType.description || '',
        isActive: userType.is_active !== false,
      });
    } else {
      setIsEditMode(false);
      setSelectedUserType(null);
      setUserTypeFormData({
        id: '',
        name: '',
        description: '',
        isActive: true,
      });
    }
    
    setIsUserTypeDialogOpen(true);
  };

  const handleOpenPermissionsDialog = async (userType: UserTypeWithDates) => {
    setSelectedUserType(userType);
    await fetchUserTypePermissions(userType.id);
    setIsPermissionsDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserTypeFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.map(permission =>
        permission.id === permissionId
          ? { ...permission, isGranted: !permission.isGranted }
          : permission
      )
    );
  };

  const handleToggleGroupPermissions = (groupPermissions: { code: string }[], enabled: boolean) => {
    const permissionCodes = new Set(groupPermissions.map(p => p.code));
    
    setSelectedPermissions(prev =>
      prev.map(permission => ({
        ...permission,
        isGranted: permissionCodes.has(permission.code || '') 
          ? enabled 
          : permission.isGranted
      }))
    );
  };

  const isGroupFullyGranted = (groupPermissions: { code: string }[]) => {
    const codes = new Set(groupPermissions.map(p => p.code));
    return selectedPermissions
      .filter(p => codes.has(p.code || ''))
      .every(p => p.isGranted);
  };

  const isGroupPartiallyGranted = (groupPermissions: { code: string }[]) => {
    const codes = new Set(groupPermissions.map(p => p.code));
    const relevantPerms = selectedPermissions.filter(p => codes.has(p.code || ''));
    const grantedCount = relevantPerms.filter(p => p.isGranted).length;
    return grantedCount > 0 && grantedCount < relevantPerms.length;
  };

  const handleToggleActive = () => {
    setUserTypeFormData(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
  };

  const handleSaveUserType = async () => {
    if (!userTypeFormData.name.trim()) {
      toast.error('O nome do tipo de usuário é obrigatório');
      return;
    }

    try {
      if (isEditMode) {
        await updateUserType(userTypeFormData.id, {
          name: userTypeFormData.name,
          description: userTypeFormData.description,
          updatedAt: new Date()
        });
        
        toast.success(`Tipo de usuário "${userTypeFormData.name}" atualizado com sucesso`);
      } else {
        await createUserType({
          name: userTypeFormData.name,
          description: userTypeFormData.description,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        toast.success(`Tipo de usuário "${userTypeFormData.name}" criado com sucesso`);
      }
      
      fetchUserTypes();
      setIsUserTypeDialogOpen(false);
    } catch (err) {
      console.error('Error saving user type:', err);
      toast.error('Erro ao salvar tipo de usuário');
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUserType) return;
    
    try {
      const { data: currentPerms, error: fetchError } = await supabase
        .from('user_type_permissions')
        .select('permission_id')
        .eq('user_type_id', selectedUserType.id);
        
      if (fetchError) throw fetchError;
      
      if (currentPerms) {
        const currentPermIds = new Set(currentPerms.map(p => p.permission_id));
        const selectedPermIds = new Set(selectedPermissions.filter(p => p.isGranted).map(p => p.id));
        
        const toAdd = selectedPermissions
          .filter(p => p.isGranted && !currentPermIds.has(p.id))
          .map(p => ({
            user_type_id: selectedUserType.id,
            permission_id: p.id
          }));
          
        const toRemove = [...currentPermIds].filter(id => !selectedPermIds.has(id));
        
        if (toAdd.length > 0) {
          const { error: addError } = await supabase
            .from('user_type_permissions')
            .insert(toAdd);
            
          if (addError) throw addError;
        }
        
        for (const permId of toRemove) {
          const { error: removeError } = await supabase
            .from('user_type_permissions')
            .delete()
            .eq('user_type_id', selectedUserType.id)
            .eq('permission_id', permId);
            
          if (removeError) throw removeError;
        }
      }
      
      toast.success(`Permissões do tipo "${selectedUserType.name}" atualizadas com sucesso`);
      setIsPermissionsDialogOpen(false);
    } catch (err) {
      console.error('Error saving permissions:', err);
      toast.error('Erro ao salvar permissões');
    }
  };

  const handleDeleteUserType = async (userTypeId: string) => {
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('user_type_id', userTypeId)
        .limit(1);
        
      if (usersError) throw usersError;
      
      if (users && users.length > 0) {
        toast.error('Este tipo de usuário está em uso e não pode ser excluído. Considere inativar o tipo em vez de removê-lo.');
        return;
      }
      
      const { error: permDeleteError } = await supabase
        .from('user_type_permissions')
        .delete()
        .eq('user_type_id', userTypeId);
        
      if (permDeleteError) throw permDeleteError;
      
      await deleteUserType(userTypeId);
      
      toast.success('Tipo de usuário removido com sucesso');
      fetchUserTypes();
    } catch (err) {
      console.error('Error deleting user type:', err);
      toast.error('Erro ao excluir tipo de usuário');
    }
  };

  const handleInactivateUserType = async (userTypeId: string, newStatus: boolean) => {
    try {
      await updateUserType(userTypeId, {
        updatedAt: new Date()
      });
      
      toast.success(`Tipo de usuário ${newStatus ? 'ativado' : 'inativado'} com sucesso`);
      fetchUserTypes();
    } catch (err) {
      console.error('Error updating user type status:', err);
      toast.error(`Erro ao ${newStatus ? 'ativar' : 'inativar'} tipo de usuário`);
    }
  };

  const filteredUserTypes = useMemo(() => {
    return userTypes.filter(userType => {
      return userType.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (userType.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [userTypes, searchQuery]);

  const findPermissionByCode = (code: string) => {
    return selectedPermissions.find(p => p.code === code);
  };

  const isPermissionGranted = (code: string) => {
    const permission = findPermissionByCode(code);
    return permission?.isGranted || false;
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
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Tipos de Usuário</h1>
            <p className="text-muted-foreground">
              Adicione, edite e defina permissões para diferentes tipos de usuário
            </p>
          </div>
        </div>
        <Button 
          className="bg-ferplas-500 hover:bg-ferplas-600 button-transition"
          onClick={() => handleOpenUserTypeDialog()}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Tipo
        </Button>
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
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 px-2 text-ferplas-600"
                        onClick={() => handleOpenPermissionsDialog(userType)}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Permissões
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 px-2 text-amber-600"
                        onClick={() => handleOpenUserTypeDialog(userType)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      {userType.is_active !== false ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 px-2 text-gray-600"
                          onClick={() => handleInactivateUserType(userType.id, false)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Inativar
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 px-2 text-green-600"
                          onClick={() => handleInactivateUserType(userType.id, true)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Ativar
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 px-2 text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Excluir
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover tipo de usuário?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação irá remover permanentemente o tipo de usuário "{userType.name}" do sistema. 
                              Esta ação não pode ser desfeita. Considere inativar o tipo em vez de removê-lo.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleDeleteUserType(userType.id)}
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
          
          {!isLoading && filteredUserTypes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="h-12 w-12 text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-600">Nenhum tipo de usuário encontrado</h2>
              <p className="text-gray-500 mt-1">Tente ajustar seus filtros ou adicione um novo tipo de usuário.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isUserTypeDialogOpen} onOpenChange={setIsUserTypeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Editar Tipo de Usuário' : 'Novo Tipo de Usuário'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Atualize as informações do tipo de usuário abaixo.' 
                : 'Preencha os dados para adicionar um novo tipo de usuário ao sistema.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome*</Label>
              <Input
                id="name"
                name="name"
                value={userTypeFormData.name}
                onChange={handleInputChange}
                placeholder="Ex: Vendedor"
              />
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

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label htmlFor="isActive">Status:</Label>
                <span className="text-sm">
                  {userTypeFormData.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <Switch
                id="isActive"
                checked={userTypeFormData.isActive}
                onCheckedChange={handleToggleActive}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserTypeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUserType} className="bg-ferplas-500 hover:bg-ferplas-600">
              <Save className="mr-2 h-4 w-4" />
              {isEditMode ? 'Salvar Alterações' : 'Adicionar Tipo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permissões de Acesso</DialogTitle>
            <DialogDescription>
              Selecione quais páginas o tipo de usuário <span className="font-medium">{selectedUserType?.name}</span> terá acesso.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {isLoadingPermissions ? (
              <div className="flex justify-center py-6">
                <div className="w-8 h-8 border-4 border-ferplas-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <Accordion type="multiple" className="w-full">
                {PAGE_GROUPS.map((group) => {
                  const isFullyEnabled = isGroupFullyGranted(group.permissions);
                  const isPartiallyEnabled = isGroupPartiallyGranted(group.permissions);
                  
                  return (
                    <AccordionItem value={group.id} key={group.id} className="border border-gray-200 rounded-md mb-3 overflow-hidden">
                      <div className="flex items-center px-4 py-2 bg-gray-50">
                        <div className="flex-1">
                          <AccordionTrigger className="py-0 [&[data-state=open]>svg]:rotate-180">
                            <div className="flex items-center">
                              {group.icon}
                              <span className="font-medium">{group.name}</span>
                            </div>
                          </AccordionTrigger>
                        </div>
                        <div className="flex items-center space-x-2 mr-2">
                          {isFullyEnabled ? (
                            <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                              <Eye className="h-3 w-3" /> Acesso Total
                            </Badge>
                          ) : isPartiallyEnabled ? (
                            <Badge variant="outline" className="text-amber-600 flex items-center gap-1">
                              <Eye className="h-3 w-3" /> Acesso Parcial
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500 flex items-center gap-1">
                              <EyeOff className="h-3 w-3" /> Sem Acesso
                            </Badge>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleGroupPermissions(group.permissions, !isFullyEnabled);
                            }}
                            className="h-8"
                          >
                            {isFullyEnabled ? 'Desativar Tudo' : 'Ativar Tudo'}
                          </Button>
                        </div>
                      </div>
                      <AccordionContent className="pt-2 pb-0">
                        <div className="px-4 pb-4 divide-y divide-gray-100">
                          {group.permissions.map((permission) => {
                            const perm = findPermissionByCode(permission.code);
                            if (!perm) return null;
                            
                            return (
                              <PermissionCheckbox
                                key={perm.id}
                                id={perm.id}
                                label={permission.name}
                                description={permission.description}
                                checked={perm.isGranted || false}
                                onCheckedChange={() => handleTogglePermission(perm.id)}
                                className="py-3"
                              />
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
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

export default UserTypeManagement;
