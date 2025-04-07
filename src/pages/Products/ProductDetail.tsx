
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ShoppingCart, ArrowLeft, Package, Truck, Weight, Box, Ruler
} from 'lucide-react';
import { useProducts } from '@/context/ProductContext';
import { useCart } from '@/context/CartContext';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';
import { useSupabaseData } from '@/hooks/use-supabase-data';
import { Tables } from '@/integrations/supabase/client';
import { supabaseProductToAppProduct } from '@/utils/adapters';
import { Product } from '@/types/types';

type SupabaseProduct = Tables<'products'>;

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [product, setProduct] = useState<SupabaseProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCart();
  
  // Fetch the specific product using Supabase
  const { 
    data: products, 
    isLoading: productsLoading,
    error: productsError 
  } = useSupabaseData<SupabaseProduct>('products');
  
  // Get categories and subcategories
  const { 
    data: categories,
    isLoading: categoriesLoading
  } = useSupabaseData('categories');
  
  const { 
    data: subcategories,
    isLoading: subcategoriesLoading
  } = useSupabaseData('subcategories');
  
  // Find the product when products are loaded
  useEffect(() => {
    if (!productsLoading && products.length > 0 && id) {
      const foundProduct = products.find(p => p.id === id);
      setProduct(foundProduct || null);
      setIsLoading(false);
    }
  }, [id, products, productsLoading]);
  
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
  
  // If there's an error or product not found, go back to products page
  useEffect(() => {
    if (!isLoading && !product) {
      toast.error("Produto não encontrado");
      navigate('/products');
    }
  }, [product, isLoading, navigate]);
  
  if (isLoading || !product) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-4 border-ferplas-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  const productImages = [
    product.image_url || 'https://via.placeholder.com/500',
    'https://via.placeholder.com/500/0A8A5F',
    'https://via.placeholder.com/500/0B9C6B',
    'https://via.placeholder.com/500/0CAB77',
  ];
  
  // Function to convert Supabase Product to our App's Product interface
  const handleAddToCart = () => {
    try {
      // Convert the Supabase product to our application's Product interface
      const appProduct = supabaseProductToAppProduct(product);
      addItem(appProduct, quantity);
      toast.success(`${product.name} adicionado ao carrinho`);
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Não foi possível adicionar ao carrinho. Tente novamente mais tarde.');
    }
  };
  
  // Product specifications - Fixed by providing default values for material and color
  const specifications = [
    { name: "Material", value: "PVC" }, // Default value since material doesn't exist in Product type
    { name: "Cor", value: "Branco" }, // Default value since color doesn't exist in Product type
    { name: "Dimensões", value: `${product.width || 0} × ${product.height || 0} × ${product.length || 0} mm` },
    { name: "Volume Cúbico", value: `${product.cubic_volume || 0} m³` },
    { name: "Quantidade por Volume", value: `${product.quantity_per_volume || 1} un.` },
    { name: "Peso", value: `${product.weight || 0} kg` },
    { name: "Código do Produto", value: product.id },
    { name: "Categoria", value: getCategoryName(product.category_id) },
    { name: "Subcategoria", value: getSubcategoryName(product.subcategory_id) }
  ];
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-gray-500 hover:text-ferplas-600 hover:bg-ferplas-50"
          onClick={() => navigate('/products')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para produtos
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 border">
            <img 
              src={productImages[selectedImage]} 
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-in-out"
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
          
          <div className="grid grid-cols-4 gap-2">
            {productImages.map((img, index) => (
              <div 
                key={index}
                className={`
                  aspect-square rounded-md overflow-hidden cursor-pointer border-2
                  ${selectedImage === index ? 'border-ferplas-500' : 'border-transparent'}
                  transition-all duration-200 hover:opacity-80
                `}
                onClick={() => setSelectedImage(index)}
              >
                <img 
                  src={img} 
                  alt={`${product.name} - vista ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <span>{getCategoryName(product.category_id)}</span>
              <span className="mx-2">›</span>
              <span>{getSubcategoryName(product.subcategory_id)}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <div className="flex items-center mt-2">
              <div className="bg-ferplas-100 text-ferplas-700 px-2 py-1 rounded text-sm font-medium flex items-center">
                <Package className="mr-1 h-3 w-3" /> 
                Em estoque: {product.quantity || 0} unidades
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-1 text-gray-500 text-sm">
              <p>Cód: <span className="font-mono">{product.id}</span></p>
            </div>
            <p className="text-gray-700 leading-relaxed">
              {product.description}
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-3 flex items-center">
                <Weight className="h-5 w-5 text-ferplas-500 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Peso</p>
                  <p className="font-medium">{product.weight || 0} kg</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center">
                <Ruler className="h-5 w-5 text-ferplas-500 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Dimensões</p>
                  <p className="font-medium">{product.width || 0} × {product.height || 0} × {product.length || 0} mm</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center">
                <Box className="h-5 w-5 text-ferplas-500 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Volume</p>
                  <p className="font-medium">{product.cubic_volume || 0} m³</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6">
              <div>
                <p className="text-sm text-gray-500">Preço de tabela</p>
                <p className="text-3xl font-bold text-ferplas-600">{formatCurrency(product.list_price || 0)}</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <p className="text-sm text-gray-500 mb-1">Quantidade</p>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                    className="h-9 w-9 text-ferplas-500"
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min="1"
                    className="h-9 w-16 mx-2 text-center input-transition"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-9 w-9 text-ferplas-500"
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                className="flex-1 bg-ferplas-500 hover:bg-ferplas-600 gap-2 button-transition py-6"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5" />
                Adicionar ao Carrinho
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Especificações</h2>
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {specifications.map((spec, index) => (
                <div key={index} className="flex justify-between border-b pb-2">
                  <span className="font-medium">{spec.name}</span>
                  <span className="text-gray-600">{spec.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Produtos Relacionados</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products
            .filter(p => p.category_id === product.category_id && p.id !== product.id)
            .slice(0, 4)
            .map((relatedProduct) => (
              <Card 
                key={relatedProduct.id} 
                className="cursor-pointer hover:shadow-md transition-all duration-300"
                onClick={() => navigate(`/products/${relatedProduct.id}`)}
              >
                <div className="aspect-square relative overflow-hidden bg-gray-100">
                  <img 
                    src={relatedProduct.image_url || 'https://via.placeholder.com/300'} 
                    alt={relatedProduct.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium truncate">{relatedProduct.name}</h3>
                  <p className="text-ferplas-600 font-bold mt-2">{formatCurrency(relatedProduct.list_price || 0)}</p>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
