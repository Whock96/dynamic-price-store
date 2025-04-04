import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Tag, Tags, Search, Plus, Edit, Trash2, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useAuth } from '@/context/AuthContext';
import { useSupabaseData } from '@/hooks/use-supabase-data';
import { Category } from '@/types/types';

const CategoryManagement = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { 
    data: categories,
    isLoading,
    createRecord: createCategory,
    updateRecord: updateCategory,
    deleteRecord: deleteCategory
  } = useSupabaseData<Category>('categories', { orderBy: { column: 'name', ascending: true } });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (!hasPermission('settings.categories')) {
      navigate('/dashboard');
    }
  }, [hasPermission, navigate]);

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setIsEditMode(true);
      setSelectedCategoryId(category.id);
      setFormData({
        name: category.name,
        description: category.description || '',
      });
    } else {
      setIsEditMode(false);
      setSelectedCategoryId(null);
      setFormData({
        name: '',
        description: '',
      });
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

  const handleSaveCategory = async () => {
    if (!formData.name) {
      return;
    }

    let success;
    if (isEditMode && selectedCategoryId) {
      success = await updateCategory(selectedCategoryId, formData);
    } else {
      const categoryData = {
        name: formData.name,
        description: formData.description || '',
        subcategories: []
      };
      success = await createCategory(categoryData);
    }

    if (success) {
      setIsDialogOpen(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
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
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Categorias</h1>
            <p className="text-muted-foreground">
              Adicione, edite e gerencie categorias de produtos
            </p>
          </div>
        </div>
        <Button 
          className="bg-ferplas-500 hover:bg-ferplas-600 button-transition"
          onClick={() => handleOpenDialog()}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
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
              placeholder="Buscar categorias por nome ou descrição..."
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
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-ferplas-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-2 text-sm text-gray-500">Carregando categorias...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <Tags className="h-12 w-12 text-gray-300" />
                      <p className="mt-2 text-lg font-medium text-gray-500">Nenhuma categoria encontrada</p>
                      <p className="text-sm text-gray-400">Tente ajustar seus filtros ou adicione uma nova categoria</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map(category => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 px-2 text-amber-600"
                        onClick={() => handleOpenDialog(category)}
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
                            <AlertDialogTitle>Remover categoria?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação irá remover permanentemente a categoria "{category.name}" do sistema.
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleDeleteCategory(category.id)}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Atualize as informações da categoria abaixo.' 
                : 'Preencha os dados para adicionar uma nova categoria ao sistema.'}
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
                placeholder="Ex: Matéria Prima"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descreva a categoria"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCategory} className="bg-ferplas-500 hover:bg-ferplas-600">
              {isEditMode ? 'Salvar Alterações' : 'Adicionar Categoria'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryManagement;
