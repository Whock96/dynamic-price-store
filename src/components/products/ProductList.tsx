
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { ExtendedProduct } from '@/hooks/use-product-management';

interface ProductListProps {
  products: ExtendedProduct[];
  onEditProduct: (product: ExtendedProduct) => void;
  onDeleteProduct: (productId: string) => void;
}

const ProductList: React.FC<ProductListProps> = ({ 
  products, 
  onEditProduct, 
  onDeleteProduct 
}) => {
  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-500">Nenhum produto encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-3 py-3">Nome</th>
                <th className="px-3 py-3">SKU</th>
                <th className="px-3 py-3">Preço</th>
                <th className="px-3 py-3">Estoque</th>
                <th className="px-3 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 max-w-xs">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    {product.description && (
                      <div className="text-xs text-gray-500 truncate">{product.description}</div>
                    )}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">{product.sku}</td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    }).format(product.price)}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">{product.stock}</td>
                  <td className="px-3 py-4 text-right">
                    <div className="flex justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditProduct(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductList;
