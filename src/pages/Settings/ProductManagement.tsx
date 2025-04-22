
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Plus, Search, ArrowLeft, Edit, Eye,
  Trash2, Check, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useSupabaseData } from '@/hooks/use-supabase-data';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/formatters';
import { isAdministrador } from '@/utils/permissionUtils';

const ProductManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { 
    data: products, 
    isLoading, 
    fetchData: fetchProducts,
    deleteRecord: deleteProduct
  } = useSupabaseData('products', {
    include: { 
      foreignTables: ['categories', 'subcategories'] 
    },
    orderBy: { column: 'name', ascending: true }
  });

  const { 
    data: categories, 
    isLoading: isLoadingCategories 
  } = useSupabaseData('categories', {
    include: { 
      foreignTables: ['subcategories'] 
    },
    orderBy: { column: 'name', ascending: true }
  });

  useEffect(() => {
    if (user && !isAdministrador(user.userTypeId)) {
      toast.error('Você não tem permissão para acessar esta página');
      navigate('/dashboard');
      return;
    }
  }, [navigate, user]);

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('id')
        .eq('product_id', productId)
        .limit(1);
        
      if (orderItemsError) throw orderItemsError;
      
      if (orderItems && orderItems.length > 0) {
        toast.error('Este produto não pode ser excluído pois está associado a pedidos.');
        return;
      }
      
      await deleteProduct(productId);
      toast.success('Produto excluído com sucesso');
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error('Erro ao excluir produto');
    }
  };

  const filteredProducts = React.useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (product.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

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
          onClick={() => navigate('/settings/products/new')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar produtos..."
              className="pl-10 input-transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <div className="font-medium text-sm">Categoria</div>
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={selectedCategory === 'all' ? 'default' : 'outline'} 
                className="cursor-pointer hover:bg-ferplas-100"
                onClick={() => setSelectedCategory('all')}
              >
                Todas
              </Badge>
              
              {!isLoadingCategories && categories.map(category => (
                <Badge 
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'} 
                  className="cursor-pointer hover:bg-ferplas-100"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-ferplas-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-muted-foreground">Carregando produtos...</p>
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
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map(product => {
                  const category = categories.find(c => c.id === product.category_id)?.name || 'Sem categoria';
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{category}</TableCell>
                      <TableCell>{formatCurrency(product.list_price)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {product.quantity > 10 ? (
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                          ) : product.quantity > 0 ? (
                            <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <span>{product.quantity} unid.</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 px-2 text-blue-600"
                            onClick={() => navigate(`/products/${product.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 px-2 text-amber-600"
                            onClick={() => navigate(`/settings/products/${product.id}/edit`)}
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
                                <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o produto "{product.name}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDeleteProduct(product.id)}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          
          {!isLoading && filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-600">Nenhum produto encontrado</h2>
              <p className="text-gray-500 mt-1">Tente ajustar seus filtros ou adicione novos produtos.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/settings/products/new')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Produto
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Separator />
    </div>
  );
};

export default ProductManagement;
