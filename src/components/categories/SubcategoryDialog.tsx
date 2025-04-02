
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface SubcategoryFormData {
  id: string;
  name: string;
  description: string;
  categoryId: string;
}

interface SubcategoryDialogProps {
  isEdit: boolean;
  formData: SubcategoryFormData;
  categoryName: string;
  onClose: () => void;
  onSave: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const SubcategoryDialog: React.FC<SubcategoryDialogProps> = ({ 
  isEdit, 
  formData, 
  categoryName, 
  onClose, 
  onSave, 
  onInputChange 
}) => {
  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Editar Subcategoria' : 'Nova Subcategoria'}</DialogTitle>
        <DialogDescription>
          Preencha os dados para a subcategoria em "{categoryName}".
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <div>
          <Label htmlFor="categoryName">Categoria</Label>
          <Input
            id="categoryName"
            value={categoryName}
            disabled
            className="bg-gray-50"
          />
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
  );
};

export default SubcategoryDialog;
