
import React, { useState, useEffect } from 'react';
import { Search, Filter, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/utils/formatters';
import { useSupabaseData } from '@/hooks/use-supabase-data';
import { Tables } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type Product = Tables<'products'>;
type Category = Tables<'categories'>;
type Subcategory = Tables<'subcategories'>;

const ProductList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState('all');
  const [availableSubcategories, setAvailableSubcategories] = useState<Subcategory[]>([]);
  
  // Fetch products from Supabase
  const { 
    data: products, 
    isLoading: productsLoading,
    error: productsError
  } = useSupabaseData<Product>('products');
  
  // Fetch categories from Supabase
  const { 
    data: categories, 
    isLoading: categoriesLoading,
    error: categoriesError
  } = useSupabaseData<Category>('categories');
  
  // Fetch subcategories from Supabase
  const { 
    data: subcategories, 
    isLoading: subcategoriesLoading,
    error: subcategoriesError
  } = useSupabaseData<Subcategory>('subcategories');

  // Show toast errors if any
  useEffect(() => {
    if (productsError) {
      toast({ 
        title: "Erro ao carregar produtos", 
        description: productsError.message, 
        variant: "destructive" 
      });
    }
    if (categoriesError) {
      toast({ 
        title: "Erro ao carregar categorias", 
        description: categoriesError.message, 
        variant: "destructive" 
      });
    }
    if (subcategoriesError) {
      toast({ 
        title: "Erro ao carregar subcategorias", 
        description: subcategoriesError.message, 
        variant: "destructive" 
      });
    }
  }, [productsError, categoriesError, subcategoriesError, toast]);

  // Update available subcategories when category filter changes
  useEffect(() => {
    if (categoryFilter === 'all') {
      setAvailableSubcategories([]);
      setSubcategoryFilter('all');
    } else {
      const filteredSubcategories = subcategories.filter(
        sub => sub.category_id === categoryFilter
      );
      setAvailableSubcategories(filteredSubcategories);
      setSubcategoryFilter('all');
    }
  }, [categoryFilter, subcategories]);

  // Helper functions to get category and subcategory names
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

  // Filter products based on search query and category/subcategory filters
  const filteredProducts = products.filter(product => {
    const nameMatch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const descriptionMatch = product.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const matchesSearch = nameMatch || descriptionMatch;
    
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
    const matchesSubcategory = subcategoryFilter === 'all' || product.subcategory_id === subcategoryFilter;
    
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const isLoading = productsLoading || categoriesLoading || subcategoriesLoading;

  // Função para navegar para a página de detalhes do produto
  const handleProductClick = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">
            Lista de produtos disponíveis na Ferplas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-ferplas-500 hover:bg-ferplas-600 button-transition"
            onClick={() => navigate('/settings/products')}
          >
            <Package className="mr-2 h-4 w-4" />
            Gerenciar Produtos
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar produtos..."
                className="pl-10 input-transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter} disabled={isLoading}>
              <SelectTrigger>
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4 text-gray-400" />
                  <SelectValue placeholder="Categoria" />
                </div>
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
            
            <Select 
              value={subcategoryFilter} 
              onValueChange={setSubcategoryFilter}
              disabled={categoryFilter === 'all' || isLoading}
            >
              <SelectTrigger>
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4 text-gray-400" />
                  <SelectValue placeholder="Subcategoria" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as subcategorias</SelectItem>
                {availableSubcategories.map(subcategory => (
                  <SelectItem key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-square relative overflow-hidden bg-gray-100">
                <Skeleton className="absolute inset-0 w-full h-full" />
              </div>
              <CardContent className="p-3">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-8 w-full mb-4" />
                <div className="flex justify-between items-end mt-1">
                  <div>
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <Card 
              key={product.id} 
              className="overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              onClick={() => handleProductClick(product.id)}
            >
              <div className="aspect-square relative overflow-hidden bg-gray-100">
                <img 
                  src={product.image_url || 'https://via.placeholder.com/150'} 
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
                <div className="absolute top-2 right-2 flex flex-col items-end">
                  <div className="bg-ferplas-500 text-white text-xs px-2 py-1 rounded-full inline-block min-w-[20px] text-center">
                    {getCategoryName(product.category_id)}
                  </div>
                  <div className="bg-ferplas-600 text-white text-xs px-2 py-1 rounded-full inline-block min-w-[20px] text-center mt-1">
                    {getSubcategoryName(product.subcategory_id)}
                  </div>
                </div>
              </div>
              <CardContent className="p-3">
                <h3 className="text-base font-medium truncate">{product.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 h-8 mb-1">{product.description || ''}</p>
                <div className="flex justify-between items-end mt-1">
                  <div>
                    <p className="text-xs text-gray-500">Preço de tabela</p>
                    <p className="text-base font-bold text-ferplas-600">{formatCurrency(product.list_price || 0)}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs text-ferplas-500 border-ferplas-500 hover:bg-ferplas-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(product.id);
                    }}
                  >
                    Ver detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-gray-300 mb-4" />
          <h2 className="text-xl font-medium text-gray-600">Nenhum produto encontrado</h2>
          <p className="text-gray-500 mt-1">Tente ajustar seus filtros ou realizar uma nova busca.</p>
        </div>
      )}
    </div>
  );
};

export default ProductList;
