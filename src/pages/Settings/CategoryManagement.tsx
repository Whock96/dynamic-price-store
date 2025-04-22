import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Category, Subcategory } from '@/types/types';
import { useCategories } from '@/hooks/use-categories';
import CategoryList from '@/components/categories/CategoryList';
import CategoryDialog from '@/components/categories/CategoryDialog';
import SubcategoryDialog from '@/components/categories/SubcategoryDialog';

export enum DialogType {
  NONE = 'NONE',
  ADD_CATEGORY = 'ADD_CATEGORY',
  EDIT_CATEGORY = 'EDIT_CATEGORY',
  ADD_SUBCATEGORY = 'ADD_SUBCATEGORY',
  EDIT_SUBCATEGORY = 'EDIT_SUBCATEGORY',
}

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
  } = useCategories();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [activeDialog, setActiveDialog] = useState<DialogType>(DialogType.NONE);
  
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

  useEffect(() => {
    // Added additional logging to debug permissions
    console.log("CategoryManagement - User:", user);
    
    // Verify the user type directly to ensure administrators always have access
    const isAdmin = user && isAdministrador(user.userTypeId);
    console.log("CategoryManagement - User is administrator:", isAdmin);
    
    if (!isAdmin) {
      toast.error('Você não tem permissão para acessar esta página');
      navigate('/dashboard');
      return;
    }
    
    // Only fetch categories once when component mounts
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Dialog open handlers
  const openAddCategoryDialog = () => {
    setCategoryFormData({
      id: '',
      name: '',
      description: '',
    });
    setActiveDialog(DialogType.ADD_CATEGORY);
  };

  const openEditCategoryDialog = (category: Category) => {
    setSelectedCategory(category);
    setCategoryFormData({
      id: category.id,
      name: category.name,
      description: category.description || '',
    });
    setActiveDialog(DialogType.EDIT_CATEGORY);
  };

  const openAddSubcategoryDialog = (category: Category) => {
    setSelectedCategory(category);
    setSubcategoryFormData({
      id: '',
      name: '',
      description: '',
      categoryId: category.id, // Pre-select the category
    });
    setActiveDialog(DialogType.ADD_SUBCATEGORY);
  };

  const openEditSubcategoryDialog = (category: Category, subcategory: Subcategory) => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setSubcategoryFormData({
      id: subcategory.id,
      name: subcategory.name,
      description: subcategory.description || '',
      categoryId: subcategory.categoryId,
    });
    setActiveDialog(DialogType.EDIT_SUBCATEGORY);
  };

  // Dialog close handler
  const closeDialog = () => {
    setActiveDialog(DialogType.NONE);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  // Form input change handlers
  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCategoryFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubcategoryInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSubcategoryFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save handlers
  const handleSaveCategory = async () => {
    if (!categoryFormData.name) {
      toast.error('O nome da categoria é obrigatório');
      return;
    }

    try {
      if (activeDialog === DialogType.EDIT_CATEGORY && categoryFormData.id) {
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
      
      closeDialog();
    } catch (error) {
      console.error('Failed to save category:', error);
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleSaveSubcategory = async () => {
    if (!subcategoryFormData.name) {
      toast.error('O nome da subcategoria é obrigatório');
      return;
    }

    if (!subcategoryFormData.categoryId) {
      toast.error('Selecione uma categoria');
      return;
    }

    try {
      if (activeDialog === DialogType.EDIT_SUBCATEGORY && subcategoryFormData.id) {
        await updateSubcategory({
          id: subcategoryFormData.id,
          name: subcategoryFormData.name,
          description: subcategoryFormData.description,
          categoryId: subcategoryFormData.categoryId
        });
      } else {
        const newSubcategory = await addSubcategory(
          subcategoryFormData.categoryId, 
          {
            name: subcategoryFormData.name,
            description: subcategoryFormData.description
          }
        );
        
        if (newSubcategory) {
          setExpandedCategories(prev => 
            prev.includes(subcategoryFormData.categoryId) 
              ? prev 
              : [...prev, subcategoryFormData.categoryId]
          );
        }
      }
      
      closeDialog();
    } catch (error) {
      console.error('Failed to save subcategory:', error);
      toast.error('Erro ao salvar subcategoria');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
      // Remove from expanded list if it exists
      setExpandedCategories(prev => prev.filter(id => id !== categoryId));
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erro ao remover categoria');
    }
  };

  const handleDeleteSubcategory = async (categoryId: string, subcategoryId: string) => {
    try {
      await deleteSubcategory(categoryId, subcategoryId);
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      toast.error('Erro ao remover subcategoria');
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
        <div className="flex space-x-2">
          <Button 
            className="bg-ferplas-500 hover:bg-ferplas-600"
            onClick={openAddCategoryDialog}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Categoria
          </Button>
        </div>
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
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-ferplas-500 mb-4" />
            <p className="text-gray-500">Carregando categorias...</p>
          </CardContent>
        </Card>
      ) : (
        <CategoryList 
          categories={filteredCategories}
          expandedCategories={expandedCategories}
          onToggleExpansion={toggleCategoryExpansion}
          onEditCategory={openEditCategoryDialog}
          onDeleteCategory={handleDeleteCategory}
          onAddSubcategory={openAddSubcategoryDialog}
          onEditSubcategory={openEditSubcategoryDialog}
          onDeleteSubcategory={handleDeleteSubcategory}
        />
      )}

      {/* Category Dialog */}
      {(activeDialog === DialogType.ADD_CATEGORY || activeDialog === DialogType.EDIT_CATEGORY) && (
        <CategoryDialog 
          isOpen={true}
          isEdit={activeDialog === DialogType.EDIT_CATEGORY}
          formData={categoryFormData}
          onClose={closeDialog}
          onSave={handleSaveCategory}
          onInputChange={handleCategoryInputChange}
        />
      )}

      {/* Subcategory Dialog */}
      {(activeDialog === DialogType.ADD_SUBCATEGORY || activeDialog === DialogType.EDIT_SUBCATEGORY) && (
        <SubcategoryDialog 
          isOpen={true}
          isEdit={activeDialog === DialogType.EDIT_SUBCATEGORY}
          formData={subcategoryFormData}
          categories={categories}
          onClose={closeDialog}
          onSave={handleSaveSubcategory}
          onInputChange={handleSubcategoryInputChange}
        />
      )}
    </div>
  );
};

export default CategoryManagement;
