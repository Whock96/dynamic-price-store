
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Product } from '@/types/types';
import { useProductManagement } from '@/hooks/use-product-management';
import ProductList from '@/components/products/ProductList';
import ProductDialog from '@/components/products/ProductDialog';

export enum DialogType {
  NONE = 'NONE',
  ADD_PRODUCT = 'ADD_PRODUCT',
  EDIT_PRODUCT = 'EDIT_PRODUCT',
}

const ProductManagement = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { 
    products, 
    isLoading, 
    fetchProducts,
    addProduct, 
    updateProduct, 
    deleteProduct 
  } = useProductManagement();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDialog, setActiveDialog] = useState<DialogType>(DialogType.NONE);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [productFormData, setProductFormData] = useState({
    id: '',
    name: '',
    description: '',
    sku: '',
    price: 0,
    cost: 0,
    stock: 0,
    categoryId: '',
    subcategoryId: '',
    isActive: true
  });

  useEffect(() => {
    // Added additional logging to debug permissions
    console.log("ProductManagement - User:", user);
    console.log("ProductManagement - Has products_manage permission:", hasPermission('products_manage'));
    
    if (!hasPermission('products_manage')) {
      toast.error('Você não tem permissão para acessar esta página');
      navigate('/dashboard');
      return;
    }
    
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProducts = products.filter(product => {
    return (
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const openAddProductDialog = () => {
    setProductFormData({
      id: '',
      name: '',
      description: '',
      sku: '',
      price: 0,
      cost: 0,
      stock: 0,
      categoryId: '',
      subcategoryId: '',
      isActive: true
    });
    setActiveDialog(DialogType.ADD_PRODUCT);
  };

  const openEditProductDialog = (product: Product) => {
    setSelectedProduct(product);
    setProductFormData({
      id: product.id,
      name: product.name,
      description: product.description || '',
      sku: product.sku,
      price: product.price,
      cost: product.cost || 0,
      stock: product.stock || 0,
      categoryId: product.categoryId || '',
      subcategoryId: product.subcategoryId || '',
      isActive: product.isActive
    });
    setActiveDialog(DialogType.EDIT_PRODUCT);
  };

  const closeDialog = () => {
    setActiveDialog(DialogType.NONE);
    setSelectedProduct(null);
  };

  const handleProductInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle different input types
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setProductFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'number') {
      setProductFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setProductFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSaveProduct = async () => {
    if (!productFormData.name || !productFormData.sku) {
      toast.error('Nome e SKU são obrigatórios');
      return;
    }

    try {
      if (activeDialog === DialogType.EDIT_PRODUCT && productFormData.id) {
        await updateProduct({
          ...productFormData,
          price: Number(productFormData.price),
          cost: Number(productFormData.cost),
          stock: Number(productFormData.stock)
        });
      } else {
        await addProduct({
          ...productFormData,
          price: Number(productFormData.price),
          cost: Number(productFormData.cost),
          stock: Number(productFormData.stock)
        });
      }
      
      closeDialog();
    } catch (error) {
      console.error('Failed to save product:', error);
      toast.error('Erro ao salvar produto');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erro ao remover produto');
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
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Produtos</h1>
            <p className="text-muted-foreground">
              Cadastre, edite e gerencie seus produtos
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            className="bg-ferplas-500 hover:bg-ferplas-600"
            onClick={openAddProductDialog}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
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
              placeholder="Buscar produtos por nome, SKU ou descrição..."
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
            <p className="text-gray-500">Carregando produtos...</p>
          </CardContent>
        </Card>
      ) : (
        <ProductList 
          products={filteredProducts}
          onEditProduct={openEditProductDialog}
          onDeleteProduct={handleDeleteProduct}
        />
      )}

      {(activeDialog === DialogType.ADD_PRODUCT || activeDialog === DialogType.EDIT_PRODUCT) && (
        <ProductDialog 
          isOpen={true}
          isEdit={activeDialog === DialogType.EDIT_PRODUCT}
          formData={productFormData}
          onClose={closeDialog}
          onSave={handleSaveProduct}
          onInputChange={handleProductInputChange}
        />
      )}
    </div>
  );
};

export default ProductManagement;
