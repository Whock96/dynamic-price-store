
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Category, Subcategory } from '@/types/types';
import { useCategories } from '@/hooks/use-categories';

// Initial mock data for products
const INITIAL_PRODUCTS = Array.from({ length: 20 }, (_, i) => {
  const width = Math.floor(Math.random() * 50) + 10;
  const height = Math.floor(Math.random() * 50) + 10;
  const length = Math.floor(Math.random() * 50) + 10;
  const cubicVolume = (width * height * length) / 1000000; // Convert to cubic meters
  
  return {
    id: `product-${i + 1}`,
    name: `Produto ${i + 1}`,
    description: `Descrição do produto ${i + 1}. Este é um produto de alta qualidade.`,
    listPrice: Math.floor(Math.random() * 900) + 100,
    weight: Math.floor(Math.random() * 5) + 0.5,
    quantity: Math.floor(Math.random() * 100) + 10,
    quantityPerVolume: Math.floor(Math.random() * 10) + 1,
    dimensions: {
      width,
      height,
      length
    },
    cubicVolume: parseFloat(cubicVolume.toFixed(4)),
    categoryId: i % 3 === 0 ? '1' : i % 3 === 1 ? '2' : '3',
    subcategoryId: i % 3 === 0 ? '1-1' : i % 3 === 1 ? '2-1' : '3-1',
    imageUrl: 'https://via.placeholder.com/150',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
});

interface ProductContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  getProductById: (id: string) => Product | undefined;
  categories: Category[];
  getCategoryName: (categoryId: string) => string;
  getSubcategoryName: (categoryId: string, subcategoryId: string) => string;
  addCategory: (category: Omit<Category, 'subcategories' | 'id'>) => Promise<Category | null>;
  updateCategory: (category: Pick<Category, 'id' | 'name' | 'description'>) => Promise<boolean>;
  deleteCategory: (categoryId: string) => Promise<boolean>;
  addSubcategory: (categoryId: string, subcategory: Omit<Subcategory, 'categoryId'>) => Promise<Subcategory | null>;
  updateSubcategory: (subcategory: Subcategory) => Promise<boolean>;
  deleteSubcategory: (categoryId: string, subcategoryId: string) => Promise<boolean>;
  isLoadingCategories: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Helper functions for localStorage
const loadProductsFromStorage = (): Product[] => {
  try {
    const savedProducts = localStorage.getItem('ferplas_products');
    if (savedProducts) {
      // Parse the JSON string and convert date strings back to Date objects
      const parsedProducts = JSON.parse(savedProducts);
      return parsedProducts.map((product: any) => ({
        ...product,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt)
      }));
    }
  } catch (error) {
    console.error('Error loading products from localStorage:', error);
  }
  return INITIAL_PRODUCTS;
};

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(loadProductsFromStorage);
  const { 
    categories, 
    isLoading: isLoadingCategories, 
    addCategory, 
    updateCategory, 
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    getCategoryName,
    getSubcategoryName
  } = useCategories();

  // Save products to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('ferplas_products', JSON.stringify(products));
    } catch (error) {
      console.error('Error saving products to localStorage:', error);
    }
  }, [products]);

  const getProductById = (id: string) => {
    return products.find(product => product.id === id);
  };

  return (
    <ProductContext.Provider value={{ 
      products, 
      setProducts, 
      getProductById, 
      categories,
      getCategoryName,
      getSubcategoryName,
      addCategory,
      updateCategory,
      deleteCategory,
      addSubcategory,
      updateSubcategory,
      deleteSubcategory,
      isLoadingCategories
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
