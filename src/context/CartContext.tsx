
import React, { createContext, useContext } from 'react';

interface CartContextType {
  items: any[];
  customer: any;
  setCustomer: (customer: any) => void;
  addItem: (product: any, quantity: number) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  updateItemDiscount: (id: string, discount: number) => void;
  discountOptions: any[];
  toggleDiscountOption: (id: string) => void;
  isDiscountOptionSelected: (id: string) => boolean;
  deliveryLocation: string | null;
  setDeliveryLocation: (location: any) => void;
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
  sendOrder: () => Promise<any>;
  clearCart: () => void;
  deliveryFee: number;
  applyDiscounts: boolean;
  toggleApplyDiscounts: () => void;
  paymentTerms: string;
  setPaymentTerms: (terms: string) => void;
  calculateTaxSubstitutionValue: () => number;
  calculateItemTaxSubstitutionValue: (item: any) => number;
  withIPI: boolean;
  toggleIPI: () => void;
  calculateIPIValue: () => number;
  transportCompanyId: string | undefined;
  setTransportCompanyId: (id: string | undefined) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cartValue: CartContextType = {
    items: [],
    customer: null,
    setCustomer: () => {},
    addItem: () => {},
    removeItem: () => {},
    updateItemQuantity: () => {},
    updateItemDiscount: () => {},
    discountOptions: [],
    toggleDiscountOption: () => {},
    isDiscountOptionSelected: () => false,
    deliveryLocation: null,
    setDeliveryLocation: () => {},
    halfInvoicePercentage: 50,
    setHalfInvoicePercentage: () => {},
    halfInvoiceType: 'quantity',
    setHalfInvoiceType: () => {},
    observations: '',
    setObservations: () => {},
    totalItems: 0,
    subtotal: 0,
    totalDiscount: 0,
    total: 0,
    sendOrder: async () => null,
    clearCart: () => {},
    deliveryFee: 0,
    applyDiscounts: true,
    toggleApplyDiscounts: () => {},
    paymentTerms: '',
    setPaymentTerms: () => {},
    calculateTaxSubstitutionValue: () => 0,
    calculateItemTaxSubstitutionValue: () => 0,
    withIPI: false,
    toggleIPI: () => {},
    calculateIPIValue: () => 0,
    transportCompanyId: undefined,
    setTransportCompanyId: () => {},
  };

  return (
    <CartContext.Provider value={cartValue}>
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
