import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Category, Subcategory } from '@/types/types';

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

// Mock data for categories
export const MOCK_CATEGORIES = [
  { 
    id: '1', 
    name: 'Tubos e Conexões', 
    description: 'Produtos para sistemas hidráulicos e esgoto',
    subcategories: [
      { id: '1-1', name: 'Tubos PVC', description: 'Tubos de PVC para água e esgoto', categoryId: '1' },
      { id: '1-2', name: 'Conexões PVC', description: 'Conexões de PVC para água e esgoto', categoryId: '1' },
    ]
  },
  { 
    id: '2', 
    name: 'Ferramentas', 
    description: 'Ferramentas para construção e reforma',
    subcategories: [
      { id: '2-1', name: 'Manuais', description: 'Ferramentas manuais diversas', categoryId: '2' },
      { id: '2-2', name: 'Elétricas', description: 'Ferramentas elétricas para profissionais', categoryId: '2' },
    ]
  },
  { 
    id: '3', 
    name: 'Hidráulica', 
    description: 'Produtos para sistemas hidráulicos residenciais e industriais',
    subcategories: [
      { id: '3-1', name: 'Válvulas', description: 'Válvulas para controle de fluxo', categoryId: '3' },
      { id: '3-2', name: 'Registros', description: 'Registros para controle de água', categoryId: '3' },
    ]
  },
];

interface ProductContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  getProductById: (id: string) => Product | undefined;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  getCategoryName: (categoryId: string) => string;
  getSubcategoryName: (categoryId: string, subcategoryId: string) => string;
  addCategory: (category: Omit<Category, 'subcategories'>) => Category;
  updateCategory: (category: Pick<Category, 'id' | 'name' | 'description'>) => void;
  deleteCategory: (categoryId: string) => void;
  addSubcategory: (categoryId: string, subcategory: Omit<Subcategory, 'categoryId'>) => Subcategory;
  updateSubcategory: (subcategory: Subcategory) => void;
  deleteSubcategory: (categoryId: string, subcategoryId: string) => void;
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

const loadCategoriesFromStorage = (): Category[] => {
  try {
    const savedCategories = localStorage.getItem('ferplas_categories');
    if (savedCategories) {
      return JSON.parse(savedCategories);
    }
  } catch (error) {
    console.error('Error loading categories from localStorage:', error);
  }
  return MOCK_CATEGORIES;
};

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(loadProductsFromStorage);
  const [categories, setCategories] = useState<Category[]>(loadCategoriesFromStorage);

  // Save products to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('ferplas_products', JSON.stringify(products));
    } catch (error) {
      console.error('Error saving products to localStorage:', error);
    }
  }, [products]);

  // Save categories to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('ferplas_categories', JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories to localStorage:', error);
    }
  }, [categories]);

  const getProductById = (id: string) => {
    return products.find(product => product.id === id);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Sem categoria';
  };

  const getSubcategoryName = (categoryId: string, subcategoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return 'Desconhecida';
    
    const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
    return subcategory?.name || 'Desconhecida';
  };

  // New methods for category management
  const addCategory = (category: Omit<Category, 'subcategories'>) => {
    const newCategory: Category = {
      ...category,
      subcategories: []
    };
    
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  };

  const updateCategory = (category: Pick<Category, 'id' | 'name' | 'description'>) => {
    setCategories(prev => prev.map(cat => 
      cat.id === category.id 
        ? { 
            ...cat, 
            name: category.name,
            description: category.description
          } 
        : cat
    ));
  };

  const deleteCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    
    // Update products that belonged to this category
    setProducts(prev => prev.map(product => 
      product.categoryId === categoryId 
        ? {
            ...product,
            categoryId: '',
            subcategoryId: ''
          }
        : product
    ));
  };

  const addSubcategory = (categoryId: string, subcategory: Omit<Subcategory, 'categoryId'>) => {
    const newSubcategory: Subcategory = {
      ...subcategory,
      categoryId
    };
    
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { 
            ...cat, 
            subcategories: [...cat.subcategories, newSubcategory] 
          } 
        : cat
    ));
    
    return newSubcategory;
  };

  const updateSubcategory = (subcategory: Subcategory) => {
    setCategories(prev => prev.map(cat => 
      cat.id === subcategory.categoryId 
        ? { 
            ...cat, 
            subcategories: cat.subcategories.map(sub => 
              sub.id === subcategory.id 
                ? { 
                    ...sub, 
                    name: subcategory.name,
                    description: subcategory.description
                  } 
                : sub
            )
          } 
        : cat
    ));
  };

  const deleteSubcategory = (categoryId: string, subcategoryId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { 
            ...cat, 
            subcategories: cat.subcategories.filter(sub => sub.id !== subcategoryId) 
          } 
        : cat
    ));
    
    // Update products that belonged to this subcategory
    setProducts(prev => prev.map(product => 
      product.categoryId === categoryId && product.subcategoryId === subcategoryId 
        ? {
            ...product,
            subcategoryId: ''
          }
        : product
    ));
  };

  return (
    <ProductContext.Provider value={{ 
      products, 
      setProducts, 
      getProductById, 
      categories,
      setCategories,
      getCategoryName,
      getSubcategoryName,
      addCategory,
      updateCategory,
      deleteCategory,
      addSubcategory,
      updateSubcategory,
      deleteSubcategory
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
