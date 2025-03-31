
import React, { useState } from 'react';
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
import { useProducts } from '@/context/ProductContext';
import { formatCurrency } from '@/utils/formatters';

const ProductList = () => {
  const navigate = useNavigate();
  const { products, getCategoryName, categories } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

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

      {/* Filters */}
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
          </div>
        </CardContent>
      </Card>

      {/* Products grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <Card 
            key={product.id} 
            className="overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
            onClick={() => navigate(`/products/${product.id}`)}
          >
            <div className="aspect-square relative overflow-hidden bg-gray-100">
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              />
              <div className="absolute top-2 right-2 bg-ferplas-500 text-white text-xs px-2 py-1 rounded-full">
                {getCategoryName(product.categoryId)}
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="text-lg font-medium truncate">{product.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-2">{product.description}</p>
              <div className="flex justify-between items-end mt-2">
                <div>
                  <p className="text-xs text-gray-500">Preço de tabela</p>
                  <p className="text-lg font-bold text-ferplas-600">{formatCurrency(product.listPrice)}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-ferplas-500 border-ferplas-500 hover:bg-ferplas-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/products/${product.id}`);
                  }}
                >
                  Ver detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
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
