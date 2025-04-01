import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Customer, DiscountOption, Product, Order } from '../types/types';
import { toast } from 'sonner';
import { useOrders } from './OrderContext';
import { useCustomers } from './CustomerContext';

interface CartContextType {
  items: CartItem[];
  customer: Customer | null;
  discountOptions: DiscountOption[];
  selectedDiscountOptions: string[];
  deliveryLocation: 'capital' | 'interior' | null;
  halfInvoicePercentage: number;
  observations: string;
  paymentTerms: string;
  totalItems: number;
  subtotal: number;
  totalDiscount: number;
  total: number;
  deliveryFee: number;
  applyDiscounts: boolean;
  setCustomer: (customer: Customer | null) => void;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  updateItemDiscount: (id: string, discount: number) => void;
  toggleDiscountOption: (id: string) => void;
  setDeliveryLocation: (location: 'capital' | 'interior' | null) => void;
  setHalfInvoicePercentage: (percentage: number) => void;
  setObservations: (text: string) => void;
  setPaymentTerms: (terms: string) => void;
  clearCart: () => void;
  sendOrder: () => Promise<void>;
  isDiscountOptionSelected: (id: string) => boolean;
  toggleApplyDiscounts: () => void;
  calculateTaxSubstitutionValue: () => number;
}

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

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addOrder } = useOrders();
  const { customers } = useCustomers();
  const [items, setItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [discountOptions] = useState<DiscountOption[]>(MOCK_DISCOUNT_OPTIONS);
  const [selectedDiscountOptions, setSelectedDiscountOptions] = useState<string[]>([]);
  const [deliveryLocation, setDeliveryLocation] = useState<'capital' | 'interior' | null>(null);
  const [halfInvoicePercentage, setHalfInvoicePercentage] = useState<number>(50);
  const [observations, setObservations] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [applyDiscounts, setApplyDiscounts] = useState<boolean>(true);

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  
  const subtotal = items.reduce((total, item) => {
    return total + (item.product.listPrice * item.quantity);
  }, 0);

  const getGlobalDiscountPercentage = () => {
    if (!applyDiscounts) return 0;
    
    let totalPercentage = 0;
    
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

  const deliveryFee = deliveryLocation === 'capital' ? 25 : deliveryLocation === 'interior' ? 50 : 0;

  const recalculateCart = () => {
    const globalDiscountPercentage = getGlobalDiscountPercentage();
    
    const updatedItems = items.map(item => {
      let itemDiscount = item.discount || 0;
      // Only apply global discounts if enabled
      const effectiveDiscount = applyDiscounts ? itemDiscount + globalDiscountPercentage : itemDiscount;
      const finalPrice = item.product.listPrice * (1 - effectiveDiscount / 100);
      const subtotal = finalPrice * item.quantity;
      
      return {
        ...item,
        finalPrice,
        subtotal
      };
    });
    
    setItems(updatedItems);
  };

  useEffect(() => {
    recalculateCart();
  }, [selectedDiscountOptions, applyDiscounts]);

  useEffect(() => {
    if (customer) {
      setItems(prevItems => 
        prevItems.map(item => ({
          ...item,
          discount: customer.defaultDiscount,
          finalPrice: item.product.listPrice * (1 - customer.defaultDiscount / 100),
          subtotal: item.product.listPrice * (1 - customer.defaultDiscount / 100) * item.quantity
        }))
      );
    } else {
      setItems(prevItems => 
        prevItems.map(item => ({
          ...item,
          discount: 0,
          finalPrice: item.product.listPrice,
          subtotal: item.product.listPrice * item.quantity
        }))
      );
    }
  }, [customer]);

  const totalDiscount = items.reduce((total, item) => {
    const fullPrice = item.product.listPrice * item.quantity;
    return total + (fullPrice - (item.subtotal || 0));
  }, 0);

  const calculateTaxSubstitutionValue = () => {
    if (!isDiscountOptionSelected('3') || !applyDiscounts) return 0;
    
    const taxOption = discountOptions.find(opt => opt.id === '3');
    if (!taxOption) return 0;
    
    const standardRate = taxOption.value / 100;
    
    // If half invoice is selected, adjust the tax rate based on the invoice percentage
    if (isDiscountOptionSelected('2')) {
      const adjustedRate = standardRate * (halfInvoicePercentage / 100);
      return adjustedRate * subtotal;
    }
    
    // Otherwise use the standard rate
    return standardRate * subtotal;
  };

  const taxSubstitutionValue = calculateTaxSubstitutionValue();
  
  const total = items.reduce((total, item) => total + (item.subtotal || 0), 0) + deliveryFee + taxSubstitutionValue;

  const toggleApplyDiscounts = () => {
    setApplyDiscounts(prev => !prev);
  };

  const addItem = (product: Product, quantity: number) => {
    if (!product || !product.id) {
      toast.error("Produto inválido");
      return;
    }
    
    const existingItemIndex = items.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
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
      const initialDiscount = customer ? customer.defaultDiscount : 0;
      const globalDiscountPercentage = getGlobalDiscountPercentage();
      const combinedDiscount = initialDiscount + globalDiscountPercentage;
      const finalPrice = product.listPrice * (1 - combinedDiscount / 100);
      
      const newItem: CartItem = {
        id: Date.now().toString(),
        productId: product.id,
        product: { ...product },
        quantity,
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
    
    // Armazenamos o desconto original para cálculo
    let appliedDiscount = discount;
    
    // Verificamos se o desconto excede o máximo permitido para o cliente
    if (customer && discount > customer.maxDiscount) {
      toast.warning(`Desconto limitado a ${customer.maxDiscount}% para o cliente ${customer.companyName}`);
      // Atualizamos o valor do desconto a ser aplicado para o máximo permitido
      appliedDiscount = customer.maxDiscount;
    }
    
    const globalDiscountPercentage = getGlobalDiscountPercentage();
    
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        // Usamos o desconto limitado para calcular o preço final
        const combinedDiscount = appliedDiscount + globalDiscountPercentage;
        const finalPrice = item.product.listPrice * (1 - combinedDiscount / 100);
        
        return {
          ...item,
          discount: appliedDiscount, // Salvamos o desconto limitado, não o original
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
        if (id === '1') {
          setDeliveryLocation(null);
        }
        if (id === '2') {
          setHalfInvoicePercentage(50);
        }
        if (id === '4') {
          // Clear payment terms when switching to "A Vista" (cash)
          setPaymentTerms('');
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
    setObservations('');
    setPaymentTerms('');
    toast.info('Carrinho limpo');
  };

  const sendOrder = async () => {
    if (!customer) {
      toast.error('Selecione um cliente para continuar');
      return Promise.reject('No customer selected');
    }
    
    if (items.length === 0) {
      toast.error('Adicione produtos ao carrinho para continuar');
      return Promise.reject('Cart is empty');
    }
    
    try {
      const shippingValue: 'pickup' | 'delivery' = isDiscountOptionSelected('1') ? 'pickup' : 'delivery';
      
      const paymentMethodValue: 'cash' | 'credit' = isDiscountOptionSelected('4') ? 'cash' : 'credit';
      
      const orderData: Partial<Order> = {
        customer,
        customerId: customer.id,
        items,
        appliedDiscounts: selectedDiscountOptions.map(id => 
          discountOptions.find(opt => opt.id === id)
        ) as DiscountOption[],
        deliveryLocation,
        deliveryFee,
        halfInvoicePercentage: isDiscountOptionSelected('2') ? halfInvoicePercentage : undefined,
        observations,
        subtotal,
        totalDiscount,
        total,
        shipping: shippingValue,
        paymentMethod: paymentMethodValue,
        paymentTerms: !isDiscountOptionSelected('4') ? paymentTerms : undefined,
        fullInvoice: !isDiscountOptionSelected('2'),
        taxSubstitution: isDiscountOptionSelected('3'),
        status: 'pending',
        notes: observations
      };
      
      console.log('Sending order:', orderData);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`Sending order email to ${customer.email} and vendas@ferplas.ind.br`);
      
      addOrder(orderData);
      
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
      observations,
      paymentTerms,
      totalItems,
      subtotal,
      totalDiscount,
      total,
      deliveryFee,
      applyDiscounts,
      setCustomer,
      addItem,
      removeItem,
      updateItemQuantity,
      updateItemDiscount,
      toggleDiscountOption,
      setDeliveryLocation,
      setHalfInvoicePercentage,
      setObservations,
      setPaymentTerms,
      clearCart,
      sendOrder,
      isDiscountOptionSelected,
      toggleApplyDiscounts,
      calculateTaxSubstitutionValue
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
