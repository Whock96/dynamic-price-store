import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Customer, DiscountOption, Product, Order } from '../types/types';
import { toast } from 'sonner';
import { useOrders } from './OrderContext';
import { useCustomers } from './CustomerContext';
import { useDiscountSettings } from '../hooks/use-discount-settings';

interface CartContextType {
  items: CartItem[];
  customer: Customer | null;
  discountOptions: DiscountOption[];
  selectedDiscountOptions: string[];
  deliveryLocation: 'capital' | 'interior' | null;
  halfInvoicePercentage: number;
  halfInvoiceType: 'quantity' | 'price';
  observations: string;
  paymentTerms: string;
  totalItems: number;
  subtotal: number;
  totalDiscount: number;
  total: number;
  deliveryFee: number;
  applyDiscounts: boolean;
  withIPI: boolean;
  setCustomer: (customer: Customer | null) => void;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  updateItemDiscount: (id: string, discount: number) => void;
  toggleDiscountOption: (id: string) => void;
  setDeliveryLocation: (location: 'capital' | 'interior' | null) => void;
  setHalfInvoicePercentage: (percentage: number) => void;
  setHalfInvoiceType: (type: 'quantity' | 'price') => void;
  setObservations: (text: string) => void;
  setPaymentTerms: (terms: string) => void;
  clearCart: () => void;
  sendOrder: () => Promise<void>;
  isDiscountOptionSelected: (id: string) => boolean;
  toggleApplyDiscounts: () => void;
  calculateTaxSubstitutionValue: () => number;
  toggleIPI: () => void;
  calculateIPIValue: () => number;
  calculateItemTaxSubstitutionValue: (item: CartItem) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addOrder } = useOrders();
  const { customers } = useCustomers();
  const { settings } = useDiscountSettings();
  
  const [items, setItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [discountOptions, setDiscountOptions] = useState<DiscountOption[]>([]);
  const [selectedDiscountOptions, setSelectedDiscountOptions] = useState<string[]>([]);
  const [deliveryLocation, setDeliveryLocation] = useState<'capital' | 'interior' | null>(null);
  const [halfInvoicePercentage, setHalfInvoicePercentage] = useState<number>(50);
  const [halfInvoiceType, setHalfInvoiceType] = useState<'quantity' | 'price'>('quantity');
  const [observations, setObservations] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [applyDiscounts, setApplyDiscounts] = useState<boolean>(true);
  const [withIPI, setWithIPI] = useState<boolean>(false);

  useEffect(() => {
    if (settings) {
      const updatedDiscountOptions: DiscountOption[] = [
        {
          id: '1',
          name: 'Retirada',
          description: 'Desconto para retirada na loja',
          value: settings.pickup,
          type: 'discount',
          isActive: true,
        },
        {
          id: '2',
          name: 'Meia nota',
          description: 'Desconto para meia nota fiscal',
          value: settings.halfInvoice,
          type: 'discount',
          isActive: true,
        },
        {
          id: '3',
          name: 'Substituição tributária',
          description: 'Acréscimo para substituição tributária',
          value: settings.taxSubstitution,
          type: 'surcharge',
          isActive: true,
        },
        {
          id: '4',
          name: 'A Vista',
          description: 'Desconto para pagamento à vista',
          value: settings.cashPayment,
          type: 'discount',
          isActive: true,
        }
      ];
      
      setDiscountOptions(updatedDiscountOptions);
    }
  }, [settings]);

  const isDiscountOptionSelected = (id: string) => {
    return selectedDiscountOptions.includes(id);
  };

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  
  const subtotal = items.reduce((total, item) => {
    return total + (item.product.listPrice * item.quantity);
  }, 0);

  const getNetDiscountPercentage = () => {
    if (!applyDiscounts) return 0;
    
    let discountPercentage = 0;
    
    selectedDiscountOptions.forEach(id => {
      const option = discountOptions.find(opt => opt.id === id);
      if (!option) return;

      if (option.id === '3') return;
      
      if (option.type === 'discount') {
        discountPercentage += option.value;
      }
    });
    
    return discountPercentage;
  };

  const getTaxSubstitutionRate = () => {
    if (!isDiscountOptionSelected('3') || !applyDiscounts) return 0;
    
    const taxOption = discountOptions.find(opt => opt.id === '3');
    if (!taxOption) return 0;
    
    if (isDiscountOptionSelected('2')) {
      return taxOption.value * (halfInvoicePercentage / 100);
    }
    
    return taxOption.value;
  };

  const deliveryFee = settings && deliveryLocation === 'capital' 
    ? settings.deliveryFees.capital 
    : deliveryLocation === 'interior' && settings 
      ? settings.deliveryFees.interior 
      : 0;

  const calculateTaxSubstitutionValue = () => {
    if (!isDiscountOptionSelected('3') || !applyDiscounts) return 0;
    
    return items.reduce((total, item) => {
      return total + calculateItemTaxSubstitutionValue(item);
    }, 0);
  };

  const calculateItemTaxSubstitutionValue = (item: CartItem) => {
    if (!isDiscountOptionSelected('3') || !applyDiscounts) return 0;
    
    const taxOption = discountOptions.find(opt => opt.id === '3');
    if (!taxOption) return 0;
    
    // Get the ICMS ST rate from settings (in percentage, so divide by 100 to get the decimal value)
    const icmsStRate = taxOption.value / 100;
    
    // Get the MVA from product (default to 39% if not defined)
    const mva = (item.product.mva ?? 39) / 100;
    
    // New formula: item price * mva * icmsStRate
    const basePrice = item.finalPrice;
    
    // Calculate ST value for one unit: price * (1 + mva * icmsST) - price
    // Simplified to: price * mva * icmsST
    let taxValue = basePrice * mva * icmsStRate;
    
    // If half invoice is selected, adjust the tax rate
    if (isDiscountOptionSelected('2')) {
      taxValue = taxValue * (halfInvoicePercentage / 100);
    }
    
    return taxValue * item.quantity;
  };

  const calculateIPIValue = () => {
    if (!withIPI || !applyDiscounts || !settings) return 0;
    
    const standardRate = settings.ipiRate / 100;
    
    if (isDiscountOptionSelected('2')) {
      const adjustedRate = standardRate * (halfInvoicePercentage / 100);
      
      const discountedSubtotal = items.reduce((total, item) => 
        total + (item.finalPrice * item.quantity), 0);
        
      return adjustedRate * discountedSubtotal;
    }
    
    const discountedSubtotal = items.reduce((total, item) => 
      total + (item.finalPrice * item.quantity), 0);
      
    return standardRate * discountedSubtotal;
  };

  const recalculateCart = () => {
    const discountPercentage = getNetDiscountPercentage();
    
    const updatedItems = items.map(item => {
      let itemDiscount = item.discount || 0;
      let netDiscount = applyDiscounts ? itemDiscount + discountPercentage : itemDiscount;
      
      let finalPrice = item.product.listPrice * (1 - (netDiscount / 100));
      
      const taxRate = getTaxSubstitutionRate() / 100;
      const taxValue = finalPrice * taxRate;
      
      const subtotal = (finalPrice + (applyDiscounts ? taxValue : 0)) * item.quantity;
      
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
  }, [selectedDiscountOptions, applyDiscounts, halfInvoicePercentage, discountOptions]);

  useEffect(() => {
    if (customer) {
      setItems(prevItems => 
        prevItems.map(item => {
          const finalPrice = item.product.listPrice * (1 - customer.defaultDiscount / 100);
          
          const taxRate = getTaxSubstitutionRate() / 100;
          const taxValue = finalPrice * taxRate;
          const subtotal = (finalPrice + (applyDiscounts && isDiscountOptionSelected('3') ? taxValue : 0)) * item.quantity;
          
          return {
            ...item,
            discount: customer.defaultDiscount,
            finalPrice,
            subtotal
          };
        })
      );
    } else {
      setItems(prevItems => 
        prevItems.map(item => {
          const finalPrice = item.product.listPrice;
          
          const taxRate = getTaxSubstitutionRate() / 100;
          const taxValue = finalPrice * taxRate;
          const subtotal = (finalPrice + (applyDiscounts && isDiscountOptionSelected('3') ? taxValue : 0)) * item.quantity;
          
          return {
            ...item,
            discount: 0,
            finalPrice,
            subtotal
          };
        })
      );
    }
  }, [customer, discountOptions]);

  useEffect(() => {
    if (settings) {
      recalculateCart();
    }
  }, [settings]);

  const totalDiscount = items.reduce((total, item) => {
    const fullPrice = item.product.listPrice * item.quantity;
    const discountValue = fullPrice - (item.finalPrice * item.quantity);
    return total + discountValue;
  }, 0);

  const taxSubstitutionValue = calculateTaxSubstitutionValue();
  const ipiValue = calculateIPIValue();
  
  const total = items.reduce((total, item) => total + item.subtotal, 0) + deliveryFee + ipiValue;

  const toggleApplyDiscounts = () => {
    setApplyDiscounts(prev => !prev);
  };

  const toggleIPI = () => {
    setWithIPI(prev => !prev);
  };

  const addItem = (product: Product, quantity: number) => {
    if (!product || !product.id) {
      toast.error("Produto inválido");
      return;
    }
    
    console.log("Adicionando produto ao carrinho:", product);
    
    const existingItemIndex = items.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      const newItems = [...items];
      const existingItem = newItems[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      
      const taxRate = getTaxSubstitutionRate() / 100;
      const taxValue = existingItem.finalPrice * taxRate;
      const subtotal = (existingItem.finalPrice + (applyDiscounts && isDiscountOptionSelected('3') ? taxValue : 0)) * newQuantity;
      
      newItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        subtotal
      };
      
      setItems(newItems);
      toast.success(`Quantidade de ${product.name} atualizada no carrinho`);
    } else {
      const listPrice = Number(product.listPrice) || 0;
      const initialDiscount = customer ? Number(customer.defaultDiscount) || 0 : 0;
      const discountPercentage = getNetDiscountPercentage();
      const combinedDiscount = initialDiscount + discountPercentage;
      
      const finalPrice = listPrice * (1 - combinedDiscount / 100);
      
      const taxRate = getTaxSubstitutionRate() / 100;
      const taxValue = finalPrice * taxRate;
      
      const subtotal = (finalPrice + (applyDiscounts && isDiscountOptionSelected('3') ? taxValue : 0)) * quantity;
      
      console.log("Valores calculados:", {
        listPrice,
        initialDiscount,
        discountPercentage,
        combinedDiscount,
        finalPrice,
        taxRate,
        taxValue,
        subtotal
      });
      
      const newItem: CartItem = {
        id: Date.now().toString(),
        productId: product.id,
        product: { ...product },
        quantity,
        discount: initialDiscount,
        finalPrice,
        subtotal
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
    
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        const taxRate = getTaxSubstitutionRate() / 100;
        const taxValue = item.finalPrice * taxRate;
        const subtotal = (item.finalPrice + (applyDiscounts && isDiscountOptionSelected('3') ? taxValue : 0)) * quantity;
        
        return { 
          ...item, 
          quantity, 
          subtotal
        };
      }
      return item;
    }));
  };

  const updateItemDiscount = (id: string, discount: number) => {
    if (discount < 0) return;
    
    let appliedDiscount = discount;
    
    if (customer && discount > customer.maxDiscount) {
      toast.warning(`Desconto limitado a ${customer.maxDiscount}% para o cliente ${customer.companyName}`);
      appliedDiscount = customer.maxDiscount;
    }
    
    const discountPercentage = getNetDiscountPercentage();
    
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        const combinedDiscount = appliedDiscount + discountPercentage;
        
        const finalPrice = item.product.listPrice * (1 - combinedDiscount / 100);
        
        const taxRate = getTaxSubstitutionRate() / 100;
        const taxValue = finalPrice * taxRate;
        
        const subtotal = (finalPrice + (applyDiscounts && isDiscountOptionSelected('3') ? taxValue : 0)) * item.quantity;
        
        return {
          ...item,
          discount: appliedDiscount,
          finalPrice,
          subtotal
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
          setHalfInvoiceType('quantity');
        }
        if (id === '4') {
          setPaymentTerms('');
        }
        return prev.filter(optId => optId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const clearCart = () => {
    setItems([]);
    setCustomer(null);
    setSelectedDiscountOptions([]);
    setDeliveryLocation(null);
    setHalfInvoicePercentage(50);
    setObservations('');
    setPaymentTerms('');
    setWithIPI(false);
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
        halfInvoiceType: isDiscountOptionSelected('2') ? halfInvoiceType : undefined,
        observations,
        subtotal,
        totalDiscount,
        total,
        shipping: shippingValue,
        paymentMethod: paymentMethodValue,
        paymentTerms: !isDiscountOptionSelected('4') ? paymentTerms : undefined,
        fullInvoice: !isDiscountOptionSelected('2'),
        taxSubstitution: isDiscountOptionSelected('3'),
        withIPI,
        ipiValue: withIPI ? ipiValue : undefined,
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
      halfInvoiceType,
      observations,
      paymentTerms,
      totalItems,
      subtotal,
      totalDiscount,
      total,
      deliveryFee,
      applyDiscounts,
      withIPI,
      setCustomer,
      addItem,
      removeItem,
      updateItemQuantity,
      updateItemDiscount,
      toggleDiscountOption,
      setDeliveryLocation,
      setHalfInvoicePercentage,
      setHalfInvoiceType,
      setObservations,
      setPaymentTerms,
      clearCart,
      sendOrder,
      isDiscountOptionSelected,
      toggleApplyDiscounts,
      calculateTaxSubstitutionValue,
      toggleIPI,
      calculateIPIValue,
      calculateItemTaxSubstitutionValue
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
