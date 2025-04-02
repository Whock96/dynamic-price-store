
import React from 'react';
import { Card } from '@/components/ui/card';
import { Category, Subcategory } from '@/types/types';
import CategoryItem from './CategoryItem';

interface CategoryListProps {
  categories: Category[];
  expandedCategories: string[];
  onToggleExpansion: (categoryId: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddSubcategory: (category: Category) => void;
  onEditSubcategory: (category: Category, subcategory: Subcategory) => void;
  onDeleteSubcategory: (categoryId: string, subcategoryId: string) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  expandedCategories,
  onToggleExpansion,
  onEditCategory,
  onDeleteCategory,
  onAddSubcategory,
  onEditSubcategory,
  onDeleteSubcategory
}) => {
  if (categories.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-gray-300 text-6xl mb-4">
            <i className="far fa-folder-open"></i>
          </div>
          <h2 className="text-xl font-medium text-gray-600">Nenhuma categoria encontrada</h2>
          <p className="text-gray-500 mt-1">Adicione uma nova categoria para começar.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map(category => (
        <Card key={category.id} className="overflow-hidden">
          <CategoryItem 
            category={category}
            isExpanded={expandedCategories.includes(category.id)}
            onToggleExpansion={onToggleExpansion}
            onEditCategory={onEditCategory}
            onDeleteCategory={onDeleteCategory}
            onAddSubcategory={onAddSubcategory}
            onEditSubcategory={onEditSubcategory}
            onDeleteSubcategory={onDeleteSubcategory}
          />
        </Card>
      ))}
    </div>
  );
};

export default CategoryList;
