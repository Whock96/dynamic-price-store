
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExtendedProduct } from '@/hooks/use-product-management';

interface ProductDialogProps {
  isOpen: boolean;
  isEdit: boolean;
  formData: ExtendedProduct;
  onClose: () => void;
  onSave: () => Promise<void>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const ProductDialog: React.FC<ProductDialogProps> = ({
  isOpen,
  isEdit,
  formData,
  onClose,
  onSave,
  onInputChange,
}) => {
  const dialogTitle = isEdit ? 'Editar Produto' : 'Novo Produto';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={onInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sku" className="text-right">
                SKU
              </Label>
              <Input
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={onInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={onInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Preço
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={formData.price}
                onChange={onInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cost" className="text-right">
                Custo
              </Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                value={formData.cost}
                onChange={onInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock" className="text-right">
                Estoque
              </Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                value={formData.stock}
                onChange={onInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoryId" className="text-right">
                Categoria
              </Label>
              <Input
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={onInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subcategoryId" className="text-right">
                Subcategoria
              </Label>
              <Input
                id="subcategoryId"
                name="subcategoryId"
                value={formData.subcategoryId}
                onChange={onInputChange}
                className="col-span-3"
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDialog;
