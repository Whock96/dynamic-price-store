
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Category, Subcategory } from '@/types/types';
import { useCategoryManagement } from '@/hooks/use-category-management';
import CategoryItem from '@/components/categories/CategoryItem';
import CategoryDialog from '@/components/categories/CategoryDialog';
import SubcategoryDialog from '@/components/categories/SubcategoryDialog';

type DialogMode = 'category-add' | 'category-edit' | 'subcategory-add' | 'subcategory-edit';

const CategoryManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    categories, 
    isLoading, 
    fetchCategories,
    addCategory, 
    updateCategory, 
    deleteCategory, 
    addSubcategory, 
    updateSubcategory, 
    deleteSubcategory 
  } = useCategoryManagement();
  
  const [searchQuery, setSearchQuery] = useState('');
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

  // Run only once when component mounts
  useEffect(() => {
    if (user?.role !== 'administrator') {
      toast.error('Você não tem permissão para acessar esta página');
      navigate('/dashboard');
      return;
    }
    
    // Only fetch categories once when component mounts
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const filteredCategories = categories.filter(category => {
    const categoryMatches = 
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const hasMatchingSubcategories = category.subcategories.some(subcategory =>
      subcategory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (subcategory.description && subcategory.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
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
        description: category.description || '',
      });
    } else {
      setDialogMode('category-add');
      setSelectedCategory(null);
      setCategoryFormData({
        id: '',
        name: '',
        description: '',
      });
    }
    
    setIsDialogOpen(true);
  };

  const handleOpenSubcategoryDialog = (category: Category, subcategory?: Subcategory) => {
    console.log('handleOpenSubcategoryDialog chamado para categoria:', category.name);
    
    if (subcategory) {
      setDialogMode('subcategory-edit');
      setSelectedCategory(category);
      setSelectedSubcategory(subcategory);
      setSubcategoryFormData({
        id: subcategory.id,
        name: subcategory.name,
        description: subcategory.description || '',
        categoryId: subcategory.categoryId,
      });
    } else {
      setDialogMode('subcategory-add');
      setSelectedCategory(category);
      setSelectedSubcategory(null);
      setSubcategoryFormData({
        id: '',
        name: '',
        description: '',
        categoryId: category.id,
      });
    }
    
    console.log('DialogMode definido para:', dialogMode === 'subcategory-add' ? 'subcategory-add' : dialogMode);
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

  const handleSaveCategory = async () => {
    if (!categoryFormData.name) {
      toast.error('O nome da categoria é obrigatório');
      return;
    }

    try {
      if (dialogMode === 'category-edit' && categoryFormData.id) {
        await updateCategory({
          id: categoryFormData.id,
          name: categoryFormData.name,
          description: categoryFormData.description
        });
      } else {
        const newCategory = await addCategory({
          name: categoryFormData.name,
          description: categoryFormData.description
        });
        
        if (newCategory) {
          // Automatically expand the new category
          setExpandedCategories(prev => [...prev, newCategory.id]);
        }
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save category:', error);
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleSaveSubcategory = async () => {
    console.log('Salvando subcategoria:', subcategoryFormData);
    
    if (!subcategoryFormData.name) {
      toast.error('O nome da subcategoria é obrigatório');
      return;
    }

    if (!selectedCategory) {
      toast.error('Nenhuma categoria selecionada');
      return;
    }

    try {
      if (dialogMode === 'subcategory-edit' && subcategoryFormData.id) {
        await updateSubcategory({
          id: subcategoryFormData.id,
          name: subcategoryFormData.name,
          description: subcategoryFormData.description,
          categoryId: selectedCategory.id
        });
      } else {
        console.log('Adicionando subcategoria à categoria:', selectedCategory.id);
        const newSubcategory = await addSubcategory(
          selectedCategory.id, 
          {
            name: subcategoryFormData.name,
            description: subcategoryFormData.description
          }
        );
        
        if (newSubcategory && !expandedCategories.includes(selectedCategory.id)) {
          setExpandedCategories(prev => [...prev, selectedCategory.id]);
        }
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save subcategory:', error);
      toast.error('Erro ao salvar subcategoria');
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
        {isLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-ferplas-500 mb-4" />
              <p className="text-gray-500">Carregando categorias...</p>
            </CardContent>
          </Card>
        ) : filteredCategories.length > 0 ? (
          filteredCategories.map(category => (
            <Card key={category.id} className="overflow-hidden">
              <CategoryItem 
                category={category}
                isExpanded={expandedCategories.includes(category.id)}
                onToggleExpansion={toggleCategoryExpansion}
                onEditCategory={(category) => handleOpenCategoryDialog('edit', category)}
                onDeleteCategory={deleteCategory}
                onAddSubcategory={handleOpenSubcategoryDialog}
                onEditSubcategory={(category, subcategory) => handleOpenSubcategoryDialog(category, subcategory)}
                onDeleteSubcategory={deleteSubcategory}
              />
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-gray-300 text-6xl mb-4">
                <i className="far fa-folder-open"></i>
              </div>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {dialogMode.includes('category') ? (
          <CategoryDialog 
            isEdit={dialogMode === 'category-edit'}
            formData={categoryFormData}
            onClose={handleCloseDialog}
            onSave={handleSaveCategory}
            onInputChange={(e) => handleInputChange(e, setCategoryFormData)}
          />
        ) : (
          <SubcategoryDialog 
            isEdit={dialogMode === 'subcategory-edit'}
            formData={subcategoryFormData}
            categoryName={selectedCategory?.name || ''}
            onClose={handleCloseDialog}
            onSave={handleSaveSubcategory}
            onInputChange={(e) => handleInputChange(e, setSubcategoryFormData)}
          />
        )}
      </Dialog>
    </div>
  );
};

export default CategoryManagement;
