import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, X, Check, Pencil, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
} from "@/components/ui/alert-dialog"
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { isAdministrador } from '@/utils/permissionUtils';

interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  subcategories?: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
}

const CategoryManagement = () => {
  const { user } = useAuth();
  const canManageCategories = user && isAdministrador(user.userTypeId);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState('');
  const [editedCategoryDescription, setEditedCategoryDescription] = useState('');
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategoryDescription, setNewSubcategoryDescription] = useState('');
	const [selectedCategoryForSubcategory, setSelectedCategoryForSubcategory] = useState<string | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [editedSubcategoryName, setEditedSubcategoryName] = useState('');
  const [editedSubcategoryDescription, setEditedSubcategoryDescription] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*, subcategories(id, name, description, category_id)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Nome da categoria não pode estar vazio');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: newCategoryName, description: newCategoryDescription }])
        .select()
        .single();

      if (error) throw error;

      setCategories([...categories, data]);
      setNewCategoryName('');
      setNewCategoryDescription('');
      toast.success('Categoria criada com sucesso!');
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Erro ao criar categoria');
    }
  };

  const handleStartEditingCategory = (category: Category) => {
    setEditingCategory(category);
    setEditedCategoryName(category.name);
    setEditedCategoryDescription(category.description || '');
  };

  const handleCancelEditingCategory = () => {
    setEditingCategory(null);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: editedCategoryName, description: editedCategoryDescription })
        .eq('id', editingCategory.id);

      if (error) throw error;

      setCategories(
        categories.map((cat) =>
          cat.id === editingCategory.id ? { ...cat, name: editedCategoryName, description: editedCategoryDescription } : cat
        )
      );
      setEditingCategory(null);
      toast.success('Categoria atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Erro ao atualizar categoria');
    }
  };

  const confirmDelete = (id: string) => {
    setDeletingCategoryId(id);
    setIsAlertOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategoryId) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', deletingCategoryId);

      if (error) throw error;

      setCategories(categories.filter((cat) => cat.id !== deletingCategoryId));
      setIsAlertOpen(false);
      toast.success('Categoria excluída com sucesso!');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erro ao excluir categoria');
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleCreateSubcategory = async () => {
		if (!selectedCategoryForSubcategory) {
			toast.error('Selecione uma categoria para a subcategoria');
			return;
		}

    if (!newSubcategoryName.trim()) {
      toast.error('Nome da subcategoria não pode estar vazio');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subcategories')
        .insert([{ name: newSubcategoryName, description: newSubcategoryDescription, category_id: selectedCategoryForSubcategory }])
        .select()
        .single();

      if (error) throw error;

      // Update the categories state to include the new subcategory
      setCategories(categories.map(cat => {
        if (cat.id === selectedCategoryForSubcategory) {
          return {
            ...cat,
            subcategories: [...(cat.subcategories || []), data]
          };
        }
        return cat;
      }));

      setNewSubcategoryName('');
      setNewSubcategoryDescription('');
			setSelectedCategoryForSubcategory(null);
      toast.success('Subcategoria criada com sucesso!');
    } catch (error) {
      console.error('Error creating subcategory:', error);
      toast.error('Erro ao criar subcategoria');
    }
  };

  const handleStartEditingSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setEditedSubcategoryName(subcategory.name);
    setEditedSubcategoryDescription(subcategory.description || '');
  };

  const handleCancelEditingSubcategory = () => {
    setEditingSubcategory(null);
  };

  const handleUpdateSubcategory = async () => {
    if (!editingSubcategory) return;

    try {
      const { error } = await supabase
        .from('subcategories')
        .update({ name: editedSubcategoryName, description: editedSubcategoryDescription })
        .eq('id', editingSubcategory.id);

      if (error) throw error;

      // Update the categories state to reflect the updated subcategory
      setCategories(categories.map(cat => {
        if (cat.id === editingSubcategory.category_id) {
          return {
            ...cat,
            subcategories: cat.subcategories?.map(sub =>
              sub.id === editingSubcategory.id ? { ...sub, name: editedSubcategoryName, description: editedSubcategoryDescription } : sub
            )
          };
        }
        return cat;
      }));

      setEditingSubcategory(null);
      toast.success('Subcategoria atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating subcategory:', error);
      toast.error('Erro ao atualizar subcategoria');
    }
  };

  if (!canManageCategories) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground">Você não tem permissão para gerenciar categorias.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Gerenciar Categorias</CardTitle>
          <Button onClick={handleCreateCategory} className="bg-ferplas-500 hover:bg-ferplas-600">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Categoria
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="Nome da categoria"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <Textarea
                placeholder="Descrição da categoria"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Categorias Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    {editingCategory?.id === category.id ? (
                      <Input
                        type="text"
                        value={editedCategoryName}
                        onChange={(e) => setEditedCategoryName(e.target.value)}
                      />
                    ) : (
                      category.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingCategory?.id === category.id ? (
                      <Textarea
                        value={editedCategoryDescription}
                        onChange={(e) => setEditedCategoryDescription(e.target.value)}
                      />
                    ) : (
                      category.description
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingCategory?.id === category.id ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={handleUpdateCategory}>
                          <Check className="mr-2 h-4 w-4" />
                          Salvar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelEditingCategory}>
                          <X className="mr-2 h-4 w-4" />
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleStartEditingCategory(category)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => confirmDelete(category.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Gerenciar Subcategorias</CardTitle>
          <Button onClick={handleCreateSubcategory} className="bg-ferplas-500 hover:bg-ferplas-600">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Subcategoria
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Select onValueChange={(value) => setSelectedCategoryForSubcategory(value)}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Selecione a categoria" />
								</SelectTrigger>
								<SelectContent>
									{categories.map((category) => (
										<SelectItem key={category.id} value={category.id}>
											{category.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
              <Input
                type="text"
                placeholder="Nome da subcategoria"
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
              />
              <Textarea
                placeholder="Descrição da subcategoria"
                value={newSubcategoryDescription}
                onChange={(e) => setNewSubcategoryDescription(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Subcategorias Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) =>
                category.subcategories?.map((subcategory) => (
                  <TableRow key={subcategory.id}>
                    <TableCell className="font-medium">
                      {editingSubcategory?.id === subcategory.id ? (
                        <Input
                          type="text"
                          value={editedSubcategoryName}
                          onChange={(e) => setEditedSubcategoryName(e.target.value)}
                        />
                      ) : (
                        subcategory.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingSubcategory?.id === subcategory.id ? (
                        <Textarea
                          value={editedSubcategoryDescription}
                          onChange={(e) => setEditedSubcategoryDescription(e.target.value)}
                        />
                      ) : (
                        subcategory.description
                      )}
                    </TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell className="text-right">
                      {editingSubcategory?.id === subcategory.id ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={handleUpdateSubcategory}>
                            <Check className="mr-2 h-4 w-4" />
                            Salvar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelEditingSubcategory}>
                            <X className="mr-2 h-4 w-4" />
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleStartEditingSubcategory(subcategory)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoryManagement;
