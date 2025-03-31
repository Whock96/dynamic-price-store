
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types/types';

// Initial mock data for products
const INITIAL_PRODUCTS = Array.from({ length: 20 }, (_, i) => ({
  id: `product-${i + 1}`,
  name: `Produto ${i + 1}`,
  description: `Descrição do produto ${i + 1}. Este é um produto de alta qualidade.`,
  listPrice: Math.floor(Math.random() * 900) + 100,
  minPrice: Math.floor(Math.random() * 80) + 50,
  weight: Math.floor(Math.random() * 5) + 0.5,
  quantity: Math.floor(Math.random() * 100) + 10,
  volume: Math.floor(Math.random() * 3) + 1,
  categoryId: i % 3 === 0 ? '1' : i % 3 === 1 ? '2' : '3',
  subcategoryId: i % 3 === 0 ? '1-1' : i % 3 === 1 ? '2-1' : '3-1',
  imageUrl: 'https://via.placeholder.com/150',
  createdAt: new Date(),
  updatedAt: new Date(),
}));

// Mock data for categories
export const MOCK_CATEGORIES = [
  { id: '1', name: 'Acessórios', subcategories: [
    { id: '1-1', name: 'Tubos PVC' },
    { id: '1-2', name: 'Conexões PVC' },
  ]},
  { id: '2', name: 'Peças', subcategories: [
    { id: '2-1', name: 'Manuais' },
    { id: '2-2', name: 'Elétricas' },
  ]},
  { id: '3', name: 'Ferramentas', subcategories: [
    { id: '3-1', name: 'Válvulas' },
    { id: '3-2', name: 'Registros' },
  ]},
];

interface ProductContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  getProductById: (id: string) => Product | undefined;
  categories: typeof MOCK_CATEGORIES;
  getCategoryName: (categoryId: string) => string;
  getSubcategoryName: (categoryId: string, subcategoryId: string) => string;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  const getProductById = (id: string) => {
    return products.find(product => product.id === id);
  };

  const getCategoryName = (categoryId: string) => {
    const category = MOCK_CATEGORIES.find(cat => cat.id === categoryId);
    return category ? category.name : 'Sem categoria';
  };

  const getSubcategoryName = (categoryId: string, subcategoryId: string) => {
    const category = MOCK_CATEGORIES.find(cat => cat.id === categoryId);
    if (!category) return 'Desconhecida';
    
    const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
    return subcategory?.name || 'Desconhecida';
  };

  return (
    <ProductContext.Provider value={{ 
      products, 
      setProducts, 
      getProductById, 
      categories: MOCK_CATEGORIES,
      getCategoryName,
      getSubcategoryName
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
