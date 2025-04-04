
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Search, Plus, Edit, Trash2, ArrowLeft, Check, X, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useAuth } from '@/context/AuthContext';
import { useUserTypes } from '@/hooks/use-user-types';

const UserTypesManagement = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { userTypes, permissions, isLoading, createUserType, updateUserType, deleteUserType } = useUserTypes();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserTypeId, setSelectedUserTypeId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Check if user has permission to access this page
  useEffect(() => {
    if (!hasPermission('settings.usertypes')) {
      navigate('/dashboard');
    }
  }, [hasPermission, navigate]);

  // Group permissions by category for better organization
  const groupPermissionsByCategory = () => {
    const grouped: Record<string, typeof permissions> = {};
    
    permissions.forEach(permission => {
      const category = permission.code.split('.')[0];
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(permission);
    });
    
    return grouped;
  };

  const groupedPermissions = groupPermissionsByCategory();

  // Filter user types based on search query
  const filteredUserTypes = userTypes.filter(userType => 
    userType.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    userType.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (userType?: typeof userTypes[0]) => {
    if (userType) {
      setIsEditMode(true);
      setSelectedUserTypeId(userType.id);
      setFormData({
        name: userType.name,
        description: userType.description,
      });
      setSelectedPermissions(userType.permissions.map(p => p.id));
    } else {
      setIsEditMode(false);
      setSelectedUserTypeId(null);
      setFormData({
        name: '',
        description: '',
      });
      setSelectedPermissions([]);
    }
    
    setIsDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
    }
  };

  const toggleAllPermissionsInCategory = (categoryPermissions: typeof permissions, checked: boolean) => {
    if (checked) {
      const permissionIds = categoryPermissions.map(p => p.id);
      setSelectedPermissions(prev => 
        [...new Set([...prev, ...permissionIds])]
      );
    } else {
      const permissionIds = new Set(categoryPermissions.map(p => p.id));
      setSelectedPermissions(prev => 
        prev.filter(id => !permissionIds.has(id))
      );
    }
  };

  const isCategoryFullySelected = (categoryPermissions: typeof permissions) => {
    return categoryPermissions.every(p => selectedPermissions.includes(p.id));
  };

  const isCategoryPartiallySelected = (categoryPermissions: typeof permissions) => {
    const selected = categoryPermissions.some(p => selectedPermissions.includes(p.id));
    return selected && !isCategoryFullySelected(categoryPermissions);
  };

  const handleSaveUserType = async () => {
    if (!formData.name) {
      return;
    }

    let success;
    if (isEditMode && selectedUserTypeId) {
      success = await updateUserType(
        selectedUserTypeId,
        formData.name,
        formData.description,
        selectedPermissions
      );
    } else {
      success = await createUserType(
        formData.name,
        formData.description,
        selectedPermissions
      );
    }

    if (success) {
      setIsDialogOpen(false);
    }
  };

  const handleDeleteUserType = async (id: string) => {
    await deleteUserType(id);
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
            <h1 className="text-3xl font-bold tracking-tight">Tipos de Usuário</h1>
            <p className="text-muted-foreground">
              Defina diferentes tipos de usuário e suas permissões
            </p>
          </div>
        </div>
        <Button 
          className="bg-ferplas-500 hover:bg-ferplas-600 button-transition"
          onClick={() => handleOpenDialog()}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Tipo de Usuário
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
              placeholder="Buscar tipos de usuário por nome ou descrição..."
              className="pl-10 input-transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Permissões</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-ferplas-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-2 text-sm text-gray-500">Carregando tipos de usuário...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUserTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <Shield className="h-12 w-12 text-gray-300" />
                      <p className="mt-2 text-lg font-medium text-gray-500">Nenhum tipo de usuário encontrado</p>
                      <p className="text-sm text-gray-400">Tente ajustar seus filtros ou adicione um novo tipo de usuário</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUserTypes.map(userType => (
                  <TableRow key={userType.id}>
                    <TableCell className="font-medium">{userType.name}</TableCell>
                    <TableCell>{userType.description}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {userType.permissions.length > 5 ? (
                          <>
                            {userType.permissions.slice(0, 5).map(permission => (
                              <Badge key={permission.id} variant="outline" className="bg-blue-50">
                                {permission.name}
                              </Badge>
                            ))}
                            <Badge variant="outline" className="bg-gray-100">
                              +{userType.permissions.length - 5} mais
                            </Badge>
                          </>
                        ) : (
                          userType.permissions.map(permission => (
                            <Badge key={permission.id} variant="outline" className="bg-blue-50">
                              {permission.name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 px-2 text-amber-600"
                        onClick={() => handleOpenDialog(userType)}
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para adicionar/editar tipo de usuário */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Editar Tipo de Usuário' : 'Novo Tipo de Usuário'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Atualize as informações e permissões do tipo de usuário.' 
                : 'Defina um novo tipo de usuário e suas permissões.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome*</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: Vendedor"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descreva este tipo de usuário"
              />
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <h3 className="text-md font-medium">Permissões</h3>
              <Accordion type="multiple" className="w-full">
                {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`category-${category}`}
                          checked={isCategoryFullySelected(categoryPermissions)}
                          data-state={isCategoryPartiallySelected(categoryPermissions) ? "indeterminate" : isCategoryFullySelected(categoryPermissions) ? "checked" : "unchecked"}
                          onCheckedChange={(checked) => toggleAllPermissionsInCategory(categoryPermissions, checked === true)}
                          onClick={(e) => e.stopPropagation()}
                          className="mr-2"
                        />
                        <Label 
                          htmlFor={`category-${category}`}
                          className="text-base font-medium capitalize"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {category}
                        </Label>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="ml-6 space-y-2">
                        {categoryPermissions.map(permission => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={permission.id}
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked === true)}
                            />
                            <div className="grid gap-1.5">
                              <Label 
                                htmlFor={permission.id}
                                className="font-medium"
                              >
                                {permission.name}
                              </Label>
                              {permission.description && (
                                <p className="text-[0.8rem] text-muted-foreground">
                                  {permission.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleSaveUserType} className="bg-ferplas-500 hover:bg-ferplas-600">
              <Save className="mr-2 h-4 w-4" />
              {isEditMode ? 'Salvar Alterações' : 'Criar Tipo de Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserTypesManagement;
