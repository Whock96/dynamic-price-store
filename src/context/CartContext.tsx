import React, { createContext, useContext, useReducer, useState, useEffect } from 'react';
import { Customer, Product, CartItem, DiscountOption, Order } from '@/types/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useOrders } from './OrderContext';
import { useDiscountSettings } from '@/hooks/use-discount-settings';
import { useTransportCompanies } from './TransportCompanyContext';

export interface CartState {
  items: CartItem[];
  customer: Customer | null;
  discountOptions: DiscountOption[];
  selectedDiscountOptions: string[];
  deliveryLocation: 'capital' | 'interior' | null;
  halfInvoicePercentage: number;
  halfInvoiceType: 'quantity' | 'price';
  observations: string;
  paymentTerms: string;
  deliveryFee: number;
  applyDiscounts: boolean;
  withIPI: boolean;
  ipiValue: number;
  transportCompanyId: string | null;
}

export interface CartContextType {
  items: CartItem[];
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  updateItemDiscount: (itemId: string, discount: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  totalDiscount: number;
  total: number;
  discountOptions: DiscountOption[];
  selectedDiscountOptions: string[];
  toggleDiscountOption: (optionId: string) => void;
  isDiscountOptionSelected: (optionId: string) => boolean;
  deliveryLocation: 'capital' | 'interior' | null;
  setDeliveryLocation: (location: 'capital' | 'interior' | null) => void;
  halfInvoicePercentage: number;
  setHalfInvoicePercentage: (percentage: number) => void;
  halfInvoiceType: 'quantity' | 'price';
  setHalfInvoiceType: (type: 'quantity' | 'price') => void;
  observations: string;
  setObservations: (text: string) => void;
  paymentTerms: string;
  setPaymentTerms: (terms: string) => void;
  deliveryFee: number;
  sendOrder: () => Promise<Order | null>;
  applyDiscounts: boolean;
  toggleApplyDiscounts: () => void;
  calculateTaxSubstitutionValue: () => number;
  calculateItemTaxSubstitutionValue: (item: CartItem) => number;
  withIPI: boolean;
  toggleIPI: () => void;
  calculateIPIValue: () => number;
  transportCompanyId: string | null;
  setTransportCompanyId: (id: string | null) => void;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_ITEM_QUANTITY'; payload: { itemId: string; quantity: number } }
  | { type: 'UPDATE_ITEM_DISCOUNT'; payload: { itemId: string; discount: number } }
  | { type: 'SET_CUSTOMER'; payload: Customer | null }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_DISCOUNT_OPTIONS'; payload: DiscountOption[] }
  | { type: 'TOGGLE_DISCOUNT_OPTION'; payload: string }
  | { type: 'SET_DELIVERY_LOCATION'; payload: 'capital' | 'interior' | null }
  | { type: 'SET_HALF_INVOICE_PERCENTAGE'; payload: number }
  | { type: 'SET_HALF_INVOICE_TYPE'; payload: 'quantity' | 'price' }
  | { type: 'SET_OBSERVATIONS'; payload: string }
  | { type: 'SET_PAYMENT_TERMS'; payload: string }
  | { type: 'SET_DELIVERY_FEE'; payload: number }
  | { type: 'TOGGLE_APPLY_DISCOUNTS' }
  | { type: 'SET_WITH_IPI'; payload: boolean }
  | { type: 'SET_IPI_VALUE'; payload: number }
  | { type: 'SET_TRANSPORT_COMPANY_ID'; payload: string | null };

const initialState: CartState = {
  items: [],
  customer: null,
  discountOptions: [],
  selectedDiscountOptions: [],
  deliveryLocation: null,
  halfInvoicePercentage: 50,
  halfInvoiceType: 'quantity',
  observations: '',
  paymentTerms: '',
  deliveryFee: 0,
  applyDiscounts: true,
  withIPI: false,
  ipiValue: 0,
  transportCompanyId: null
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity } = action.payload;
      const existingItemIndex = state.items.findIndex(item => item.productId === product.id);

      if (existingItemIndex >= 0) {
        // Item already exists, update quantity
        const updatedItems = [...state.items];
        const existingItem = updatedItems[existingItemIndex];
        
        // Calculate the new quantity
        const newQuantity = existingItem.quantity + quantity;
        
        // Calculate the new subtotal
        const finalPrice = product.listPrice * (1 - existingItem.discount / 100);
        const subtotal = finalPrice * newQuantity;
        
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          subtotal
        };
        
        return { ...state, items: updatedItems };
      } else {
        // Add new item
        const discount = state.customer?.defaultDiscount || 0;
        const finalPrice = product.listPrice * (1 - discount / 100);
        const subtotal = finalPrice * quantity;
        
        const newItem: CartItem = {
          id: uuidv4(),
          productId: product.id,
          product,
          quantity,
          discount,
          finalPrice,
          subtotal
        };
        
        return { ...state, items: [...state.items, newItem] };
      }
    }
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };
      
    case 'UPDATE_ITEM_QUANTITY': {
      const { itemId, quantity } = action.payload;
      
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== itemId)
        };
      }
      
      return {
        ...state,
        items: state.items.map(item => {
          if (item.id === itemId) {
            const finalPrice = item.product.listPrice * (1 - item.discount / 100);
            return {
              ...item,
              quantity,
              subtotal: finalPrice * quantity
            };
          }
          return item;
        })
      };
    }
    
    case 'UPDATE_ITEM_DISCOUNT': {
      const { itemId, discount } = action.payload;
      
      return {
        ...state,
        items: state.items.map(item => {
          if (item.id === itemId) {
            const finalPrice = item.product.listPrice * (1 - discount / 100);
            return {
              ...item,
              discount,
              finalPrice,
              subtotal: finalPrice * item.quantity
            };
          }
          return item;
        })
      };
    }
    
    case 'SET_CUSTOMER':
      return {
        ...state,
        customer: action.payload
      };
      
    case 'CLEAR_CART':
      return {
        ...initialState,
        discountOptions: state.discountOptions
      };
      
    case 'SET_DISCOUNT_OPTIONS':
      return {
        ...state,
        discountOptions: action.payload
      };
      
    case 'TOGGLE_DISCOUNT_OPTION': {
      const optionId = action.payload;
      const isSelected = state.selectedDiscountOptions.includes(optionId);
      
      if (isSelected) {
        return {
          ...state,
          selectedDiscountOptions: state.selectedDiscountOptions.filter(id => id !== optionId)
        };
      } else {
        return {
          ...state,
          selectedDiscountOptions: [...state.selectedDiscountOptions, optionId]
        };
      }
    }
    
    case 'SET_DELIVERY_LOCATION':
      return {
        ...state,
        deliveryLocation: action.payload
      };
      
    case 'SET_HALF_INVOICE_PERCENTAGE':
      return {
        ...state,
        halfInvoicePercentage: action.payload
      };
      
    case 'SET_HALF_INVOICE_TYPE':
      return {
        ...state,
        halfInvoiceType: action.payload
      };
      
    case 'SET_OBSERVATIONS':
      return {
        ...state,
        observations: action.payload
      };
      
    case 'SET_PAYMENT_TERMS':
      return {
        ...state,
        paymentTerms: action.payload
      };
      
    case 'SET_DELIVERY_FEE':
      return {
        ...state,
        deliveryFee: action.payload
      };
      
    case 'TOGGLE_APPLY_DISCOUNTS':
      return {
        ...state,
        applyDiscounts: !state.applyDiscounts
      };
      
    case 'SET_WITH_IPI':
      return {
        ...state,
        withIPI: action.payload
      };
      
    case 'SET_IPI_VALUE':
      return {
        ...state,
        ipiValue: action.payload
      };
      
    case 'SET_TRANSPORT_COMPANY_ID':
      return {
        ...state,
        transportCompanyId: action.payload
      };
      
    default:
      return state;
  }
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { settings } = useDiscountSettings();
  const { addOrder } = useOrders();
  const auth = useAuth();
  const { transportCompanies } = useTransportCompanies();
  
  // Load discount options from settings
  useEffect(() => {
    if (settings && settings.discountOptions) {
      dispatch({ type: 'SET_DISCOUNT_OPTIONS', payload: settings.discountOptions });
    }
  }, [settings]);
  
  // Calculate delivery fee when location changes
  useEffect(() => {
    if (state.deliveryLocation && settings) {
      const fee = state.deliveryLocation === 'capital' 
        ? settings.deliveryFees.capital 
        : settings.deliveryFees.interior;
      
      dispatch({ type: 'SET_DELIVERY_FEE', payload: fee });
    } else {
      dispatch({ type: 'SET_DELIVERY_FEE', payload: 0 });
    }
  }, [state.deliveryLocation, settings]);
  
  // Update the setCustomer function to also set the default transport company
  const setCustomer = (selectedCustomer: Customer | null) => {
    dispatch({ type: 'SET_CUSTOMER', payload: selectedCustomer });
    
    // If customer has a default transport company, set it
    if (selectedCustomer?.transportCompanyId) {
      setTransportCompanyId(selectedCustomer.transportCompanyId);
    } else {
      setTransportCompanyId(null);
    }
  };
  
  const addItem = (product: Product, quantity: number) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } });
  };
  
  const removeItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
  };
  
  const updateItemQuantity = (itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_ITEM_QUANTITY', payload: { itemId, quantity } });
  };
  
  const updateItemDiscount = (itemId: string, discount: number) => {
    dispatch({ type: 'UPDATE_ITEM_DISCOUNT', payload: { itemId, discount } });
  };
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };
  
  const toggleDiscountOption = (optionId: string) => {
    dispatch({ type: 'TOGGLE_DISCOUNT_OPTION', payload: optionId });
  };
  
  const isDiscountOptionSelected = (optionId: string) => {
    return state.selectedDiscountOptions.includes(optionId);
  };
  
  const setDeliveryLocation = (location: 'capital' | 'interior' | null) => {
    dispatch({ type: 'SET_DELIVERY_LOCATION', payload: location });
  };
  
  const setHalfInvoicePercentage = (percentage: number) => {
    dispatch({ type: 'SET_HALF_INVOICE_PERCENTAGE', payload: percentage });
  };
  
  const setHalfInvoiceType = (type: 'quantity' | 'price') => {
    dispatch({ type: 'SET_HALF_INVOICE_TYPE', payload: type });
  };
  
  const setObservations = (text: string) => {
    dispatch({ type: 'SET_OBSERVATIONS', payload: text });
  };
  
  const setPaymentTerms = (terms: string) => {
    dispatch({ type: 'SET_PAYMENT_TERMS', payload: terms });
  };
  
  const toggleApplyDiscounts = () => {
    dispatch({ type: 'TOGGLE_APPLY_DISCOUNTS' });
  };
  
  const toggleIPI = () => {
    dispatch({ type: 'SET_WITH_IPI', payload: !state.withIPI });
  };
  
  const setTransportCompanyId = (id: string | null) => {
    dispatch({ type: 'SET_TRANSPORT_COMPANY_ID', payload: id });
  };
  
  // Calculate subtotal (before discounts)
  const calculateSubtotal = () => {
    return state.items.reduce((total, item) => {
      return total + (item.product.listPrice * item.quantity);
    }, 0);
  };
  
  // Calculate total discount amount
  const calculateTotalDiscount = () => {
    // Base discount from items
    const itemDiscounts = state.items.reduce((total, item) => {
      const fullPrice = item.product.listPrice * item.quantity;
      const discountedPrice = item.finalPrice * item.quantity;
      return total + (fullPrice - discountedPrice);
    }, 0);
    
    // Additional discounts from selected options
    let additionalDiscount = 0;
    
    if (state.applyDiscounts) {
      const subtotal = calculateSubtotal() - itemDiscounts;
      
      state.selectedDiscountOptions.forEach(optionId => {
        const option = state.discountOptions.find(opt => opt.id === optionId);
        if (option) {
          if (option.type === 'discount') {
            additionalDiscount += subtotal * (option.value / 100);
          }
        }
      });
    }
    
    return itemDiscounts + additionalDiscount;
  };
  
  // Calculate tax substitution value
  const calculateTaxSubstitutionValue = () => {
    if (!state.applyDiscounts || !isDiscountOptionSelected('3')) {
      return 0;
    }
    
    const taxOption = state.discountOptions.find(opt => opt.id === '3');
    if (!taxOption) return 0;
    
    // Calculate base for tax
    const subtotal = calculateSubtotal();
    const totalDiscount = calculateTotalDiscount();
    const baseForTax = subtotal - totalDiscount;
    
    // Apply half invoice adjustment if needed
    let effectiveTaxRate = taxOption.value;
    if (isDiscountOptionSelected('2')) {
      effectiveTaxRate = effectiveTaxRate * (state.halfInvoicePercentage / 100);
    }
    
    return baseForTax * (effectiveTaxRate / 100);
  };
  
  // Calculate tax substitution value for a specific item
  const calculateItemTaxSubstitutionValue = (item: CartItem) => {
    if (!state.applyDiscounts || !isDiscountOptionSelected('3')) {
      return 0;
    }
    
    const taxOption = state.discountOptions.find(opt => opt.id === '3');
    if (!taxOption) return 0;
    
    // Calculate base for tax
    const itemSubtotal = item.finalPrice * item.quantity;
    
    // Apply half invoice adjustment if needed
    let effectiveTaxRate = taxOption.value;
    if (isDiscountOptionSelected('2')) {
      effectiveTaxRate = effectiveTaxRate * (state.halfInvoicePercentage / 100);
    }
    
    return itemSubtotal * (effectiveTaxRate / 100);
  };
  
  // Calculate IPI value
  const calculateIPIValue = () => {
    if (!state.applyDiscounts || !state.withIPI || !settings) {
      return 0;
    }
    
    // Calculate base for IPI
    const subtotal = calculateSubtotal();
    const totalDiscount = calculateTotalDiscount();
    const baseForIPI = subtotal - totalDiscount;
    
    // Apply half invoice adjustment if needed
    let effectiveIPIRate = settings.ipiRate || 10;
    if (isDiscountOptionSelected('2')) {
      effectiveIPIRate = effectiveIPIRate * (state.halfInvoicePercentage / 100);
    }
    
    const ipiValue = baseForIPI * (effectiveIPIRate / 100);
    dispatch({ type: 'SET_IPI_VALUE', payload: ipiValue });
    
    return ipiValue;
  };
  
  // Calculate total (after discounts and taxes)
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const totalDiscount = calculateTotalDiscount();
    const taxSubstitution = calculateTaxSubstitutionValue();
    const ipiValue = calculateIPIValue();
    
    return subtotal - totalDiscount + taxSubstitution + ipiValue + state.deliveryFee;
  };
  
  // Send order to backend
  const sendOrder = async () => {
    if (!state.customer) return null;
    
    try {
      const orderItems = state.items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        discount: item.discount,
        final_price: item.finalPrice,
        subtotal: item.subtotal
      }));
      
      const discountIds = state.discountOptions
        .filter(option => state.selectedDiscountOptions.includes(option.id))
        .map(option => option.id);

      // Calculate totals
      const subtotal = calculateSubtotal();
      const totalDiscount = calculateTotalDiscount();
      const total = calculateTotal();
      
      // Prepare order data
      const orderData = {
        customer_id: state.customer.id,
        user_id: auth.user?.id,
        items: orderItems,
        discount_ids: discountIds,
        subtotal,
        total_discount: totalDiscount,
        total,
        status: 'pending',
        shipping: state.selectedDiscountOptions.includes('1') ? 'pickup' : 'delivery',
        payment_method: state.selectedDiscountOptions.includes('4') ? 'cash' : 'credit',
        payment_terms: state.paymentTerms,
        full_invoice: !state.selectedDiscountOptions.includes('2'),
        half_invoice_percentage: state.halfInvoicePercentage,
        half_invoice_type: state.halfInvoiceType,
        tax_substitution: state.selectedDiscountOptions.includes('3'),
        notes: '',
        observations: state.observations,
        delivery_location: state.deliveryLocation,
        delivery_fee: state.deliveryFee,
        with_ipi: state.withIPI,
        ipi_value: state.ipiValue,
        transport_company_id: state.transportCompanyId || null  // Include transport company ID
      };
      
      // Create new order
      const newOrderId = await addOrder({
        customerId: state.customer.id,
        customer: state.customer,
        userId: auth.user?.id || '',
        user: auth.user || { id: '', name: '', username: '', role: 'administrator', permissions: [], email: '', createdAt: new Date(), userTypeId: '' },
        items: state.items,
        appliedDiscounts: state.discountOptions.filter(option => state.selectedDiscountOptions.includes(option.id)),
        subtotal,
        totalDiscount,
        total,
        status: 'pending',
        shipping: state.selectedDiscountOptions.includes('1') ? 'pickup' : 'delivery',
        paymentMethod: state.selectedDiscountOptions.includes('4') ? 'cash' : 'credit',
        paymentTerms: state.paymentTerms,
        fullInvoice: !state.selectedDiscountOptions.includes('2'),
        halfInvoicePercentage: state.halfInvoicePercentage,
        halfInvoiceType: state.halfInvoiceType,
        taxSubstitution: state.selectedDiscountOptions.includes('3'),
        notes: '',
        observations: state.observations,
        deliveryLocation: state.deliveryLocation,
        deliveryFee: state.deliveryFee,
        withIPI: state.withIPI,
        ipiValue: state.ipiValue,
        transportCompanyId: state.transportCompanyId
      });
      
      if (newOrderId) {
        // Clear cart after successful order
        clearCart();
        
        // Return the new order
        const newOrder: Order = {
          id: newOrderId,
          customerId: state.customer.id,
          customer: state.customer,
          userId: auth.user?.id || '',
          user: auth.user || { id: '', name: '', username: '', role: 'administrator', permissions: [], email: '', createdAt: new Date(), userTypeId: '' },
          items: state.items,
          appliedDiscounts: state.discountOptions.filter(option => state.selectedDiscountOptions.includes(option.id)),
          subtotal,
          totalDiscount,
          total,
          status: 'pending',
          shipping: state.selectedDiscountOptions.includes('1') ? 'pickup' : 'delivery',
          paymentMethod: state.selectedDiscountOptions.includes('4') ? 'cash' : 'credit',
          paymentTerms: state.paymentTerms,
          fullInvoice: !state.selectedDiscountOptions.includes('2'),
          taxSubstitution: state.selectedDiscountOptions.includes('3'),
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          observations: state.observations,
          deliveryLocation: state.deliveryLocation,
          halfInvoicePercentage: state.halfInvoicePercentage,
          halfInvoiceType: state.halfInvoiceType,
          deliveryFee: state.deliveryFee,
          withIPI: state.withIPI,
          ipiValue: state.ipiValue,
          transportCompanyId: state.transportCompanyId
        };
        
        return newOrder;
      }
      
      return null;
    } catch (error) {
      console.error('Error sending order:', error);
      toast.error('Erro ao enviar pedido');
      return null;
    }
  };
  
  return (
    <CartContext.Provider
      value={{
        items: state.items,
        customer: state.customer,
        setCustomer,
        addItem,
        removeItem,
        updateItemQuantity,
        updateItemDiscount,
        clearCart,
        totalItems: state.items.reduce((total, item) => total + item.quantity, 0),
        subtotal: calculateSubtotal(),
        totalDiscount: calculateTotalDiscount(),
        total: calculateTotal(),
        discountOptions: state.discountOptions,
        selectedDiscountOptions: state.selectedDiscountOptions,
        toggleDiscountOption,
        isDiscountOptionSelected,
        deliveryLocation: state.deliveryLocation,
        setDeliveryLocation,
        halfInvoicePercentage: state.halfInvoicePercentage,
        setHalfInvoicePercentage,
        halfInvoiceType: state.halfInvoiceType,
        setHalfInvoiceType,
        observations: state.observations,
        setObservations,
        paymentTerms: state.paymentTerms,
        setPaymentTerms,
        deliveryFee: state.deliveryFee,
        sendOrder,
        applyDiscounts: state.applyDiscounts,
        toggleApplyDiscounts,
        calculateTaxSubstitutionValue,
        calculateItemTaxSubstitutionValue,
        withIPI: state.withIPI,
        toggleIPI,
        calculateIPIValue,
        transportCompanyId: state.transportCompanyId,
        setTransportCompanyId,
      }}
    >
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
