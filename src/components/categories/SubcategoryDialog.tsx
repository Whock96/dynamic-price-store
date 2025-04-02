
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category } from '@/types/types';

interface SubcategoryFormData {
  id: string;
  name: string;
  description: string;
  categoryId: string;
}

interface SubcategoryDialogProps {
  isOpen: boolean;
  isEdit: boolean;
  formData: SubcategoryFormData;
  categories: Category[];
  selectedCategoryId?: string;
  onClose: () => void;
  onSave: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const SubcategoryDialog: React.FC<SubcategoryDialogProps> = ({ 
  isOpen,
  isEdit, 
  formData,
  categories,
  selectedCategoryId,
  onClose, 
  onSave, 
  onInputChange 
}) => {
  // Handle category selection from the dropdown
  const handleCategorySelect = (value: string) => {
    const event = {
      target: {
        name: 'categoryId',
        value
      }
    } as React.ChangeEvent<HTMLSelectElement>;
    
    onInputChange(event);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Subcategoria' : 'Nova Subcategoria'}</DialogTitle>
          <DialogDescription>
            Preencha os dados para a subcategoria.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="categoryId">Categoria*</Label>
            <Select 
              value={formData.categoryId} 
              onValueChange={handleCategorySelect}
              disabled={isEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="name">Nome da Subcategoria*</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={onInputChange}
              placeholder="Ex: Ferramentas Manuais"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={onInputChange}
              placeholder="Descreva a subcategoria brevemente..."
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={onSave} 
            className="bg-ferplas-500 hover:bg-ferplas-600"
          >
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? 'Salvar Alterações' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubcategoryDialog;
