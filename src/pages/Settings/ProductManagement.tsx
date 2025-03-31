
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
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { Product } from '@/types/types';
import { useProducts } from '@/context/ProductContext';

const ProductManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const { products, setProducts, categories, getCategoryName, getSubcategoryName } = useProducts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    listPrice: 0,
    minPrice: 0,
    weight: 0,
    quantity: 0,
    volume: 0,
    categoryId: '',
    subcategoryId: '',
    imageUrl: 'https://via.placeholder.com/150',
  });
  const [availableSubcategories, setAvailableSubcategories] = useState<{ id: string, name: string }[]>([]);

  // Verificar se o usuário é administrador
  useEffect(() => {
    if (user?.role !== 'administrator') {
      toast.error('Você não tem permissão para acessar esta página');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Filtrar produtos com base na pesquisa e categoria
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Make sure we're using updated subcategories when category changes
  useEffect(() => {
    if (formData.categoryId) {
      const category = categories.find(cat => cat.id === formData.categoryId);
      if (category) {
        setAvailableSubcategories(category.subcategories);
        if (!category.subcategories.some(sub => sub.id === formData.subcategoryId)) {
          // Reset subcategory if current selection is not valid for the new category
          setFormData(prev => ({
            ...prev,
            subcategoryId: category.subcategories[0]?.id || ''
          }));
        }
      }
    } else {
      setAvailableSubcategories([]);
    }
  }, [formData.categoryId, categories]);

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setIsEditMode(true);
      setSelectedProduct(product);
      setFormData({
        id: product.id,
        name: product.name,
        description: product.description,
        listPrice: product.listPrice,
        minPrice: product.minPrice,
        weight: product.weight,
        quantity: product.quantity,
        volume: product.volume,
        categoryId: product.categoryId,
        subcategoryId: product.subcategoryId,
        imageUrl: product.imageUrl,
      });
      
      // Atualizar subcategorias disponíveis
      const category = categories.find(cat => cat.id === product.categoryId);
      if (category) {
        setAvailableSubcategories(category.subcategories);
      }
    } else {
      setIsEditMode(false);
      setSelectedProduct(null);
      setFormData({
        id: `product-${Date.now()}`,
        name: '',
        description: '',
        listPrice: 0,
        minPrice: 0,
        weight: 0,
        quantity: 0,
        volume: 0,
        categoryId: categories[0]?.id || '',
        subcategoryId: categories[0]?.subcategories[0]?.id || '',
        imageUrl: 'https://via.placeholder.com/150',
      });
      
      // Definir subcategorias iniciais
      if (categories.length > 0) {
        setAvailableSubcategories(categories[0].subcategories);
      }
    }
    
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'listPrice' || name === 'minPrice' || name === 'weight' || name === 'quantity' || name === 'volume' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProduct = () => {
    // Validação básica
    if (!formData.name || !formData.description || formData.listPrice <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Ensure proper number values
    const processedData = {
      ...formData,
      listPrice: Number(formData.listPrice),
      minPrice: Number(formData.minPrice),
      weight: Number(formData.weight),
      quantity: Number(formData.quantity),
      volume: Number(formData.volume)
    };

    if (isEditMode) {
      // Atualizar produto existente
      setProducts(prev => prev.map(p => p.id === processedData.id ? {
        ...p,
        ...processedData,
        updatedAt: new Date()
      } as Product : p));
      toast.success(`Produto "${processedData.name}" atualizado com sucesso`);
    } else {
      // Adicionar novo produto
      const newProduct: Product = {
        ...processedData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Product;
      
      setProducts(prev => [...prev, newProduct]);
      toast.success(`Produto "${processedData.name}" adicionado com sucesso`);
    }
    
    handleCloseDialog();
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    toast.success('Produto removido com sucesso');
  };

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
              Adicione, edite e remova produtos do catálogo
            </p>
          </div>
        </div>
        <Button 
          className="bg-ferplas-500 hover:bg-ferplas-600 button-transition"
          onClick={() => handleOpenDialog()}
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Preço Mínimo</TableHead>
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
                    {getCategoryName(product.categoryId)} / {getSubcategoryName(product.categoryId, product.subcategoryId)}
                  </TableCell>
                  <TableCell>{formatCurrency(product.listPrice)}</TableCell>
                  <TableCell>{formatCurrency(product.minPrice)}</TableCell>
                  <TableCell>{product.quantity} un.</TableCell>
                  <TableCell>{product.weight} kg</TableCell>
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
          
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-600">Nenhum produto encontrado</h2>
              <p className="text-gray-500 mt-1">Tente ajustar seus filtros ou adicione um novo produto.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para adicionar/editar produto */}
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
                  <Label htmlFor="description">Descrição*</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Descreva o produto em detalhes..."
                    rows={3}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="categoryId">Categoria*</Label>
                <Select 
                  value={formData.categoryId} 
                  onValueChange={(value) => handleSelectChange('categoryId', value)}
                >
                  <SelectTrigger id="categoryId">
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
                <Label htmlFor="subcategoryId">Subcategoria*</Label>
                <Select 
                  value={formData.subcategoryId} 
                  onValueChange={(value) => handleSelectChange('subcategoryId', value)}
                  disabled={availableSubcategories.length === 0}
                >
                  <SelectTrigger id="subcategoryId">
                    <SelectValue placeholder="Selecione uma subcategoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubcategories.map(subcategory => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="listPrice">Preço de Tabela (R$)*</Label>
                <Input
                  id="listPrice"
                  name="listPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.listPrice}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <Label htmlFor="minPrice">Preço Mínimo (R$)*</Label>
                <Input
                  id="minPrice"
                  name="minPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minPrice}
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
                <Label htmlFor="volume">Volume</Label>
                <Input
                  id="volume"
                  name="volume"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.volume}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <Label htmlFor="imageUrl">URL da Imagem</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
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
