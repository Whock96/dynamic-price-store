
import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Customer, DiscountOption, Product } from '../types/types';
import { toast } from 'sonner';

interface CartContextType {
  items: CartItem[];
  customer: Customer | null;
  discountOptions: DiscountOption[];
  selectedDiscountOptions: string[];
  totalItems: number;
  subtotal: number;
  totalDiscount: number;
  total: number;
  setCustomer: (customer: Customer | null) => void;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  updateItemDiscount: (id: string, discount: number) => void;
  toggleDiscountOption: (id: string) => void;
  clearCart: () => void;
  sendOrder: () => Promise<void>;
  isDiscountOptionSelected: (id: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Opções de desconto disponíveis
const MOCK_DISCOUNT_OPTIONS: DiscountOption[] = [
  {
    id: '1',
    name: 'Desconto A',
    description: 'Desconto para clientes preferenciais',
    value: 5,
    type: 'discount',
    isActive: true,
  },
  {
    id: '2',
    name: 'Desconto B',
    description: 'Desconto para grandes volumes',
    value: 3,
    type: 'discount',
    isActive: true,
  },
  {
    id: '3',
    name: 'Desconto C',
    description: 'Desconto para pagamento à vista',
    value: 2,
    type: 'discount',
    isActive: true,
  }
];

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [discountOptions] = useState<DiscountOption[]>(MOCK_DISCOUNT_OPTIONS);
  const [selectedDiscountOptions, setSelectedDiscountOptions] = useState<string[]>([]);

  // Calculate cart totals
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  
  const subtotal = items.reduce((total, item) => {
    return total + (item.product.listPrice * item.quantity);
  }, 0);

  // Calculate the total discount percentage from all applied discounts
  const getTotalDiscountPercentage = () => {
    // Start with customer default discount if customer is selected
    let totalPercentage = customer?.defaultDiscount || 0;
    
    // Add selected discount options
    selectedDiscountOptions.forEach(id => {
      const option = discountOptions.find(opt => opt.id === id);
      if (option) {
        totalPercentage = option.type === 'discount' 
          ? totalPercentage + option.value 
          : totalPercentage - option.value;
      }
    });
    
    return totalPercentage;
  };

  const recalculateCart = () => {
    const totalDiscountPercentage = getTotalDiscountPercentage();
    
    const updatedItems = items.map(item => {
      // Combine global discounts with product-specific discount
      const combinedDiscount = totalDiscountPercentage + (item.discount || 0);
      
      // Calculate final price after discount
      const finalPrice = item.product.listPrice * (1 - combinedDiscount / 100);
      
      // Calculate subtotal
      const subtotal = finalPrice * item.quantity;
      
      return {
        ...item,
        finalPrice,
        subtotal
      };
    });
    
    setItems(updatedItems);
  };

  // Recalculate when relevant state changes
  useEffect(() => {
    recalculateCart();
  }, [customer, selectedDiscountOptions]);

  // Calculate total discount amount
  const totalDiscount = items.reduce((total, item) => {
    const fullPrice = item.product.listPrice * item.quantity;
    return total + (fullPrice - item.subtotal);
  }, 0);

  // Final total
  const total = items.reduce((total, item) => total + item.subtotal, 0);

  const addItem = (product: Product, quantity: number) => {
    // Check if item already exists in cart
    const existingItem = items.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Update quantity of existing item
      updateItemQuantity(existingItem.id, existingItem.quantity + quantity);
      toast.success(`Quantidade de ${product.name} atualizada no carrinho`);
    } else {
      // Add new item
      const newItem: CartItem = {
        id: Date.now().toString(),
        productId: product.id,
        product,
        quantity,
        discount: 0,
        finalPrice: product.listPrice,
        subtotal: product.listPrice * quantity
      };
      
      setItems(prevItems => [...prevItems, newItem]);
      recalculateCart();
      toast.success(`${product.name} adicionado ao carrinho`);
    }
  };

  const removeItem = (id: string) => {
    const itemToRemove = items.find(item => item.id === id);
    if (itemToRemove) {
      setItems(prevItems => prevItems.filter(item => item.id !== id));
      toast.info(`${itemToRemove.product.name} removido do carrinho`);
    }
  };

  const updateItemQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    
    setItems(prevItems => prevItems.map(item => 
      item.id === id 
        ? { 
            ...item, 
            quantity, 
            subtotal: item.finalPrice * quantity 
          } 
        : item
    ));
  };

  const updateItemDiscount = (id: string, discount: number) => {
    if (discount < 0) return;
    
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        // Apply individual discount
        const finalPrice = item.product.listPrice * (1 - discount / 100);
        return {
          ...item,
          discount,
          finalPrice,
          subtotal: finalPrice * item.quantity
        };
      }
      return item;
    }));
  };

  const toggleDiscountOption = (id: string) => {
    setSelectedDiscountOptions(prev => {
      if (prev.includes(id)) {
        return prev.filter(optId => optId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const isDiscountOptionSelected = (id: string) => {
    return selectedDiscountOptions.includes(id);
  };

  const clearCart = () => {
    setItems([]);
    setCustomer(null);
    setSelectedDiscountOptions([]);
    toast.info('Carrinho limpo');
  };

  const sendOrder = async () => {
    // Validate order
    if (!customer) {
      toast.error('Selecione um cliente para continuar');
      return Promise.reject('No customer selected');
    }
    
    if (items.length === 0) {
      toast.error('Adicione produtos ao carrinho para continuar');
      return Promise.reject('Cart is empty');
    }
    
    // In a real application, this would send data to an API
    try {
      const orderData = {
        customer,
        items,
        discountOptions: selectedDiscountOptions.map(id => 
          discountOptions.find(opt => opt.id === id)
        ),
        subtotal,
        totalDiscount,
        total,
        date: new Date().toISOString()
      };
      
      console.log('Sending order:', orderData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Handle email sending (mock)
      console.log(`Sending order email to ${customer.email} and vendas@ferplas.ind.br`);
      
      toast.success('Pedido enviado com sucesso!');
      clearCart();
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error sending order:', error);
      toast.error('Erro ao enviar pedido. Tente novamente.');
      return Promise.reject(error);
    }
  };

  return (
    <CartContext.Provider value={{
      items,
      customer,
      discountOptions,
      selectedDiscountOptions,
      totalItems,
      subtotal,
      totalDiscount,
      total,
      setCustomer,
      addItem,
      removeItem,
      updateItemQuantity,
      updateItemDiscount,
      toggleDiscountOption,
      clearCart,
      sendOrder,
      isDiscountOptionSelected
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
