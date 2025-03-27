import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Customer, DiscountOption, Product } from '../types/types';
import { toast } from 'sonner';

interface CartContextType {
  items: CartItem[];
  customer: Customer | null;
  discountOptions: DiscountOption[];
  selectedDiscountOptions: string[];
  deliveryLocation: 'capital' | 'interior' | null;
  halfInvoicePercentage: number;
  totalItems: number;
  subtotal: number;
  totalDiscount: number;
  total: number;
  deliveryFee: number;
  setCustomer: (customer: Customer | null) => void;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  updateItemDiscount: (id: string, discount: number) => void;
  toggleDiscountOption: (id: string) => void;
  setDeliveryLocation: (location: 'capital' | 'interior' | null) => void;
  setHalfInvoicePercentage: (percentage: number) => void;
  clearCart: () => void;
  sendOrder: () => Promise<void>;
  isDiscountOptionSelected: (id: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Opções de desconto disponíveis - match the ones from DiscountManagement.tsx
const MOCK_DISCOUNT_OPTIONS: DiscountOption[] = [
  {
    id: '1',
    name: 'Retirada',
    description: 'Desconto para retirada na loja',
    value: 1,
    type: 'discount',
    isActive: true,
  },
  {
    id: '2',
    name: 'Meia nota',
    description: 'Desconto para meia nota fiscal',
    value: 3,
    type: 'discount',
    isActive: true,
  },
  {
    id: '3',
    name: 'Substituição tributária',
    description: 'Acréscimo para substituição tributária',
    value: 7.8,
    type: 'surcharge',
    isActive: true,
  },
  {
    id: '4',
    name: 'A Vista',
    description: 'Desconto para pagamento à vista',
    value: 1,
    type: 'discount',
    isActive: true,
  }
];

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [discountOptions] = useState<DiscountOption[]>(MOCK_DISCOUNT_OPTIONS);
  const [selectedDiscountOptions, setSelectedDiscountOptions] = useState<string[]>([]);
  const [deliveryLocation, setDeliveryLocation] = useState<'capital' | 'interior' | null>(null);
  const [halfInvoicePercentage, setHalfInvoicePercentage] = useState<number>(50);

  // Calculate cart totals
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  
  const subtotal = items.reduce((total, item) => {
    return total + (item.product.listPrice * item.quantity);
  }, 0);

  // Calculate the total discount percentage from selected discount options
  const getGlobalDiscountPercentage = () => {
    let totalPercentage = 0;
    
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

  // Calculate delivery fee based on location
  const deliveryFee = deliveryLocation === 'capital' ? 25 : deliveryLocation === 'interior' ? 50 : 0;

  const recalculateCart = () => {
    const globalDiscountPercentage = getGlobalDiscountPercentage();
    
    const updatedItems = items.map(item => {
      // Item-specific discount (manually entered per item)
      const itemDiscount = item.discount || 0;
      
      // Combined discount: item-specific + global options
      // If globalDiscountPercentage is negative, it means it's a surcharge overall
      const effectiveDiscount = itemDiscount + globalDiscountPercentage;
      
      // Calculate final price after all discounts
      const finalPrice = item.product.listPrice * (1 - effectiveDiscount / 100);
      
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
  }, [selectedDiscountOptions]);

  // When customer changes, update the individual discount of each item
  useEffect(() => {
    if (customer) {
      // Update each item to include the customer's default discount
      setItems(prevItems => 
        prevItems.map(item => ({
          ...item,
          discount: customer.defaultDiscount
        }))
      );
    } else {
      // If customer is removed, reset individual discounts to 0
      setItems(prevItems => 
        prevItems.map(item => ({
          ...item,
          discount: 0
        }))
      );
    }
  }, [customer]);

  // Calculate total discount amount
  const totalDiscount = items.reduce((total, item) => {
    const fullPrice = item.product.listPrice * item.quantity;
    return total + (fullPrice - (item.subtotal || 0));
  }, 0);

  // Final total including delivery fee
  const total = items.reduce((total, item) => total + (item.subtotal || 0), 0) + deliveryFee;

  const addItem = (product: Product, quantity: number) => {
    if (!product || !product.id) {
      toast.error("Produto inválido");
      return;
    }
    
    // Check if item already exists in cart
    const existingItemIndex = items.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const newItems = [...items];
      const existingItem = newItems[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      
      newItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        subtotal: existingItem.finalPrice * newQuantity
      };
      
      setItems(newItems);
      toast.success(`Quantidade de ${product.name} atualizada no carrinho`);
    } else {
      // Add new item
      const initialDiscount = customer ? customer.defaultDiscount : 0;
      const globalDiscountPercentage = getGlobalDiscountPercentage();
      const combinedDiscount = initialDiscount + globalDiscountPercentage;
      const finalPrice = product.listPrice * (1 - combinedDiscount / 100);
      
      const newItem: CartItem = {
        id: Date.now().toString(),
        productId: product.id,
        product: { ...product }, // Create a copy to prevent reference issues
        quantity,
        // If customer exists, apply their default discount to the item
        discount: initialDiscount,
        finalPrice,
        subtotal: finalPrice * quantity
      };
      
      setItems(prevItems => [...prevItems, newItem]);
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
    
    // Check if the discount exceeds the customer's max discount
    if (customer && discount > customer.maxDiscount) {
      toast.warning(`Desconto limitado a ${customer.maxDiscount}% para o cliente ${customer.companyName}`);
      discount = customer.maxDiscount;
    }
    
    // Get the global discount percentage from selected options
    const globalDiscountPercentage = getGlobalDiscountPercentage();
    
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        // Combined discount: item-specific + global options
        const combinedDiscount = discount + globalDiscountPercentage;
        
        // Calculate final price with all discounts applied
        const finalPrice = item.product.listPrice * (1 - combinedDiscount / 100);
        
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
        // If removing Retirada option, also clear delivery location
        if (id === '1') {
          setDeliveryLocation(null);
        }
        
        // If removing Meia nota option, reset half invoice percentage
        if (id === '2') {
          setHalfInvoicePercentage(50);
        }
        
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
    setDeliveryLocation(null);
    setHalfInvoicePercentage(50);
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
        deliveryLocation,
        deliveryFee,
        halfInvoicePercentage: isDiscountOptionSelected('2') ? halfInvoicePercentage : null,
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
      deliveryLocation,
      halfInvoicePercentage,
      totalItems,
      subtotal,
      totalDiscount,
      total,
      deliveryFee,
      setCustomer,
      addItem,
      removeItem,
      updateItemQuantity,
      updateItemDiscount,
      toggleDiscountOption,
      setDeliveryLocation,
      setHalfInvoicePercentage,
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
