import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Product, CartItem, Customer, DiscountOption, Order, TransportCompany } from '@/types/types';
import { useOrders } from './OrderContext';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getTotalItems: () => number;
  applyDiscount: (discount: DiscountOption) => void;
  removeDiscount: (discountId: string) => void;
  appliedDiscounts: DiscountOption[];
  setCustomer: (customer: Customer | null) => void;
  customer: Customer | null;
  deliveryFees: { capital: number; interior: number };
  setDeliveryFees: (fees: { capital: number; interior: number }) => void;
  discountSettings: {
    pickup: number;
    cashPayment: number;
    halfInvoice: number;
    taxSubstitution: number;
    deliveryFees: {
      capital: number;
      interior: number;
    };
    ipiRate: number;
  };
  setDiscountSettings: (settings: {
    pickup: number;
    cashPayment: number;
    halfInvoice: number;
    taxSubstitution: number;
    deliveryFees: {
      capital: number;
      interior: number;
    };
    ipiRate: number;
  }) => void;
  
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  updateItemDiscount: (productId: string, discount: number) => void;
  discountOptions: DiscountOption[];
  toggleDiscountOption: (discountId: string) => void;
  isDiscountOptionSelected: (discountId: string) => boolean;
  deliveryLocation: 'capital' | 'interior' | null;
  setDeliveryLocation: (location: 'capital' | 'interior' | null) => void;
  halfInvoicePercentage: number;
  setHalfInvoicePercentage: (percentage: number) => void;
  halfInvoiceType: 'quantity' | 'price';
  setHalfInvoiceType: (type: 'quantity' | 'price') => void;
  observations: string;
  setObservations: (observations: string) => void;
  totalItems: number;
  subtotal: number;
  totalDiscount: number;
  total: number;
  sendOrder: () => Promise<void>;
  deliveryFee: number;
  applyDiscounts: boolean;
  toggleApplyDiscounts: () => void;
  paymentTerms: string;
  setPaymentTerms: (terms: string) => void;
  calculateTaxSubstitutionValue: () => number;
  withIPI: boolean;
  toggleIPI: () => void;
  calculateIPIValue: () => number;
  calculateItemTaxSubstitutionValue: (item: CartItem) => number;
  selectedTransportCompany: TransportCompany | null;
  setSelectedTransportCompany: (company: TransportCompany | string | null) => void;
  withSuframa: boolean;
  toggleSuframa: () => void;
  lastOrder: Order | null;
  isLoadingLastOrder: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedDiscounts, setAppliedDiscounts] = useState<DiscountOption[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [deliveryFees, setDeliveryFees] = useState({ capital: 0, interior: 0 });
  const [discountSettings, setDiscountSettings] = useState({
    pickup: 0,
    cashPayment: 0,
    halfInvoice: 0,
    taxSubstitution: 0,
    deliveryFees: {
      capital: 0,
      interior: 0,
    },
    ipiRate: 0,
  });
  const [deliveryLocation, setDeliveryLocation] = useState<'capital' | 'interior' | null>(null);
  const [halfInvoicePercentage, setHalfInvoicePercentage] = useState<number>(50);
  const [halfInvoiceType, setHalfInvoiceType] = useState<'quantity' | 'price'>('quantity');
  const [observations, setObservations] = useState<string>('');
  const [applyDiscounts, setApplyDiscounts] = useState<boolean>(true);
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [withIPI, setWithIPI] = useState<boolean>(false);
  const [selectedTransportCompany, setSelectedTransportCompanyState] = useState<TransportCompany | null>(null);
  const [withSuframa, setWithSuframa] = useState<boolean>(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [isLoadingLastOrder, setIsLoadingLastOrder] = useState<boolean>(false);

  const { addOrder } = useOrders();
  const { user } = useAuth();

  const [discountOptions, setDiscountOptions] = useState<DiscountOption[]>([
    {
      id: 'retirada',
      name: 'Retirada no Local',
      description: 'Desconto para retiradas na empresa',
      value: discountSettings.pickup,
      type: 'discount',
      isActive: true
    },
    {
      id: 'a-vista',
      name: 'Pagamento à Vista',
      description: 'Desconto para pagamentos à vista',
      value: discountSettings.cashPayment,
      type: 'discount',
      isActive: true
    },
    {
      id: 'meia-nota',
      name: 'Meia Nota',
      description: 'Aplicar meia nota (desconto parcial)',
      value: discountSettings.halfInvoice,
      type: 'discount',
      isActive: true
    },
    {
      id: 'icms-st',
      name: 'Substituição Tributária',
      description: 'Aplicar imposto de substituição tributária',
      value: discountSettings.taxSubstitution,
      type: 'surcharge',
      isActive: true
    }
  ]);

  useEffect(() => {
    setDiscountOptions([
      {
        id: 'retirada',
        name: 'Retirada no Local',
        description: 'Desconto para retiradas na empresa',
        value: discountSettings.pickup,
        type: 'discount',
        isActive: true
      },
      {
        id: 'a-vista',
        name: 'Pagamento à Vista',
        description: 'Desconto para pagamentos à vista',
        value: discountSettings.cashPayment,
        type: 'discount',
        isActive: true
      },
      {
        id: 'meia-nota',
        name: 'Meia Nota',
        description: 'Aplicar meia nota (desconto parcial)',
        value: discountSettings.halfInvoice,
        type: 'discount',
        isActive: true
      },
      {
        id: 'icms-st',
        name: 'Substituição Tributária',
        description: 'Aplicar imposto de substituição tributária',
        value: discountSettings.taxSubstitution,
        type: 'surcharge',
        isActive: true
      }
    ]);
  }, [discountSettings]);

  useEffect(() => {
    const storedCart = localStorage.getItem('ferplas_cart');
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }

    const storedDiscounts = localStorage.getItem('ferplas_applied_discounts');
    if (storedDiscounts) {
      setAppliedDiscounts(JSON.parse(storedDiscounts));
    }

    const storedCustomer = localStorage.getItem('ferplas_customer');
    if (storedCustomer) {
      setCustomer(JSON.parse(storedCustomer));
    }

    const storedDeliveryFees = localStorage.getItem('ferplas_delivery_fees');
    if (storedDeliveryFees) {
      setDeliveryFees(JSON.parse(storedDeliveryFees));
    }

    const storedDiscountSettings = localStorage.getItem('ferplas_discount_settings');
    if (storedDiscountSettings) {
      setDiscountSettings(JSON.parse(storedDiscountSettings));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ferplas_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('ferplas_applied_discounts', JSON.stringify(appliedDiscounts));
  }, [appliedDiscounts]);

  useEffect(() => {
    localStorage.setItem('ferplas_customer', JSON.stringify(customer));
  }, [customer]);

  useEffect(() => {
    localStorage.setItem('ferplas_delivery_fees', JSON.stringify(deliveryFees));
  }, [deliveryFees]);

  useEffect(() => {
    localStorage.setItem('ferplas_discount_settings', JSON.stringify(discountSettings));
  }, [discountSettings]);

  const addToCart = (product: Product, quantity: number) => {
    const existingItem = cart.find(item => item.productId === product.id);

    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + quantity);
    } else {
      const newItem: CartItem = {
        id: product.id,
        productId: product.id,
        product: product,
        quantity: quantity,
        discount: 0,
        finalPrice: product.listPrice,
        subtotal: product.listPrice * quantity,
        totalUnits: quantity * product.quantityPerVolume,
        totalWeight: product.weight * quantity,
        totalCubicVolume: product.cubicVolume * quantity
      };
      setCart([...cart, newItem]);
      toast.success(`${quantity} ${product.name} adicionado ao carrinho`);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
    toast.success('Produto removido do carrinho');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map(item => {
        if (item.productId === productId) {
          const updatedItem = {
            ...item,
            quantity: quantity,
            subtotal: item.product.listPrice * quantity,
            totalUnits: quantity * item.product.quantityPerVolume,
            totalWeight: item.product.weight * quantity,
            totalCubicVolume: item.product.cubicVolume * quantity
          };
          return updatedItem;
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedDiscounts([]);
    setCustomer(null);
    localStorage.removeItem('ferplas_cart');
    localStorage.removeItem('ferplas_applied_discounts');
    localStorage.removeItem('ferplas_customer');
    toast.success('Carrinho limpo');
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const applyDiscount = (discount: DiscountOption) => {
    if (!appliedDiscounts.find(d => d.id === discount.id)) {
      setAppliedDiscounts([...appliedDiscounts, discount]);
      toast.success(`${discount.name} aplicado`);
    } else {
      toast.error(`${discount.name} já está aplicado`);
    }
  };

  const removeDiscount = (discountId: string) => {
    setAppliedDiscounts(appliedDiscounts.filter(discount => discount.id !== discountId));
    toast.success('Desconto removido');
  };

  const updateItemDiscount = (productId: string, discount: number) => {
    if (discount < 0) discount = 0;
    if (discount > 100) discount = 100;
    
    setCart(
      cart.map(item => {
        if (item.productId === productId) {
          const discountAmount = item.product.listPrice * (discount / 100);
          const finalPrice = item.product.listPrice - discountAmount;
          return {
            ...item,
            discount: discount,
            finalPrice: finalPrice,
            subtotal: finalPrice * item.quantity
          };
        }
        return item;
      })
    );
  };

  const toggleDiscountOption = (discountId: string) => {
    const option = discountOptions.find(d => d.id === discountId);
    if (!option) return;
    
    const isAlreadyApplied = appliedDiscounts.some(d => d.id === discountId);
    
    if (isAlreadyApplied) {
      removeDiscount(discountId);
    } else {
      applyDiscount(option);
    }
  };

  const isDiscountOptionSelected = (discountId: string) => {
    return appliedDiscounts.some(d => d.id === discountId);
  };

  const toggleApplyDiscounts = () => {
    setApplyDiscounts(!applyDiscounts);
  };

  const toggleIPI = () => {
    setWithIPI(!withIPI);
  };

  const calculateTaxSubstitutionValue = () => {
    if (!isDiscountOptionSelected('icms-st') || !applyDiscounts) {
      return 0;
    }
    
    const subtotal = getTotal();
    const taxRate = discountSettings.taxSubstitution / 100;
    
    if (isDiscountOptionSelected('meia-nota')) {
      return subtotal * taxRate * (halfInvoicePercentage / 100);
    }
    
    return subtotal * taxRate;
  };
  
  const calculateIPIValue = () => {
    if (!withIPI) {
      return 0;
    }
    
    const subtotal = getTotal();
    const ipiRate = discountSettings.ipiRate / 100;
    
    if (isDiscountOptionSelected('meia-nota')) {
      return subtotal * ipiRate * (halfInvoicePercentage / 100);
    }
    
    return subtotal * ipiRate;
  };
  
  const calculateItemTaxSubstitutionValue = (item: CartItem) => {
    if (!isDiscountOptionSelected('icms-st') || !applyDiscounts) {
      return 0;
    }
    
    const taxRate = discountSettings.taxSubstitution / 100;
    let value = item.finalPrice * taxRate;
    
    if (isDiscountOptionSelected('meia-nota')) {
      value = value * (halfInvoicePercentage / 100);
    }
    
    return value;
  };

  const toggleSuframa = () => {
    setWithSuframa(!withSuframa);
  };

  const calculateTotalDiscount = () => {
    if (!applyDiscounts) {
      return 0;
    }
    
    let totalDiscount = 0;
    const subtotal = getTotal();
    
    appliedDiscounts.forEach(discount => {
      if (discount.type === 'discount') {
        let discountValue = subtotal * (discount.value / 100);
        
        if (discount.id === 'meia-nota') {
          discountValue = subtotal * (discount.value / 100) * (halfInvoicePercentage / 100);
        }
        
        totalDiscount += discountValue;
      }
    });
    
    return totalDiscount;
  };
  
  const calculateDeliveryFee = () => {
    if (isDiscountOptionSelected('retirada') || !deliveryLocation) {
      return 0;
    }
    
    return deliveryLocation === 'capital' 
      ? deliveryFees.capital 
      : deliveryFees.interior;
  };
  
  const calculateTotal = () => {
    const subtotal = getTotal();
    const totalDiscount = calculateTotalDiscount();
    const taxSubstitution = calculateTaxSubstitutionValue();
    const ipiValue = calculateIPIValue();
    const deliveryFee = calculateDeliveryFee();
    
    return subtotal - totalDiscount + taxSubstitution + ipiValue + deliveryFee;
  };

  const sendOrder = async () => {
    if (!customer) {
      toast.error('Selecione um cliente para continuar');
      return Promise.reject('Cliente não selecionado');
    }
    
    if (cart.length === 0) {
      toast.error('Adicione produtos ao carrinho para continuar');
      return Promise.reject('Carrinho vazio');
    }
    
    setIsLoadingLastOrder(true);
    
    try {
      toast.success('Pedido enviado com sucesso!');
      clearCart();
      return Promise.resolve();
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Erro ao enviar pedido');
      return Promise.reject(error);
    } finally {
      setIsLoadingLastOrder(false);
    }
  };

  const setSelectedTransportCompany = (company: TransportCompany | string | null) => {
    if (typeof company === 'string') {
      console.log('Transport company ID provided:', company);
      setSelectedTransportCompanyState(null);
    } else {
      setSelectedTransportCompanyState(company);
    }
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal,
    getTotalItems,
    applyDiscount,
    removeDiscount,
    appliedDiscounts,
    setCustomer,
    customer,
    deliveryFees,
    setDeliveryFees,
    discountSettings,
    setDiscountSettings,
    
    items: cart,
    addItem: addToCart,
    removeItem: removeFromCart,
    updateItemQuantity: updateQuantity,
    updateItemDiscount,
    discountOptions,
    toggleDiscountOption,
    isDiscountOptionSelected,
    deliveryLocation,
    setDeliveryLocation,
    halfInvoicePercentage,
    setHalfInvoicePercentage,
    halfInvoiceType,
    setHalfInvoiceType,
    observations,
    setObservations,
    totalItems: getTotalItems(),
    subtotal: getTotal(),
    totalDiscount: calculateTotalDiscount(),
    total: calculateTotal(),
    sendOrder,
    deliveryFee: calculateDeliveryFee(),
    applyDiscounts,
    toggleApplyDiscounts,
    paymentTerms,
    setPaymentTerms,
    calculateTaxSubstitutionValue,
    withIPI,
    toggleIPI,
    calculateIPIValue,
    calculateItemTaxSubstitutionValue,
    selectedTransportCompany,
    setSelectedTransportCompany,
    withSuframa,
    toggleSuframa,
    lastOrder,
    isLoadingLastOrder
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
