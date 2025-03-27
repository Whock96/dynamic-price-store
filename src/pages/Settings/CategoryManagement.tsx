
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Tag, Search, Plus, Edit, Trash2, ArrowLeft, Save,
  ChevronRight, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Category, Subcategory } from '@/types/types';

// Mock data para categorias e subcategorias
const INITIAL_CATEGORIES: Category[] = [
  { 
    id: '1', 
    name: 'Tubos e Conexões', 
    description: 'Produtos para sistemas hidráulicos e esgoto',
    subcategories: [
      { id: '1-1', name: 'Tubos PVC', description: 'Tubos de PVC para água e esgoto', categoryId: '1' },
      { id: '1-2', name: 'Conexões PVC', description: 'Conexões de PVC para água e esgoto', categoryId: '1' },
    ]
  },
  { 
    id: '2', 
    name: 'Ferramentas', 
    description: 'Ferramentas para construção e reforma',
    subcategories: [
      { id: '2-1', name: 'Manuais', description: 'Ferramentas manuais diversas', categoryId: '2' },
      { id: '2-2', name: 'Elétricas', description: 'Ferramentas elétricas para profissionais', categoryId: '2' },
    ]
  },
  { 
    id: '3', 
    name: 'Hidráulica', 
    description: 'Produtos para sistemas hidráulicos residenciais e industriais',
    subcategories: [
      { id: '3-1', name: 'Válvulas', description: 'Válvulas para controle de fluxo', categoryId: '3' },
      { id: '3-2', name: 'Registros', description: 'Registros para controle de água', categoryId: '3' },
    ]
  },
];

type DialogMode = 'category-add' | 'category-edit' | 'subcategory-add' | 'subcategory-edit';

const CategoryManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>('category-add');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    id: '',
    name: '',
    description: '',
  });
  const [subcategoryFormData, setSubcategoryFormData] = useState({
    id: '',
    name: '',
    description: '',
    categoryId: '',
  });

  // Verificar se o usuário é administrador
  useEffect(() => {
    if (user?.role !== 'administrator') {
      toast.error('Você não tem permissão para acessar esta página');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Filtrar categorias e subcategorias com base na pesquisa
  const filteredCategories = categories.filter(category => {
    const categoryMatches = 
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const hasMatchingSubcategories = category.subcategories.some(subcategory =>
      subcategory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subcategory.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Se a categoria corresponde ou tem subcategorias correspondentes, incluir na filtragem
    return categoryMatches || hasMatchingSubcategories;
  });

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleOpenCategoryDialog = (mode: 'add' | 'edit', category?: Category) => {
    if (mode === 'edit' && category) {
      setDialogMode('category-edit');
      setSelectedCategory(category);
      setCategoryFormData({
        id: category.id,
        name: category.name,
        description: category.description,
      });
    } else {
      setDialogMode('category-add');
      setSelectedCategory(null);
      setCategoryFormData({
        id: `category-${Date.now()}`,
        name: '',
        description: '',
      });
    }
    
    setIsDialogOpen(true);
  };

  const handleOpenSubcategoryDialog = (mode: 'add' | 'edit', category: Category, subcategory?: Subcategory) => {
    if (mode === 'edit' && subcategory) {
      setDialogMode('subcategory-edit');
      setSelectedCategory(category);
      setSelectedSubcategory(subcategory);
      setSubcategoryFormData({
        id: subcategory.id,
        name: subcategory.name,
        description: subcategory.description,
        categoryId: subcategory.categoryId,
      });
    } else {
      setDialogMode('subcategory-add');
      setSelectedCategory(category);
      setSelectedSubcategory(null);
      setSubcategoryFormData({
        id: `subcategory-${Date.now()}`,
        name: '',
        description: '',
        categoryId: category.id,
      });
    }
    
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setFormData: React.Dispatch<React.SetStateAction<any>>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveCategory = () => {
    // Validação básica
    if (!categoryFormData.name) {
      toast.error('O nome da categoria é obrigatório');
      return;
    }

    if (dialogMode === 'category-edit') {
      // Atualizar categoria existente
      setCategories(prev => prev.map(cat => 
        cat.id === categoryFormData.id 
          ? { 
              ...cat, 
              name: categoryFormData.name, 
              description: categoryFormData.description 
            } 
          : cat
      ));
      toast.success(`Categoria "${categoryFormData.name}" atualizada com sucesso`);
    } else {
      // Adicionar nova categoria
      const newCategory: Category = {
        id: categoryFormData.id,
        name: categoryFormData.name,
        description: categoryFormData.description,
        subcategories: []
      };
      
      setCategories(prev => [...prev, newCategory]);
      toast.success(`Categoria "${categoryFormData.name}" adicionada com sucesso`);
    }
    
    handleCloseDialog();
  };

  const handleSaveSubcategory = () => {
    // Validação básica
    if (!subcategoryFormData.name) {
      toast.error('O nome da subcategoria é obrigatório');
      return;
    }

    if (!selectedCategory) {
      toast.error('Nenhuma categoria selecionada');
      return;
    }

    if (dialogMode === 'subcategory-edit') {
      // Atualizar subcategoria existente
      setCategories(prev => prev.map(cat => 
        cat.id === selectedCategory.id 
          ? { 
              ...cat, 
              subcategories: cat.subcategories.map(sub => 
                sub.id === subcategoryFormData.id 
                  ? { 
                      ...sub, 
                      name: subcategoryFormData.name, 
                      description: subcategoryFormData.description 
                    } 
                  : sub
              )
            } 
          : cat
      ));
      toast.success(`Subcategoria "${subcategoryFormData.name}" atualizada com sucesso`);
    } else {
      // Adicionar nova subcategoria
      const newSubcategory: Subcategory = {
        id: subcategoryFormData.id,
        name: subcategoryFormData.name,
        description: subcategoryFormData.description,
        categoryId: selectedCategory.id
      };
      
      setCategories(prev => prev.map(cat => 
        cat.id === selectedCategory.id 
          ? { 
              ...cat, 
              subcategories: [...cat.subcategories, newSubcategory] 
            } 
          : cat
      ));
      
      // Expandir a categoria automaticamente
      if (!expandedCategories.includes(selectedCategory.id)) {
        setExpandedCategories(prev => [...prev, selectedCategory.id]);
      }
      
      toast.success(`Subcategoria "${subcategoryFormData.name}" adicionada com sucesso`);
    }
    
    handleCloseDialog();
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    toast.success('Categoria removida com sucesso');
  };

  const handleDeleteSubcategory = (categoryId: string, subcategoryId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { 
            ...cat, 
            subcategories: cat.subcategories.filter(sub => sub.id !== subcategoryId) 
          } 
        : cat
    ));
    toast.success('Subcategoria removida com sucesso');
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
              Organize seus produtos em categorias e subcategorias
            </p>
          </div>
        </div>
        <Button 
          className="bg-ferplas-500 hover:bg-ferplas-600 button-transition"
          onClick={() => handleOpenCategoryDialog('add')}
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
              placeholder="Buscar categorias e subcategorias..."
              className="pl-10 input-transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredCategories.length > 0 ? (
          filteredCategories.map(category => (
            <Card key={category.id} className="overflow-hidden">
              <Collapsible 
                open={expandedCategories.includes(category.id)}
                onOpenChange={() => toggleCategoryExpansion(category.id)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <Tag className="h-5 w-5 text-ferplas-500" />
                      <div className="text-left">
                        <h3 className="text-lg font-medium">{category.name}</h3>
                        <p className="text-sm text-gray-500">{category.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 text-ferplas-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSubcategoryDialog('add', category);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 text-amber-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCategoryDialog('edit', category);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover categoria?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação irá remover permanentemente a categoria "{category.name}" e todas as suas subcategorias. 
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
                      {expandedCategories.includes(category.id) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-6 py-3 bg-gray-50 border-t">
                    <h4 className="text-sm font-medium text-gray-500">Subcategorias</h4>
                  </div>
                  {category.subcategories.length > 0 ? (
                    <div className="divide-y">
                      {category.subcategories.map(subcategory => (
                        <div key={subcategory.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                          <div className="pl-8">
                            <h4 className="font-medium">{subcategory.name}</h4>
                            <p className="text-sm text-gray-500">{subcategory.description}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 text-amber-500"
                              onClick={() => handleOpenSubcategoryDialog('edit', category, subcategory)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover subcategoria?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação irá remover permanentemente a subcategoria "{subcategory.name}". 
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => handleDeleteSubcategory(category.id, subcategory.id)}
                                  >
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-6 text-gray-500">
                      <p>Nenhuma subcategoria encontrada. Adicione uma nova.</p>
                    </div>
                  )}
                  <div className="p-3 bg-gray-50 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full text-ferplas-500"
                      onClick={() => handleOpenSubcategoryDialog('add', category)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Subcategoria
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Tag className="h-12 w-12 text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-600">Nenhuma categoria encontrada</h2>
              <p className="text-gray-500 mt-1">Adicione uma nova categoria para começar.</p>
              <Button 
                className="mt-4 bg-ferplas-500 hover:bg-ferplas-600 button-transition"
                onClick={() => handleOpenCategoryDialog('add')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Categoria
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog para adicionar/editar categoria */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'category-add' && 'Nova Categoria'}
              {dialogMode === 'category-edit' && 'Editar Categoria'}
              {dialogMode === 'subcategory-add' && 'Nova Subcategoria'}
              {dialogMode === 'subcategory-edit' && 'Editar Subcategoria'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode.includes('category') 
                ? 'Preencha os dados para a categoria.' 
                : `Preencha os dados para a subcategoria em "${selectedCategory?.name}".`}
            </DialogDescription>
          </DialogHeader>
          
          {dialogMode.includes('category') ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Categoria*</Label>
                <Input
                  id="name"
                  name="name"
                  value={categoryFormData.name}
                  onChange={(e) => handleInputChange(e, setCategoryFormData)}
                  placeholder="Ex: Ferramentas"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={categoryFormData.description}
                  onChange={(e) => handleInputChange(e, setCategoryFormData)}
                  placeholder="Descreva a categoria brevemente..."
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="categoryName">Categoria</Label>
                <Input
                  id="categoryName"
                  value={selectedCategory?.name || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              
              <div>
                <Label htmlFor="name">Nome da Subcategoria*</Label>
                <Input
                  id="name"
                  name="name"
                  value={subcategoryFormData.name}
                  onChange={(e) => handleInputChange(e, setSubcategoryFormData)}
                  placeholder="Ex: Ferramentas Manuais"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={subcategoryFormData.description}
                  onChange={(e) => handleInputChange(e, setSubcategoryFormData)}
                  placeholder="Descreva a subcategoria brevemente..."
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button 
              onClick={dialogMode.includes('category') ? handleSaveCategory : handleSaveSubcategory} 
              className="bg-ferplas-500 hover:bg-ferplas-600"
            >
              <Save className="mr-2 h-4 w-4" />
              {dialogMode.includes('edit') ? 'Salvar Alterações' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryManagement;
