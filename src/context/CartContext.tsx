
import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Customer, DiscountOption, Product, Order } from '../types/types';
import { toast } from 'sonner';
import { useOrders } from './OrderContext';
import { useCustomers } from './CustomerContext';
import { useDiscountSettings } from '../hooks/use-discount-settings';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState<boolean>(true);
  const [selectedDiscountOptions, setSelectedDiscountOptions] = useState<string[]>([]);
  const [deliveryLocation, setDeliveryLocation] = useState<'capital' | 'interior' | null>(null);
  const [halfInvoicePercentage, setHalfInvoicePercentage] = useState<number>(50);
  const [halfInvoiceType, setHalfInvoiceType] = useState<'quantity' | 'price'>('quantity');
  const [observations, setObservations] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [applyDiscounts, setApplyDiscounts] = useState<boolean>(true);
  const [withIPI, setWithIPI] = useState<boolean>(false);
  const [selectedTransportCompany, setSelectedTransportCompany] = useState<string | undefined>(undefined);

  // Fetch discount options from database
  useEffect(() => {
    const fetchDiscountOptions = async () => {
      try {
        setIsLoadingDiscounts(true);
        const { data, error } = await supabase
          .from('discount_options')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Error fetching discount options:', error);
          toast.error('Erro ao carregar opções de desconto');
          return;
        }
        
        if (data && data.length > 0) {
          const mappedOptions: DiscountOption[] = data.map(option => ({
            id: option.id,
            name: option.name,
            description: option.description || '',
            value: Number(option.value),
            type: option.type === 'discount' ? 'discount' : 'surcharge',
            isActive: option.is_active,
          }));
          
          console.log('Loaded discount options from database:', mappedOptions);
          setDiscountOptions(mappedOptions);
        } else {
          console.log('No discount options found in database, using settings fallback');
          // Fallback to settings if no database options found
          if (settings) {
            const updatedDiscountOptions: DiscountOption[] = [
              {
                id: 'pickup-discount',
                name: 'Retirada',
                description: 'Desconto para retirada na loja',
                value: settings.pickup,
                type: 'discount',
                isActive: true,
              },
              {
                id: 'half-invoice-discount',
                name: 'Meia nota',
                description: 'Desconto para meia nota fiscal',
                value: settings.halfInvoice,
                type: 'discount',
                isActive: true,
              },
              {
                id: 'tax-substitution',
                name: 'Substituição tributária',
                description: 'Acréscimo para substituição tributária',
                value: settings.taxSubstitution,
                type: 'surcharge',
                isActive: true,
              },
              {
                id: 'cash-payment-discount',
                name: 'A Vista',
                description: 'Desconto para pagamento à vista',
                value: settings.cashPayment,
                type: 'discount',
                isActive: true,
              }
            ];
            
            console.log('Using fallback discount options from settings:', updatedDiscountOptions);
            setDiscountOptions(updatedDiscountOptions);
          }
        }
      } catch (error) {
        console.error('Unexpected error loading discount options:', error);
        toast.error('Erro ao carregar opções de desconto');
      } finally {
        setIsLoadingDiscounts(false);
      }
    };
    
    fetchDiscountOptions();
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
  
  const subtotal = items.reduce((total, item) => {
    const totalUnits = calculateTotalUnits(item);
    return total + (item.product.listPrice * totalUnits);
  }, 0);

  const getNetDiscountPercentage = () => {
    if (!applyDiscounts) return 0;
    
    let discountPercentage = 0;
    
    selectedDiscountOptions.forEach(id => {
      const option = discountOptions.find(opt => opt.id === id);
      if (!option) return;

      if (option.id === 'tax-substitution' || option.type === 'surcharge') return;
      
      if (option.type === 'discount') {
        discountPercentage += option.value;
      }
    });
    
    return discountPercentage;
  };

  const getTaxSubstitutionRate = () => {
    if (!isDiscountOptionSelected('tax-substitution') || !applyDiscounts) return 0;
    
    const taxOption = discountOptions.find(opt => opt.id === 'tax-substitution' || opt.name === 'Substituição tributária');
    if (!taxOption) return 0;
    
    if (isDiscountOptionSelected('half-invoice-discount')) {
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
    if (!isDiscountOptionSelected('tax-substitution') && !discountOptions.some(opt => 
      opt.name === 'Substituição tributária' && isDiscountOptionSelected(opt.id)
    ) || !applyDiscounts) return 0;
    
    return items.reduce((total, item) => {
      const unitTaxValue = calculateItemTaxSubstitutionValue(item);
      const totalUnits = calculateTotalUnits(item);
      return total + (unitTaxValue * totalUnits);
    }, 0);
  };

  const calculateItemTaxSubstitutionValue = (item: CartItem) => {
    if (!isDiscountOptionSelected('tax-substitution') && !discountOptions.some(opt => 
      opt.name === 'Substituição tributária' && isDiscountOptionSelected(opt.id)
    ) || !applyDiscounts) return 0;
    
    const taxOption = discountOptions.find(opt => 
      opt.id === 'tax-substitution' || opt.name === 'Substituição tributária'
    );
    if (!taxOption) return 0;
    
    const icmsStRate = taxOption.value / 100;
    const mva = (item.product.mva ?? 39) / 100;
    const basePrice = item.finalPrice;
    
    let taxValue = basePrice * mva * icmsStRate;
    
    if (isDiscountOptionSelected('half-invoice-discount') || discountOptions.some(opt => 
      opt.name === 'Meia nota' && isDiscountOptionSelected(opt.id)
    )) {
      taxValue = taxValue * (halfInvoicePercentage / 100);
    }
    
    return taxValue;
  };

  const calculateIPIValue = () => {
    if (!withIPI || !applyDiscounts || !settings) return 0;
    
    const standardRate = settings.ipiRate / 100;
    
    return items.reduce((total, item) => {
      const totalUnits = calculateTotalUnits(item);
      
      let adjustedRate = standardRate;
      if (isDiscountOptionSelected('half-invoice-discount') || discountOptions.some(opt => 
        opt.name === 'Meia nota' && isDiscountOptionSelected(opt.id)
      )) {
        adjustedRate = standardRate * (halfInvoicePercentage / 100);
      }
      
      return total + (item.finalPrice * adjustedRate * totalUnits);
    }, 0);
  };

  const recalculateCart = () => {
    const discountPercentage = getNetDiscountPercentage();
    
    const updatedItems = items.map(item => {
      let itemDiscount = item.discount || 0;
      let netDiscount = applyDiscounts ? itemDiscount + discountPercentage : itemDiscount;
      
      let finalPrice = item.product.listPrice * (1 - (netDiscount / 100));
      const totalUnits = calculateTotalUnits(item);
      
      const taxValuePerUnit = applyDiscounts && (isDiscountOptionSelected('tax-substitution') || 
        discountOptions.some(opt => opt.name === 'Substituição tributária' && isDiscountOptionSelected(opt.id))) ? 
        calculateItemTaxSubstitutionValue(item) : 0;
      
      const subtotal = (finalPrice + taxValuePerUnit) * totalUnits;
      
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
          
          const taxValue = applyDiscounts && isDiscountOptionSelected('3') ? 
            calculateItemTaxSubstitutionValue({...item, finalPrice}) : 0;
          
          const totalUnits = calculateTotalUnits(item);
          
          const subtotal = (finalPrice + taxValue) * totalUnits;
          
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
          
          const taxValue = applyDiscounts && isDiscountOptionSelected('3') ? 
            calculateItemTaxSubstitutionValue({...item, finalPrice}) : 0;
          
          const totalUnits = calculateTotalUnits(item);
          
          const subtotal = (finalPrice + taxValue) * totalUnits;
          
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
    const discountValue = fullPrice - (item.finalPrice * totalUnits);
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
      const totalUnits = newQuantity * (existingItem.product.quantityPerVolume || 1);
      
      const taxValuePerUnit = applyDiscounts && isDiscountOptionSelected('3') ? 
        calculateItemTaxSubstitutionValue({...existingItem, quantity: newQuantity}) : 0;
      
      const subtotal = (existingItem.finalPrice + taxValuePerUnit) * totalUnits;
      
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
      const totalUnits = quantity * (product.quantityPerVolume || 1);
      
      const tempItem: CartItem = {
        id: '',
        productId: product.id,
        product,
        quantity,
        discount: initialDiscount,
        finalPrice,
        subtotal: 0
      };
      
      const taxValuePerUnit = applyDiscounts && isDiscountOptionSelected('3') ? 
        calculateItemTaxSubstitutionValue(tempItem) : 0;
      
      const subtotal = (finalPrice + taxValuePerUnit) * totalUnits;
      
      console.log("Valores calculados:", {
        listPrice,
        initialDiscount,
        discountPercentage,
        combinedDiscount,
        finalPrice,
        taxValuePerUnit,
        subtotal,
        quantityPerVolume: product.quantityPerVolume || 1,
        totalUnits
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
        const totalUnits = quantity * (item.product.quantityPerVolume || 1);
        
        const taxValuePerUnit = applyDiscounts && isDiscountOptionSelected('3') ? 
          calculateItemTaxSubstitutionValue({...item, quantity}) : 0;
        
        const subtotal = (item.finalPrice + taxValuePerUnit) * totalUnits;
        
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
        const totalUnits = item.quantity * (item.product.quantityPerVolume || 1);
        
        const updatedItem = {...item, finalPrice, discount: appliedDiscount};
        
        const taxValuePerUnit = applyDiscounts && isDiscountOptionSelected('3') ? 
          calculateItemTaxSubstitutionValue(updatedItem) : 0;
        
        const subtotal = (finalPrice + taxValuePerUnit) * totalUnits;
        
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
    console.log('Toggling discount option:', id);
    
    // Make sure the discount option exists before toggling
    const discountOption = discountOptions.find(opt => opt.id === id);
    if (!discountOption) {
      console.warn(`Attempted to toggle non-existent discount option with id: ${id}`);
      // Check if we're trying to toggle a hardcoded ID but have real options loaded
      if (!isLoadingDiscounts && discountOptions.length > 0) {
        // Find by name instead of ID
        let foundByName: DiscountOption | undefined;
        
        if (id === 'pickup-discount') {
          foundByName = discountOptions.find(opt => opt.name === 'Retirada');
        } else if (id === 'half-invoice-discount') {
          foundByName = discountOptions.find(opt => opt.name === 'Meia nota');
        } else if (id === 'tax-substitution') {
          foundByName = discountOptions.find(opt => opt.name === 'Substituição tributária');
        } else if (id === 'cash-payment-discount') {
          foundByName = discountOptions.find(opt => opt.name === 'A Vista');
        }
        
        if (foundByName) {
          console.log(`Found discount option by name instead of ID: ${foundByName.id} (${foundByName.name})`);
          id = foundByName.id;
        } else {
          toast.error('Opção de desconto não encontrada');
          return;
        }
      } else {
        // Continue with the hardcoded ID if we're still loading or have no real options
        console.log('Using hardcoded ID while discount options are loading or unavailable');
      }
    }
    
    setSelectedDiscountOptions(prev => {
      if (prev.includes(id)) {
        if (id === 'pickup-discount' || discountOptions.some(opt => opt.name === 'Retirada' && opt.id === id)) {
          setDeliveryLocation(null);
        }
        if (id === 'half-invoice-discount' || discountOptions.some(opt => opt.name === 'Meia nota' && opt.id === id)) {
          setHalfInvoicePercentage(50);
          setHalfInvoiceType('quantity');
        }
        if (id === 'cash-payment-discount' || discountOptions.some(opt => opt.name === 'A Vista' && opt.id === id)) {
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
      const shippingValue: 'pickup' | 'delivery' = selectedDiscountOptions.some(id => {
        const option = discountOptions.find(opt => opt.id === id);
        return option?.name === 'Retirada' || id === 'pickup-discount';
      }) ? 'pickup' : 'delivery';
      
      const paymentMethodValue: 'cash' | 'credit' = selectedDiscountOptions.some(id => {
        const option = discountOptions.find(opt => opt.id === id);
        return option?.name === 'A Vista' || id === 'cash-payment-discount';
      }) ? 'cash' : 'credit';
      
      // Get applied discount options
      const appliedDiscounts: DiscountOption[] = selectedDiscountOptions
        .map(id => {
          const option = discountOptions.find(opt => opt.id === id);
          if (!option) {
            console.warn(`Applied discount with ID ${id} not found in available options`);
            
            // Try to find a fallback by name if using hardcoded IDs
            if (id === 'pickup-discount') {
              const fallback = discountOptions.find(opt => opt.name === 'Retirada');
              if (fallback) return fallback;
            } else if (id === 'half-invoice-discount') {
              const fallback = discountOptions.find(opt => opt.name === 'Meia nota');
              if (fallback) return fallback;
            } else if (id === 'tax-substitution') {
              const fallback = discountOptions.find(opt => opt.name === 'Substituição tributária');
              if (fallback) return fallback;
            } else if (id === 'cash-payment-discount') {
              const fallback = discountOptions.find(opt => opt.name === 'A Vista');
              if (fallback) return fallback;
            }
          }
          return option;
        })
        .filter((option): option is DiscountOption => option !== undefined);
      
      console.log('Applied discount options:', appliedDiscounts);
      
      // Determine if tax substitution is enabled
      const taxSubstitutionEnabled = selectedDiscountOptions.some(id => {
        const option = discountOptions.find(opt => opt.id === id);
        return option?.name === 'Substituição tributária' || id === 'tax-substitution';
      });
      
      // Determine if half invoice is enabled
      const halfInvoiceEnabled = selectedDiscountOptions.some(id => {
        const option = discountOptions.find(opt => opt.id === id);
        return option?.name === 'Meia nota' || id === 'half-invoice-discount';
      });
      
      const orderData: Partial<Order> = {
        customer,
        customerId: customer.id,
        items,
        appliedDiscounts,
        deliveryLocation,
        deliveryFee,
        halfInvoicePercentage: halfInvoiceEnabled ? halfInvoicePercentage : undefined,
        halfInvoiceType: halfInvoiceEnabled ? halfInvoiceType : undefined,
        observations,
        subtotal,
        totalDiscount,
        total,
        shipping: shippingValue,
        paymentMethod: paymentMethodValue,
        paymentTerms: paymentMethodValue === 'credit' ? paymentTerms : undefined,
        fullInvoice: !halfInvoiceEnabled,
        taxSubstitution: taxSubstitutionEnabled,
        withIPI,
        ipiValue: withIPI ? ipiValue : undefined,
        status: 'pending',
        notes: observations,
        userId: user?.id,
        transportCompanyId: shippingValue === 'delivery' ? selectedTransportCompany : undefined
      };
      
      console.log('Sending order with data:', orderData);
      
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
