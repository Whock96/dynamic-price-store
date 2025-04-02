
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tag, Edit, Trash2, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Category, Subcategory } from '@/types/types';

interface CategoryItemProps {
  category: Category;
  isExpanded: boolean;
  onToggleExpansion: (categoryId: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddSubcategory: (category: Category) => void;
  onEditSubcategory: (category: Category, subcategory: Subcategory) => void;
  onDeleteSubcategory: (categoryId: string, subcategoryId: string) => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  isExpanded,
  onToggleExpansion,
  onEditCategory,
  onDeleteCategory,
  onAddSubcategory,
  onEditSubcategory,
  onDeleteSubcategory,
}) => {
  // Função para lidar com clique no botão de adicionar subcategoria
  const handleAddSubcategoryClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Impedir propagação do evento para o Collapsible
    console.log('Adicionando subcategoria à categoria:', category.name);
    onAddSubcategory(category);
  };

  return (
    <Collapsible 
      open={isExpanded}
      onOpenChange={() => onToggleExpansion(category.id)}
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
              onClick={handleAddSubcategoryClick}
              type="button"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0 text-amber-500"
              onClick={(e) => {
                e.stopPropagation();
                onEditCategory(category);
              }}
              type="button"
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
                  type="button"
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
                    onClick={() => onDeleteCategory(category.id)}
                  >
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {isExpanded ? (
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
              <div 
                key={subcategory.id} 
                className="flex items-center justify-between px-6 py-3 hover:bg-gray-50"
              >
                <div className="pl-8">
                  <h4 className="font-medium">{subcategory.name}</h4>
                  <p className="text-sm text-gray-500">{subcategory.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 text-amber-500"
                    onClick={() => onEditSubcategory(category, subcategory)}
                    type="button"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500"
                        type="button"
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
                          onClick={() => onDeleteSubcategory(category.id, subcategory.id)}
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
            onClick={handleAddSubcategoryClick}
            type="button"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Subcategoria
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default CategoryItem;
