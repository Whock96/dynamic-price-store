import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { v4 as uuidv4 } from 'uuid';
import { isAdministrador } from '@/utils/permissionUtils';
import { Skeleton } from '@/components/ui/skeleton';

interface User {
  id: string;
  username: string;
  name: string;
  password?: string;
  email?: string;
  user_type_id: string;
  user_type?: UserType;
  created_at: string;
  is_active: boolean;
}

interface UserType {
  id: string;
  name: string;
}

const UserManagement = () => {
  const { user: authUser } = useAuth();
  const canManageUsers = authUser && isAdministrador(authUser.userTypeId);

  const [users, setUsers] = useState<User[]>([]);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUserTypeId, setNewUserTypeId] = useState('');
  const [isNewUserActive, setIsNewUserActive] = useState(true);
  const [editUsername, setEditUsername] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUserTypeId, setEditUserTypeId] = useState('');
  const [isEditUserActive, setIsEditUserActive] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canManageUsers) return;
    fetchUsers();
    fetchUserTypes();
  }, [canManageUsers]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, user_type:user_types(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('user_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setUserTypes(data || []);
    } catch (error) {
      console.error('Error fetching user types:', error);
      toast.error('Erro ao carregar tipos de usuário');
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUsername || !newName || !newPassword || !newUserTypeId) {
        toast.error('Por favor, preencha todos os campos.');
        return;
      }

      const newUser = {
        id: uuidv4(),
        username: newUsername,
        name: newName,
        password: newPassword,
        email: newEmail,
        user_type_id: newUserTypeId,
        is_active: isNewUserActive,
      };

      const { error } = await supabase
        .from('users')
        .insert([newUser]);

      if (error) throw error;

      fetchUsers();
      toast.success('Usuário criado com sucesso!');
      closeCreateDialog();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Erro ao criar usuário');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const updates = {
        username: editUsername,
        name: editName,
        email: editEmail,
        user_type_id: editUserTypeId,
        is_active: isEditUserActive,
      };

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', selectedUser.id);

      if (error) throw error;

      fetchUsers();
      toast.success('Usuário atualizado com sucesso!');
      closeEditDialog();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Erro ao atualizar usuário');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', selectedUser.id);

      if (error) throw error;

      fetchUsers();
      toast.success('Usuário excluído com sucesso!');
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const openCreateDialog = () => {
    setNewUsername('');
    setNewName('');
    setNewPassword('');
    setNewEmail('');
    setNewUserTypeId('');
    setIsNewUserActive(true);
    setIsCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditUsername(user.username);
    setEditName(user.name);
    setEditEmail(user.email || '');
    setEditUserTypeId(user.user_type_id);
    setIsEditUserActive(user.is_active);
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  if (!canManageUsers) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground">Você não tem permissão para gerenciar usuários.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
        <Button onClick={openCreateDialog} className="bg-ferplas-500 hover:bg-ferplas-600">
          <Plus className="mr-2 h-4 w-4" />
          Criar Usuário
        </Button>
      </div>

      <Card>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tipo de Usuário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email || 'Não informado'}</TableCell>
                  <TableCell>{user.user_type?.name || 'Não informado'}</TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <div className="flex items-center">
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        Ativo
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <X className="mr-2 h-4 w-4 text-red-500" />
                        Inativo
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => openEditDialog(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => openDeleteDialog(user)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Crie um novo usuário para o sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Usuário
              </Label>
              <Input id="username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Senha
              </Label>
              <Input type="password" id="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input type="email" id="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="userTypeId" className="text-right">
                Tipo de Usuário
              </Label>
              <Select value={newUserTypeId} onValueChange={setNewUserTypeId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  {userTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="active" className="text-right">
                Ativo
              </Label>
              <Switch id="active" checked={isNewUserActive} onCheckedChange={setIsNewUserActive} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={closeCreateDialog}>
              Cancelar
            </Button>
            <Button type="submit" onClick={handleCreateUser} className="bg-ferplas-500 hover:bg-ferplas-600">
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Editar informações do usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editName" className="text-right">
                Nome
              </Label>
              <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editUsername" className="text-right">
                Usuário
              </Label>
              <Input id="editUsername" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editEmail" className="text-right">
                Email
              </Label>
              <Input type="email" id="editEmail" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editUserTypeId" className="text-right">
                Tipo de Usuário
              </Label>
              <Select value={editUserTypeId} onValueChange={setEditUserTypeId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  {userTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editActive" className="text-right">
                Ativo
              </Label>
              <Switch id="editActive" checked={isEditUserActive} onCheckedChange={setIsEditUserActive} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={closeEditDialog}>
              Cancelar
            </Button>
            <Button type="submit" onClick={handleUpdateUser} className="bg-ferplas-500 hover:bg-ferplas-600">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
