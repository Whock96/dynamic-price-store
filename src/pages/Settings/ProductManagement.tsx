import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Search, Plus, Edit, Trash2, ArrowLeft, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
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
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useSupabaseData } from '@/hooks/use-supabase-data';
import { Tables } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/formatters';

type Product = Tables<'products'>;
type Category = Tables<'categories'>;
type Subcategory = Tables<'subcategories'>;

type ProductFormData = {
  id?: string;
  name: string;
  description: string | null;
  list_price: number;
  weight: number;
  quantity: number;
  quantity_per_volume: number;
  width: number;
  height: number;
  length: number;
  cubic_volume: number;
  category_id: string | null;
  subcategory_id: string | null;
  image_url: string | null;
};

const ProductManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [availableSubcategories, setAvailableSubcategories] = useState<Subcategory[]>([]);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    list_price: 0,
    weight: 0,
    quantity: 0,
    quantity_per_volume: 1,
    width: 0,
    height: 0,
    length: 0,
    cubic_volume: 0,
    category_id: null,
    subcategory_id: null,
    image_url: 'https://via.placeholder.com/150',
  });

  const { 
    data: products, 
    isLoading: productsLoading, 
    error: productsError,
    fetchData: refetchProducts,
    createRecord: createProduct,
    updateRecord: updateProduct,
    deleteRecord: deleteProduct
  } = useSupabaseData<Product>('products');

  const { 
    data: categories, 
    isLoading: categoriesLoading,
    error: categoriesError
  } = useSupabaseData<Category>('categories');

  const { 
    data: subcategories, 
    isLoading: subcategoriesLoading,
    error: subcategoriesError
  } = useSupabaseData<Subcategory>('subcategories');

  useEffect(() => {
    if (user?.role !== 'administrator') {
      toast.error('Você não tem permissão para acessar esta página');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (productsError) toast.error(`Erro ao carregar produtos: ${productsError.message}`);
    if (categoriesError) toast.error(`Erro ao carregar categorias: ${categoriesError.message}`);
    if (subcategoriesError) toast.error(`Erro ao carregar subcategorias: ${subcategoriesError.message}`);
  }, [productsError, categoriesError, subcategoriesError]);

  useEffect(() => {
    if (formData.category_id) {
      const filtered = subcategories.filter(sub => sub.category_id === formData.category_id);
      setAvailableSubcategories(filtered);
      
      if (!filtered.some(sub => sub.id === formData.subcategory_id)) {
        setFormData(prev => ({
          ...prev,
          subcategory_id: filtered[0]?.id || null
        }));
      }
    } else {
      setAvailableSubcategories([]);
      setFormData(prev => ({...prev, subcategory_id: null}));
    }
  }, [formData.category_id, subcategories]);

  const filteredProducts = products.filter(product => {
    const nameMatch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const descriptionMatch = product.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const matchesSearch = nameMatch || descriptionMatch;
    
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Sem categoria';
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Sem categoria';
  };

  const getSubcategoryName = (subcategoryId: string | null) => {
    if (!subcategoryId) return 'Sem subcategoria';
    const subcategory = subcategories.find(sub => sub.id === subcategoryId);
    return subcategory ? subcategory.name : 'Sem subcategoria';
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setIsEditMode(true);
      setFormData({
        id: product.id,
        name: product.name,
        description: product.description,
        list_price: product.list_price || 0,
        weight: product.weight || 0,
        quantity: product.quantity || 0,
        quantity_per_volume: product.quantity_per_volume || 1,
        width: product.width || 0,
        height: product.height || 0,
        length: product.length || 0,
        cubic_volume: product.cubic_volume || 0,
        category_id: product.category_id,
        subcategory_id: product.subcategory_id,
        image_url: product.image_url,
      });
    } else {
      setIsEditMode(false);
      setFormData({
        name: '',
        description: '',
        list_price: 0,
        weight: 0,
        quantity: 0,
        quantity_per_volume: 1,
        width: 0,
        height: 0,
        length: 0,
        cubic_volume: 0,
        category_id: categories.length > 0 ? categories[0].id : null,
        subcategory_id: null,
        image_url: 'https://via.placeholder.com/150',
      });
    }
    
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'width' || name === 'height' || name === 'length') {
      const dimensionValue = parseFloat(value) || 0;
      
      const updatedFormData = {
        ...formData,
        [name]: dimensionValue
      };
      
      const newWidth = name === 'width' ? dimensionValue : formData.width;
      const newHeight = name === 'height' ? dimensionValue : formData.height;
      const newLength = name === 'length' ? dimensionValue : formData.length;
      const cubicVolume = (newWidth * newHeight * newLength) / 1000000;
      
      setFormData({
        ...updatedFormData,
        cubic_volume: parseFloat(cubicVolume.toFixed(4))
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'list_price' || name === 'weight' || name === 'quantity' || name === 'quantity_per_volume'
          ? parseFloat(value) || 0 
          : value
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }));
  };

  const handleSaveProduct = async () => {
    if (!formData.name || formData.list_price <= 0) {
      toast.error('Preencha todos os campos obrigatórios: nome e preço');
      return;
    }

    try {
      if (isEditMode && formData.id) {
        const { id, ...updateData } = formData;
        await updateProduct(id, updateData);
        toast.success(`Produto "${formData.name}" atualizado com sucesso`);
      } else {
        await createProduct(formData);
        toast.success(`Produto "${formData.name}" adicionado com sucesso`);
      }
      
      refetchProducts();
      handleCloseDialog();
    } catch (error) {
      toast.error(`Erro ao salvar produto: ${(error as Error).message}`);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId);
      toast.success('Produto removido com sucesso');
      refetchProducts();
    } catch (error) {
      toast.error(`Erro ao remover produto: ${(error as Error).message}`);
    }
  };

  const isLoading = productsLoading || categoriesLoading || subcategoriesLoading;

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
              Adicione, edite e remova produtos do catálogo
            </p>
          </div>
        </div>
        <Button 
          className="bg-ferplas-500 hover:bg-ferplas-600 button-transition"
          onClick={() => handleOpenDialog()}
          disabled={isLoading}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar produtos..."
                className="pl-10 input-transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select 
              value={categoryFilter} 
              onValueChange={setCategoryFilter}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <div className="flex flex-col space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-8 w-full max-w-[800px]" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map(product => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      {getCategoryName(product.category_id)} / {getSubcategoryName(product.subcategory_id)}
                    </TableCell>
                    <TableCell>{formatCurrency(product.list_price || 0)}</TableCell>
                    <TableCell>{product.quantity || 0} un.</TableCell>
                    <TableCell>{product.weight || 0} kg</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 px-2 text-amber-600"
                        onClick={() => handleOpenDialog(product)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 px-2 text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Excluir
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover produto?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação irá remover permanentemente o produto "{product.name}" do sistema. 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {!isLoading && filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-600">Nenhum produto encontrado</h2>
              <p className="text-gray-500 mt-1">Tente ajustar seus filtros ou adicione um novo produto.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl flex flex-col h-[85vh]">
          <DialogHeader className="px-6 py-4">
            <DialogTitle>{isEditMode ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Atualize as informações do produto abaixo.' 
                : 'Preencha os dados para adicionar um novo produto ao catálogo.'}
            </DialogDescription>
          </DialogHeader>
          
          <DialogBody className="flex-1 overflow-y-auto px-6 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4 md:col-span-2">
                <div>
                  <Label htmlFor="name">Nome do Produto*</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ex: Tubo PVC 100mm"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    placeholder="Descreva o produto em detalhes..."
                    rows={3}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="category_id">Categoria</Label>
                <Select 
                  value={formData.category_id || ''} 
                  onValueChange={(value) => handleSelectChange('category_id', value)}
                >
                  <SelectTrigger id="category_id">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="subcategory_id">Subcategoria</Label>
                <Select 
                  value={formData.subcategory_id || ''} 
                  onValueChange={(value) => handleSelectChange('subcategory_id', value)}
                  disabled={!formData.category_id || availableSubcategories.length === 0}
                >
                  <SelectTrigger id="subcategory_id">
                    <SelectValue placeholder="Selecione uma subcategoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem subcategoria</SelectItem>
                    {availableSubcategories.map(subcategory => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="list_price">Preço de Tabela (R$)*</Label>
                <Input
                  id="list_price"
                  name="list_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.list_price}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.weight}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <Label htmlFor="quantity">Quantidade em Estoque</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="quantity_per_volume">Quantidade por Volume</Label>
                <Input
                  id="quantity_per_volume"
                  name="quantity_per_volume"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.quantity_per_volume}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="md:col-span-2">
                <Label>Dimensões (mm)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="width" className="text-xs text-gray-500">Largura</Label>
                    <Input
                      id="width"
                      name="width"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.width}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="height" className="text-xs text-gray-500">Altura</Label>
                    <Input
                      id="height"
                      name="height"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.height}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="length" className="text-xs text-gray-500">Comprimento</Label>
                    <Input
                      id="length"
                      name="length"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.length}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Volume calculado: {formData.cubic_volume} m³
                </p>
              </div>
              
              <div>
                <Label htmlFor="image_url">URL da Imagem</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  value={formData.image_url || ''}
                  onChange={handleInputChange}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
            </div>
          </DialogBody>
          
          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProduct} className="bg-ferplas-500 hover:bg-ferplas-600">
              <Save className="mr-2 h-4 w-4" />
              {isEditMode ? 'Salvar Alterações' : 'Adicionar Produto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;
