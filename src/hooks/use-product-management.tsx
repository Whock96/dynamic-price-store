
import { useState } from 'react';
import { useProducts } from '@/context/ProductContext';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// Extended product type with the fields used in the ProductManagement component
export interface ExtendedProduct {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  categoryId: string;
  subcategoryId: string;
  isActive: boolean;
}

export const useProductManagement = () => {
  const { products: contextProducts, setProducts } = useProducts();
  const [isLoading, setIsLoading] = useState(false);

  // Convert context products to the extended format needed by the UI
  const products: ExtendedProduct[] = contextProducts.map(product => ({
    id: product.id,
    name: product.name,
    description: product.description,
    // Map from the existing Product type fields to the expected fields
    sku: product.id.substring(0, 8), // Use part of ID as SKU for demo
    price: product.listPrice,
    cost: product.listPrice * 0.6, // Estimate cost as 60% of list price
    stock: product.quantity,
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId,
    isActive: true // Default to active
  }));

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      // The products are already loaded from the context
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erro ao carregar produtos');
      setIsLoading(false);
    }
  };

  const addProduct = async (productData: Omit<ExtendedProduct, 'id'>) => {
    try {
      // Create a new product with the correct format for the context
      const newProduct = {
        id: uuidv4(),
        name: productData.name,
        description: productData.description,
        listPrice: productData.price,
        weight: 1, // Default values
        quantity: productData.stock,
        quantityPerVolume: 1,
        dimensions: {
          width: 10,
          height: 10, 
          length: 10
        },
        cubicVolume: 0.001,
        categoryId: productData.categoryId || '',
        subcategoryId: productData.subcategoryId || '',
        imageUrl: 'https://via.placeholder.com/150',
        mva: 39,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setProducts(prevProducts => [...prevProducts, newProduct]);
      toast.success('Produto adicionado com sucesso');
      return newProduct;
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Erro ao adicionar produto');
      throw error;
    }
  };

  const updateProduct = async (productData: ExtendedProduct) => {
    try {
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productData.id 
            ? {
                ...product,
                name: productData.name,
                description: productData.description,
                listPrice: productData.price,
                quantity: productData.stock,
                categoryId: productData.categoryId,
                subcategoryId: productData.subcategoryId,
                updatedAt: new Date()
              } 
            : product
        )
      );
      
      toast.success('Produto atualizado com sucesso');
      return productData;
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Erro ao atualizar produto');
      throw error;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      setProducts(prevProducts => 
        prevProducts.filter(product => product.id !== productId)
      );
      
      toast.success('Produto removido com sucesso');
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erro ao remover produto');
      throw error;
    }
  };

  return {
    products,
    isLoading,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct
  };
};
