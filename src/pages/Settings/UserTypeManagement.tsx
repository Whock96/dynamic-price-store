import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Search, Plus, Edit, Trash2, ArrowLeft, Save,
  Check, X, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { UserType, Permission } from '@/types/types';
import { supabase } from '@/integrations/supabase/client';

interface UserTypeWithDates extends UserType {
  createdAt: Date;
  updatedAt: Date;
}

const UserTypeManagement = () => {
  const navigate = useNavigate();
  const { user: currentUser, hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypes, setUserTypes] = useState<UserTypeWithDates[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserTypeDialogOpen, setIsUserTypeDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<UserTypeWithDates | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [userTypeFormData, setUserTypeFormData] = useState({
    id: '',
    name: '',
    description: '',
  });

  // Verify admin access
  useEffect(() => {
    if (!hasPermission('user_types_manage')) {
      toast.error('Você não tem permissão para acessar esta página');
      navigate('/dashboard');
      return;
    }
    
    fetchUserTypes();
    fetchAllPermissions();
  }, [navigate, hasPermission]);

  const fetchUserTypes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_types')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      const formattedData = data.map(type => ({
        id: type.id,
        name: type.name,
        description: type.description || '',
        createdAt: new Date(type.created_at),
        updatedAt: new Date(type.updated_at)
      })) as UserTypeWithDates[];
      
      // Remove duplicate user types (keeping only administrator, salesperson, billing, inventory)
      // This ensures only the standard roles are shown
      const standardRoles = ['administrator', 'salesperson', 'billing', 'inventory'];
      const filteredData = formattedData.filter(type => 
        standardRoles.includes(type.name.toLowerCase())
      );
      
      setUserTypes(filteredData);
    } catch (err) {
      console.error('Error fetching user types:', err);
      toast.error('Erro ao carregar tipos de usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      if (data) {
        const formattedPermissions = data.map(perm => ({
          id: perm.id,
          name: perm.name,
          description: perm.description || '',
          code: perm.code,
          isGranted: false
        }));
        
        setAllPermissions(formattedPermissions);
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
      toast.error('Erro ao carregar permissões');
    }
  };

  const fetchUserTypePermissions = async (userTypeId: string) => {
    try {
      // Get permission IDs linked to this user type
      const { data: permLinks, error: permLinksError } = await supabase
        .from('user_type_permissions')
        .select('permission_id')
        .eq('user_type_id', userTypeId);
        
      if (permLinksError) throw permLinksError;
      
      if (permLinks) {
        // Create a set of granted permission IDs for quick lookup
        const grantedPermissionIds = new Set(permLinks.map(p => p.permission_id));
        
        // Mark permissions as granted based on the links
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
        description: userType.description,
      });
    } else {
      setIsEditMode(false);
      setSelectedUserType(null);
      setUserTypeFormData({
        id: '',
        name: '',
        description: '',
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

  const handleSaveUserType = async () => {
    if (!userTypeFormData.name.trim()) {
      toast.error('O nome do tipo de usuário é obrigatório');
      return;
    }

    try {
      if (isEditMode) {
        // Update existing user type
        const { error } = await supabase
          .from('user_types')
          .update({
            name: userTypeFormData.name,
            description: userTypeFormData.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', userTypeFormData.id);
          
        if (error) throw error;
        
        toast.success(`Tipo de usuário "${userTypeFormData.name}" atualizado com sucesso`);
      } else {
        // Create new user type
        const { data, error } = await supabase
          .from('user_types')
          .insert({
            name: userTypeFormData.name,
            description: userTypeFormData.description,
          })
          .select();
          
        if (error) throw error;
        
        toast.success(`Tipo de usuário "${userTypeFormData.name}" criado com sucesso`);
      }
      
      // Refresh user types list
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
      // Get current permissions
      const { data: currentPerms, error: fetchError } = await supabase
        .from('user_type_permissions')
        .select('permission_id')
        .eq('user_type_id', selectedUserType.id);
        
      if (fetchError) throw fetchError;
      
      if (currentPerms) {
        // Find permissions to add and remove
        const currentPermIds = new Set(currentPerms.map(p => p.permission_id));
        const selectedPermIds = new Set(selectedPermissions.filter(p => p.isGranted).map(p => p.id));
        
        const toAdd = selectedPermissions
          .filter(p => p.isGranted && !currentPermIds.has(p.id))
          .map(p => ({
            user_type_id: selectedUserType.id,
            permission_id: p.id
          }));
          
        const toRemove = [...currentPermIds].filter(id => !selectedPermIds.has(id));
        
        // Add new permissions
        if (toAdd.length > 0) {
          const { error: addError } = await supabase
            .from('user_type_permissions')
            .insert(toAdd);
            
          if (addError) throw addError;
        }
        
        // Remove permissions
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
      // Check if user type is being used by any users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('user_type_id', userTypeId)
        .limit(1);
        
      if (usersError) throw usersError;
      
      if (users && users.length > 0) {
        toast.error('Este tipo de usuário está em uso e não pode ser excluído');
        return;
      }
      
      // Delete permissions links first
      const { error: permDeleteError } = await supabase
        .from('user_type_permissions')
        .delete()
        .eq('user_type_id', userTypeId);
        
      if (permDeleteError) throw permDeleteError;
      
      // Delete user type
      const { error: deleteError } = await supabase
        .from('user_types')
        .delete()
        .eq('id', userTypeId);
        
      if (deleteError) throw deleteError;
      
      toast.success('Tipo de usuário removido com sucesso');
      fetchUserTypes();
    } catch (err) {
      console.error('Error deleting user type:', err);
      toast.error('Erro ao excluir tipo de usuário');
    }
  };

  // Filter user types based on search query
  const filteredUserTypes = userTypes.filter(userType => {
    return userType.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           userType.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Group permissions by category using the name format "Category > Permission"
  const groupPermissions = () => {
    const grouped: Record<string, Permission[]> = {};
    
    selectedPermissions.forEach(permission => {
      const nameParts = permission.name.includes(' > ') 
        ? permission.name.split(' > ') 
        : ['Geral', permission.name];
      
      const category = nameParts[0];
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      grouped[category].push(permission);
    });
    
    return grouped;
  };

  const groupedPermissions = groupPermissions();

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
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUserTypes.map(userType => (
                  <TableRow key={userType.id}>
                    <TableCell className="font-medium">{userType.name}</TableCell>
                    <TableCell>{userType.description}</TableCell>
                    <TableCell>
                      {userType.createdAt.toLocaleDateString('pt-BR', {
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
                              Esta ação não pode ser desfeita.
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

      {/* Dialog for adding/editing user type */}
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

      {/* Dialog for managing permissions */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permissões de Acesso</DialogTitle>
            <DialogDescription>
              Defina quais funcionalidades o tipo de usuário {selectedUserType?.name} terá acesso.
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
                        <p className="font-medium">{permission.name.includes(' > ') 
                          ? permission.name.split(' > ')[1] 
                          : permission.name}
                        </p>
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

export default UserTypeManagement;
