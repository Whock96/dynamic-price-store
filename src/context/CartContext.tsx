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
  
  // Added properties to maintain compatibility with Cart.tsx
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
  setSelectedTransportCompany: (company: TransportCompany | null) => void;
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
  
  // Added state for compatibility
  const [deliveryLocation, setDeliveryLocation] = useState<'capital' | 'interior' | null>(null);
  const [halfInvoicePercentage, setHalfInvoicePercentage] = useState<number>(50);
  const [halfInvoiceType, setHalfInvoiceType] = useState<'quantity' | 'price'>('quantity');
  const [observations, setObservations] = useState<string>('');
  const [applyDiscounts, setApplyDiscounts] = useState<boolean>(true);
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [withIPI, setWithIPI] = useState<boolean>(false);
  const [selectedTransportCompany, setSelectedTransportCompany] = useState<string | TransportCompany | null>(null);
  const [withSuframa, setWithSuframa] = useState<boolean>(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [isLoadingLastOrder, setIsLoadingLastOrder] = useState<boolean>(false);
  
  const { addOrder } = useOrders();
  const { user } = useAuth();

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
  
  // Added compatibility functions
  const updateItemDiscount = (productId: string, discount: number) => {
    // Placeholder - implement if needed
    console.log('updateItemDiscount called with', productId, discount);
  };
  
  const toggleDiscountOption = (discountId: string) => {
    // Placeholder - implement if needed
    console.log('toggleDiscountOption called with', discountId);
  };
  
  const isDiscountOptionSelected = (discountId: string) => {
    return appliedDiscounts.some(d => d.id === discountId);
  };
  
  const toggleApplyDiscounts = () => {
    setApplyDiscounts(!applyDiscounts);
  };
  
  const calculateTaxSubstitutionValue = () => {
    // Placeholder - implement if needed
    return 0;
  };
  
  const toggleIPI = () => {
    setWithIPI(!withIPI);
  };
  
  const calculateIPIValue = () => {
    // Placeholder - implement if needed
    return 0;
  };
  
  const calculateItemTaxSubstitutionValue = (item: CartItem) => {
    // Placeholder - implement if needed
    return 0;
  };
  
  const toggleSuframa = () => {
    setWithSuframa(!withSuframa);
  };
  
  const sendOrder = async () => {
    // Placeholder - implement if needed
    console.log('sendOrder called');
    return Promise.resolve();
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
    
    // Compatibility properties and functions
    items: cart,
    addItem: addToCart,
    removeItem: removeFromCart,
    updateItemQuantity: updateQuantity,
    updateItemDiscount,
    discountOptions: [], // Would need to be populated appropriately
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
    totalDiscount: 0, // Would need to be calculated appropriately
    total: getTotal(), // Would need to consider discounts
    sendOrder,
    deliveryFee: 0, // Would need to be calculated appropriately
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
