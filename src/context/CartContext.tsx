import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Product, CartItem, Customer, DiscountOption, Order } from '@/types/types';
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
