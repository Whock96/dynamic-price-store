
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Category, Subcategory } from '@/types/types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching categories...');
      
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('subcategories')
        .select('*')
        .order('name');

      if (subcategoriesError) throw subcategoriesError;

      console.log('Categories fetched:', categoriesData?.length || 0);
      console.log('Subcategories fetched:', subcategoriesData?.length || 0);

      const formattedCategories: Category[] = (categoriesData || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description || '',
        subcategories: (subcategoriesData || [])
          .filter(sub => sub.category_id === cat.id)
          .map(sub => ({
            id: sub.id,
            name: sub.name,
            description: sub.description || '',
            categoryId: sub.category_id
          }))
      }));

      setCategories(formattedCategories);
      return formattedCategories;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error fetching categories:', error);
      toast.error(`Erro ao carregar categorias: ${error.message}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCategory = async (categoryData: Omit<Category, 'subcategories' | 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: categoryData.name,
          description: categoryData.description
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newCategory: Category = {
          id: data[0].id,
          name: data[0].name,
          description: data[0].description || '',
          subcategories: []
        };

        setCategories(prev => [...prev, newCategory]);
        toast.success(`Categoria "${categoryData.name}" adicionada com sucesso`);
        return newCategory;
      }
      return null;
    } catch (err) {
      const error = err as Error;
      console.error('Error adding category:', error);
      toast.error(`Erro ao adicionar categoria: ${error.message}`);
      return null;
    }
  };

  const updateCategory = async (categoryData: Pick<Category, 'id' | 'name' | 'description'>) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: categoryData.name,
          description: categoryData.description
        })
        .eq('id', categoryData.id);

      if (error) throw error;

      setCategories(prev => prev.map(cat => 
        cat.id === categoryData.id 
          ? { ...cat, name: categoryData.name, description: categoryData.description } 
          : cat
      ));
      
      toast.success(`Categoria "${categoryData.name}" atualizada com sucesso`);
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Error updating category:', error);
      toast.error(`Erro ao atualizar categoria: ${error.message}`);
      return false;
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      // First delete all subcategories
      const { error: subcategoryError } = await supabase
        .from('subcategories')
        .delete()
        .eq('category_id', categoryId);

      if (subcategoryError) throw subcategoryError;

      // Then delete the category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      toast.success('Categoria removida com sucesso');
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Error deleting category:', error);
      toast.error(`Erro ao remover categoria: ${error.message}`);
      return false;
    }
  };

  const addSubcategory = async (categoryId: string, subcategoryData: Omit<Subcategory, 'categoryId' | 'id'>) => {
    try {
      console.log('Adding subcategory to category:', categoryId);
      
      // Check if category exists
      const categoryExists = categories.some(cat => cat.id === categoryId);
      if (!categoryExists) {
        toast.error('Categoria não encontrada');
        return null;
      }

      // Insert subcategory into the database
      const { data, error } = await supabase
        .from('subcategories')
        .insert({
          name: subcategoryData.name,
          description: subcategoryData.description,
          category_id: categoryId
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newSubcategory: Subcategory = {
          id: data[0].id,
          name: data[0].name,
          description: data[0].description || '',
          categoryId: data[0].category_id
        };
        
        // Update our state
        setCategories(prev => {
          return prev.map(cat => {
            if (cat.id === categoryId) {
              return {
                ...cat,
                subcategories: [...cat.subcategories, newSubcategory]
              };
            }
            return cat;
          });
        });
        
        toast.success(`Subcategoria "${subcategoryData.name}" adicionada com sucesso`);
        return newSubcategory;
      }
      return null;
    } catch (err) {
      const error = err as Error;
      console.error('Error adding subcategory:', error);
      toast.error(`Erro ao adicionar subcategoria: ${error.message}`);
      return null;
    }
  };

  const updateSubcategory = async (subcategoryData: Subcategory) => {
    try {
      const { error } = await supabase
        .from('subcategories')
        .update({
          name: subcategoryData.name,
          description: subcategoryData.description
        })
        .eq('id', subcategoryData.id);

      if (error) throw error;

      setCategories(prev => prev.map(cat => 
        cat.id === subcategoryData.categoryId
          ? { 
              ...cat, 
              subcategories: cat.subcategories.map(sub => 
                sub.id === subcategoryData.id
                  ? { ...sub, name: subcategoryData.name, description: subcategoryData.description }
                  : sub
              )
            }
          : cat
      ));
      
      toast.success(`Subcategoria "${subcategoryData.name}" atualizada com sucesso`);
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Error updating subcategory:', error);
      toast.error(`Erro ao atualizar subcategoria: ${error.message}`);
      return false;
    }
  };

  const deleteSubcategory = async (categoryId: string, subcategoryId: string) => {
    try {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', subcategoryId);

      if (error) throw error;

      setCategories(prev => prev.map(cat => 
        cat.id === categoryId
          ? { 
              ...cat, 
              subcategories: cat.subcategories.filter(sub => sub.id !== subcategoryId)
            }
          : cat
      ));
      
      toast.success('Subcategoria removida com sucesso');
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Error deleting subcategory:', error);
      toast.error(`Erro ao remover subcategoria: ${error.message}`);
      return false;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory
  };
}
