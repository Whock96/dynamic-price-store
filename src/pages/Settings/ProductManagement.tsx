import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight, Search, Filter, Import, X, Check, CircleDashed } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatters';

interface Product {
  id: string;
  name: string;
  list_price: number;
  quantity: number;
  category_id: string;
  subcategory_id: string | null;
  categories?: { name: string };
  subcategories?: { name: string };
  image_url: string;
}

const ProductManagement = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterActive, setFilterActive] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .order('name');

      if (error) throw error;
      setSubcategories(data || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('products').select(`
        *,
        categories:category_id (name),
        subcategories:subcategory_id (name)
      `);

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (selectedSubcategory) {
        query = query.eq('subcategory_id', selectedSubcategory);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;

      if (data) {
        setProducts(data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
    },
    {
      accessorKey: 'list_price',
      header: 'Preço',
      cell: ({ row }) => formatCurrency(row.getValue('list_price') as number),
    },
    {
      accessorKey: 'quantity',
      header: 'Quantidade',
    },
    {
      accessorKey: 'categories.name',
      header: 'Categoria',
    },
    {
      accessorKey: 'subcategories.name',
      header: 'Subcategoria',
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/products/${row.original.id}`)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredProducts = searchTerm
    ? products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  const handleCategoryChange = (value: string | null) => {
    setSelectedCategory(value);
    setSelectedSubcategory(null);
    setFilterActive(!!value || !!selectedSubcategory);
  };

  const handleSubcategoryChange = (value: string | null) => {
    setSelectedSubcategory(value);
    setFilterActive(!!selectedCategory || !!value);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setFilterActive(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedSubcategory]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <CardTitle>Gerenciar Produtos</CardTitle>
        <Button onClick={() => navigate('/products/new')} className="bg-ferplas-500 hover:bg-ferplas-600">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Produto
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <Input
            type="search"
            placeholder="Pesquisar produtos..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="max-w-md"
          />

          <div className="flex items-center space-x-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtrar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Filtrar Produtos</DialogTitle>
                  <DialogDescription>
                    Selecione as opções de filtro para refinar a lista de produtos.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Categoria
                    </Label>
                    <Select
                      value={selectedCategory || ''}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas as categorias</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="subcategory" className="text-right">
                      Subcategoria
                    </Label>
                    <Select
                      value={selectedSubcategory || ''}
                      onValueChange={handleSubcategoryChange}
                      disabled={!selectedCategory}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione a subcategoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas as subcategorias</SelectItem>
                        {subcategories
                          .filter(
                            (subcategory) =>
                              !selectedCategory ||
                              subcategory.category_id === selectedCategory
                          )
                          .map((subcategory) => (
                            <SelectItem key={subcategory.id} value={subcategory.id}>
                              {subcategory.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={clearFilters}>
                    Limpar Filtros
                  </Button>
                  <Button type="submit" onClick={() => setDialogOpen(false)}>
                    Aplicar Filtros
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {filterActive && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <DataTable columns={columns} data={filteredProducts} />
        )}
      </Card>
    </div>
  );
};

export default ProductManagement;
