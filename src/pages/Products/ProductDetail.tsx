import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ShoppingCart, ArrowLeft, Package, Truck, Weight, Box
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Input } from '@/components/ui/input';

// Mock data for a single product - using a cache for consistent product data
const productDetailsCache = new Map();

const getProductDetails = (id: string) => {
  // If we already have the product details cached, return them
  if (productDetailsCache.has(id)) {
    return productDetailsCache.get(id);
  }
  
  // Otherwise, create the product details and cache them
  const productId = id.split('-')[1] || '1';
  const product = {
    id,
    name: `Produto ${productId}`,
    description: `Este é um produto de alta qualidade desenvolvido pela Ferplas. O Produto ${productId} é reconhecido pela sua durabilidade e desempenho superior. Ideal para aplicações industriais e comerciais, este produto atende aos mais rigorosos padrões de qualidade e é amplamente utilizado em diversos setores.`,
    listPrice: 100 + (parseInt(productId) * 50), // deterministic price based on ID
    minPrice: 50 + (parseInt(productId) * 10),
    weight: 0.5 + (parseInt(productId) * 0.5),
    quantity: 10 + (parseInt(productId) * 5),
    volume: 1 + (parseInt(productId) % 3),
    categoryId: '1',
    subcategoryId: '2',
    imageUrl: 'https://via.placeholder.com/500',
    specifications: [
      { name: 'Material', value: 'Polietileno de alta densidade' },
      { name: 'Dimensões', value: '30cm x 20cm x 15cm' },
      { name: 'Cor', value: 'Verde' },
      { name: 'Garantia', value: '12 meses' },
    ],
    categoryName: 'Acessórios',
    subcategoryName: 'Conexões',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // Cache the product details
  productDetailsCache.set(id, product);
  
  return product;
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  
  // Check if id exists, otherwise navigate back to products list
  if (!id) {
    navigate('/products');
    return null;
  }
  
  const product = getProductDetails(id);
  
  // Mock multiple images for the gallery
  const productImages = [
    product.imageUrl,
    'https://via.placeholder.com/500/0A8A5F',
    'https://via.placeholder.com/500/0B9C6B',
    'https://via.placeholder.com/500/0CAB77',
  ];
  
  const handleAddToCart = () => {
    const productToAdd = { ...product }; // Create a copy to prevent reference issues
    addItem(productToAdd, quantity);
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
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
        {/* Product images */}
        <div className="space-y-4">
          <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 border">
            <img 
              src={productImages[selectedImage]} 
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-in-out"
            />
            <div className="absolute top-2 right-2 bg-ferplas-500 text-white text-xs px-2 py-1 rounded-full">
              {product.categoryName}
            </div>
          </div>
          
          {/* Thumbnail gallery */}
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
        
        {/* Product details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <span>{product.categoryName}</span>
              <span className="mx-2">›</span>
              <span>{product.subcategoryName}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <div className="flex items-center mt-2">
              <div className="bg-ferplas-100 text-ferplas-700 px-2 py-1 rounded text-sm font-medium flex items-center">
                <Package className="mr-1 h-3 w-3" /> 
                Em estoque: {product.quantity} unidades
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
                  <p className="font-medium">{product.weight} kg</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center">
                <Box className="h-5 w-5 text-ferplas-500 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Volume</p>
                  <p className="font-medium">{product.volume} m³</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center">
                <Truck className="h-5 w-5 text-ferplas-500 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Entrega</p>
                  <p className="font-medium">1-3 dias úteis</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6">
              <div>
                <p className="text-sm text-gray-500">Preço de tabela</p>
                <p className="text-3xl font-bold text-ferplas-600">R$ {product.listPrice.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Preço mínimo: R$ {product.minPrice.toFixed(2)}</p>
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
              <Button
                variant="outline"
                className="flex-1 text-ferplas-500 border-ferplas-500 hover:bg-ferplas-50 gap-2 button-transition py-6"
                onClick={() => {
                  handleAddToCart();
                  navigate('/cart');
                }}
              >
                Comprar Agora
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Product specifications */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Especificações</h2>
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.specifications.map((spec, index) => (
                <div key={index} className="flex justify-between border-b pb-2">
                  <span className="font-medium">{spec.name}</span>
                  <span className="text-gray-600">{spec.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Related products placeholder */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Produtos Relacionados</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="cursor-pointer hover:shadow-md transition-all duration-300">
              <div className="aspect-square relative overflow-hidden bg-gray-100">
                <img 
                  src={`https://via.placeholder.com/300/${i % 2 === 0 ? '0A8A5F' : '0B9C6B'}`} 
                  alt="Produto relacionado"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium truncate">Produto Relacionado {i + 1}</h3>
                <p className="text-ferplas-600 font-bold mt-2">R$ {(Math.floor(Math.random() * 500) + 100).toFixed(2)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
