import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Customer, DiscountOption, Product, Order } from '../types/types';
import { toast } from 'sonner';
import { useOrders } from './OrderContext';
import { useCustomers } from './CustomerContext';
import { useDiscountSettings } from '../hooks/use-discount-settings';
import { useAuth } from './AuthContext';

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
  selectedTransportCompany: string | undefined;
  setSelectedTransportCompany: (id: string | undefined) => void;
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
  let addOrder: (newOrder: Partial<Order>) => Promise<string | undefined>;
  try {
    const { addOrder: orderContextAddOrder } = useOrders();
    addOrder = orderContextAddOrder;
  } catch (error) {
    console.error("OrderContext not available:", error);
    addOrder = async () => {
      toast.error("Erro: Sistema de pedidos não está disponível");
      return undefined;
    };
  }
  
  const { customers } = useCustomers();
  const { settings } = useDiscountSettings();
  const { user } = useAuth();
  
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
  const [selectedTransportCompany, setSelectedTransportCompany] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (settings) {
      const updatedDiscountOptions: DiscountOption[] = [
        {
          id: 'retirada',
          name: 'Retirada',
          description: 'Desconto para retirada na loja',
          value: settings.pickup,
          type: 'discount',
          isActive: true,
        },
        {
          id: 'meia-nota',
          name: 'Meia nota',
          description: 'Desconto para meia nota fiscal',
          value: settings.halfInvoice,
          type: 'discount',
          isActive: true,
        },
        {
          id: 'a-vista',
          name: 'A Vista',
          description: 'Desconto para pagamento à vista',
          value: settings.cashPayment,
          type: 'discount',
          isActive: true,
        },
        {
          id: 'icms-st',
          name: 'Substituição tributária',
          description: 'Acréscimo para substituição tributária',
          value: settings.taxSubstitution,
          type: 'surcharge',
          isActive: true,
        },
        {
          id: 'ipi',
          name: 'IPI',
          description: 'Imposto sobre Produtos Industrializados',
          value: settings.ipiRate,
          type: 'surcharge',
          isActive: true,
        }
      ];
      
      setDiscountOptions(updatedDiscountOptions);
    }
  }, [settings]);

  const handleSetCustomer = (selectedCustomer: Customer | null) => {
    const isSalesperson = user?.userTypeId === 'c5ee0433-3faf-46a4-a516-be7261bfe575';
    
    if (isSalesperson && selectedCustomer && selectedCustomer.salesPersonId !== user.id) {
      toast.error('Você só pode selecionar clientes atribuídos a você.');
      return;
    }
    
    setCustomer(selectedCustomer);
  };

  const calculateTotalUnits = (item: CartItem): number => {
    return item.quantity * (item.product.quantityPerVolume || 1);
  };

  const isDiscountOptionSelected = (id: string) => {
    return selectedDiscountOptions.includes(id);
  };

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  
  const rawSubtotal = items.reduce((total, item) => {
    const totalUnits = calculateTotalUnits(item);
    return total + (item.product.listPrice * totalUnits);
  }, 0);

  const getNetDiscountPercentage = () => {
    if (!applyDiscounts) return 0;
    
    let discountPercentage = 0;
    
    selectedDiscountOptions.forEach(id => {
      const option = discountOptions.find(opt => opt.id === id);
      if (!option || option.type !== 'discount') return;
      discountPercentage += option.value;
    });
    
    return discountPercentage;
  };

  const getTaxSubstitutionRate = () => {
    if (!isDiscountOptionSelected('icms-st')) return 0;
    
    const taxOption = discountOptions.find(opt => opt.id === 'icms-st');
    if (!taxOption) return 0;
    
    if (isDiscountOptionSelected('meia-nota')) {
      return (taxOption.value * halfInvoicePercentage) / 100;
    }
    
    return taxOption.value;
  };

  const getIPIRate = () => {
    if (!withIPI || !settings) return 0;
    
    const ipiRate = settings.ipiRate;
    
    if (isDiscountOptionSelected('meia-nota')) {
      return (ipiRate * halfInvoicePercentage) / 100;
    }
    
    return ipiRate;
  };

  const deliveryFee = settings && deliveryLocation === 'capital' 
    ? settings.deliveryFees.capital 
    : deliveryLocation === 'interior' && settings 
      ? settings.deliveryFees.interior 
      : 0;

  const calculateTaxSubstitutionValue = () => {
    if (!isDiscountOptionSelected('icms-st')) return 0;
    
    return items.reduce((total, item) => {
      const unitTaxValue = calculateItemTaxSubstitutionValue(item);
      const totalUnits = calculateTotalUnits(item);
      return total + (unitTaxValue * totalUnits);
    }, 0);
  };

  const calculateItemTaxSubstitutionValue = (item: CartItem) => {
    if (!isDiscountOptionSelected('icms-st')) return 0;
    
    const icmsRate = getTaxSubstitutionRate() / 100;
    const mva = (item.product.mva ?? 39) / 100;
    
    return item.finalPrice * mva * icmsRate;
  };

  const calculateIPIValue = () => {
    if (!withIPI || !settings) return 0;
    
    const ipiRate = settings.ipiRate;
    const effectiveRate = isDiscountOptionSelected('meia-nota') 
      ? (ipiRate * halfInvoicePercentage) / 100 
      : ipiRate;
    
    return items.reduce((total, item) => {
      const totalUnits = calculateTotalUnits(item);
      return total + (item.finalPrice * totalUnits * (effectiveRate / 100));
    }, 0);
  };

  const recalculateCart = () => {
    const globalDiscountPercentage = getNetDiscountPercentage();
    
    const updatedItems = items.map(item => {
      const listPrice = item.product.listPrice;
      
      const itemDiscount = item.discount || 0;
      const netDiscount = applyDiscounts ? itemDiscount + globalDiscountPercentage : itemDiscount;
      
      const finalPrice = listPrice * (1 - (netDiscount / 100));
      const totalUnits = calculateTotalUnits(item);
      const subtotal = finalPrice * totalUnits;
      
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
          const defaultDiscount = customer.defaultDiscount || 0;
          const finalPrice = item.product.listPrice * (1 - defaultDiscount / 100);
          
          const totalUnits = calculateTotalUnits(item);
          const subtotal = finalPrice * totalUnits;
          
          return {
            ...item,
            discount: defaultDiscount,
            finalPrice,
            subtotal
          };
        })
      );
    } else {
      setItems(prevItems => 
        prevItems.map(item => {
          const finalPrice = item.product.listPrice;
          
          const totalUnits = calculateTotalUnits(item);
          const subtotal = finalPrice * totalUnits;
          
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

  useEffect(() => {
    if (customer && customer.transportCompanyId) {
      console.log('Setting transport company from customer:', customer.transportCompanyId);
      setSelectedTransportCompany(customer.transportCompanyId === 'none' ? undefined : customer.transportCompanyId);
    } else {
      setSelectedTransportCompany(undefined);
    }
  }, [customer]);

  const totalDiscount = items.reduce((total, item) => {
    const totalUnits = calculateTotalUnits(item);
    const fullPrice = item.product.listPrice * totalUnits;
    const discountedPrice = item.finalPrice * totalUnits;
    return total + (fullPrice - discountedPrice);
  }, 0);

  const taxSubstitutionValue = calculateTaxSubstitutionValue();
  
  const ipiValue = calculateIPIValue();
  
  const subtotal = items.reduce((total, item) => {
    const totalUnits = calculateTotalUnits(item);
    return total + (item.finalPrice * totalUnits);
  }, 0);
  
  const total = subtotal + taxSubstitutionValue + ipiValue + deliveryFee;

  const toggleApplyDiscounts = () => {
    setApplyDiscounts(prev => !prev);
  };

  const toggleIPI = () => {
    setWithIPI(prev => {
      const newValue = !prev;
      if (newValue) {
        setSelectedDiscountOptions(prev => {
          if (!prev.includes('ipi')) {
            return [...prev, 'ipi'];
          }
          return prev;
        });
      } else {
        setSelectedDiscountOptions(prev => prev.filter(id => id !== 'ipi'));
      }
      return newValue;
    });
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
      
      const totalUnits = newQuantity * (product.quantityPerVolume || 1);
      const itemDiscount = existingItem.discount || 0;
      const globalDiscount = getNetDiscountPercentage();
      const netDiscount = applyDiscounts ? itemDiscount + globalDiscount : itemDiscount;
      const finalPrice = product.listPrice * (1 - (netDiscount / 100));
      
      const subtotal = finalPrice * totalUnits;
      
      newItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        finalPrice,
        subtotal
      };
      
      setItems(newItems);
      toast.success(`Quantidade de ${product.name} atualizada no carrinho`);
    } else {
      const listPrice = Number(product.listPrice) || 0;
      const initialDiscount = customer ? Number(customer.defaultDiscount) || 0 : 0;
      const globalDiscount = getNetDiscountPercentage();
      const netDiscount = applyDiscounts ? initialDiscount + globalDiscount : initialDiscount;
      
      const finalPrice = listPrice * (1 - netDiscount / 100);
      const totalUnits = quantity * (product.quantityPerVolume || 1);
      
      const newItem: CartItem = {
        id: Date.now().toString(),
        productId: product.id,
        product: { ...product },
        quantity,
        discount: initialDiscount,
        finalPrice,
        subtotal: finalPrice * totalUnits
      };
      
      console.log("Valores calculados:", {
        listPrice,
        initialDiscount,
        globalDiscount,
        netDiscount,
        finalPrice,
        quantityPerVolume: product.quantityPerVolume || 1,
        totalUnits
      });
      
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
        const totalUnits = quantity * (item.product.quantityPerVolume || 1);
        const subtotal = item.finalPrice * totalUnits;
        
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
    
    const globalDiscount = getNetDiscountPercentage();
    
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        const netDiscount = applyDiscounts ? appliedDiscount + globalDiscount : appliedDiscount;
        const finalPrice = item.product.listPrice * (1 - netDiscount / 100);
        
        const totalUnits = item.quantity * (item.product.quantityPerVolume || 1);
        const subtotal = finalPrice * totalUnits;
        
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
        if (id === 'retirada') {
          setDeliveryLocation(null);
        }
        if (id === 'meia-nota') {
          setHalfInvoicePercentage(50);
          setHalfInvoiceType('quantity');
        }
        if (id === 'a-vista') {
          setPaymentTerms('');
        }
        if (id === 'ipi') {
          setWithIPI(false);
        }
        return prev.filter(optId => optId !== id);
      } else {
        if (id === 'ipi') {
          setWithIPI(true);
        }
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
      const shippingValue: 'pickup' | 'delivery' = isDiscountOptionSelected('retirada') ? 'pickup' : 'delivery';
      const paymentMethodValue: 'cash' | 'credit' = isDiscountOptionSelected('a-vista') ? 'cash' : 'credit';
      
      const ipiRate = withIPI && settings ? settings.ipiRate : 0;
      const effectiveIpiRate = isDiscountOptionSelected('meia-nota') 
        ? (ipiRate * halfInvoicePercentage) / 100 
        : ipiRate;
      
      const itemsWithCalculatedValues = items.map(item => {
        const totalUnits = calculateTotalUnits(item);
        const globalDiscountPercentage = getNetDiscountPercentage();
        const totalDiscountPercentage = (item.discount || 0) + (applyDiscounts ? globalDiscountPercentage : 0);
        const taxSubstitutionValue = calculateItemTaxSubstitutionValue(item);
        
        const itemIpiValue = withIPI ? (item.finalPrice * (effectiveIpiRate / 100)) : 0;
        const totalWithTaxes = item.finalPrice + taxSubstitutionValue + itemIpiValue;
        
        return {
          ...item,
          totalDiscountPercentage,
          taxSubstitutionValue,
          ipiValue: itemIpiValue,
          totalWithTaxes,
          totalUnits
        };
      });

      const orderData: Partial<Order> = {
        customer,
        customerId: customer.id,
        items: itemsWithCalculatedValues,
        appliedDiscounts,
        deliveryLocation,
        deliveryFee,
        halfInvoicePercentage: isDiscountOptionSelected('meia-nota') ? halfInvoicePercentage : undefined,
        halfInvoiceType: isDiscountOptionSelected('meia-nota') ? halfInvoiceType : undefined,
        observations,
        subtotal,
        totalDiscount,
        total,
        shipping: shippingValue,
        paymentMethod: paymentMethodValue,
        paymentTerms: !isDiscountOptionSelected('a-vista') ? paymentTerms : undefined,
        fullInvoice: !isDiscountOptionSelected('meia-nota'),
        taxSubstitution: isDiscountOptionSelected('icms-st'),
        withIPI,
        ipiValue: withIPI ? calculateIPIValue() : undefined,
        status: 'pending',
        notes: observations,
        userId: user?.id,
        transportCompanyId: selectedTransportCompany
      };
      
      console.log('Sending order with data:', orderData);
      console.log('Transport company being sent to order:', orderData.transportCompanyId);
      
      const orderId = await addOrder(orderData);
      
      if (!orderId) {
        throw new Error('Erro ao criar pedido: Nenhum ID de pedido retornado');
      }
      
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
      selectedTransportCompany,
      setSelectedTransportCompany,
      setCustomer: handleSetCustomer,
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
