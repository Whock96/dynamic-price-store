import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, DiscountOption, Order, Customer, DeliveryFees } from '../types/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { isAdministrador } from '@/utils/permissionUtils';

interface CartOptions {
  shipping: 'delivery' | 'pickup';
  fullInvoice: boolean;
  taxSubstitution: boolean;
  paymentMethod: 'cash' | 'credit';
  paymentTerms?: string;
  notes?: string;
  deliveryLocation?: 'capital' | 'interior' | null;
  halfInvoiceType?: 'quantity' | 'price';
  halfInvoicePercentage?: number;
  discountOptions?: DiscountOption[];
  deliveryFee?: number;
  withIPI?: boolean;
  transportCompanyId?: string | null;
  transportCompanyName?: string;
  withSuframa?: boolean;
}

interface CartTotals {
  subtotal: number;
  totalDiscount: number;
  deliveryFee: number;
  taxSubstitutionTotal: number;
  ipiValue: number;
  productsTotal: number;
  total: number;
}

interface OrderContextType {
  cart: CartItem[];
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
  addToCart: (product: Product, quantity: number, discount?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  calculateTotals: (items: CartItem[], options: CartOptions) => CartTotals;
  saveOrder: (options: CartOptions) => Promise<Order | null>;
  deliveryFees: DeliveryFees;
  setDeliveryFees: (deliveryFees: DeliveryFees) => void;
  discountOptions: DiscountOption[];
  setDiscountOptions: (discountOptions: DiscountOption[]) => void;
  transportCompanies: any[];
  setTransportCompanies: (transportCompanies: any[]) => void;
  companyInfo: any;
  setCompanyInfo: (companyInfo: any) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [deliveryFees, setDeliveryFees] = useState<DeliveryFees>({ capital: 0, interior: 0 });
  const [discountOptions, setDiscountOptions] = useState<DiscountOption[]>([]);
  const [transportCompanies, setTransportCompanies] = useState<any[]>([]);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    const storedCart = localStorage.getItem('ferplas_cart');
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ferplas_cart', JSON.stringify(cart));
  }, [cart]);

  const handleAddToCart = (product: Product, quantity: number, discount: number = 0) => {
    if (quantity <= 0) {
      toast.error('A quantidade deve ser maior que zero.');
      return;
    }

    const existingItemIndex = cart.findIndex(item => item.productId === product.id);

    if (existingItemIndex !== -1) {
      const updatedCart = [...cart];
      const existingItem = updatedCart[existingItemIndex];

      // Substituir verificação de role
      if (user && isAdministrador(user.userTypeId)) {
        // Lógica para administrador
        const parsedQuantity = parseInt(String(quantity), 10);
          if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
              toast.error("Quantidade inválida. Por favor, insira um número maior que zero.");
              return;
          }
          
          const newQuantity = (existingItem.quantity || 0) + parsedQuantity;
          
          updatedCart[existingItemIndex] = {
              ...existingItem,
              quantity: newQuantity,
              totalUnits: product.quantityPerVolume ? newQuantity * product.quantityPerVolume : newQuantity,
              totalCubicVolume: product.cubicVolume ? newQuantity * product.cubicVolume : 0,
              totalWeight: product.weight ? newQuantity * product.weight : 0
          };
      } else {
        // Lógica para não administrador
        const parsedQuantity = parseInt(String(quantity), 10);
          if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
              toast.error("Quantidade inválida. Por favor, insira um número maior que zero.");
              return;
          }
          
          const newQuantity = (existingItem.quantity || 0) + parsedQuantity;
          
          if (product.quantity !== undefined && newQuantity > product.quantity) {
              toast.error(`Quantidade excede o estoque disponível (${product.quantity} unidades).`);
              return;
          }
          
          updatedCart[existingItemIndex] = {
              ...existingItem,
              quantity: newQuantity,
              totalUnits: product.quantityPerVolume ? newQuantity * product.quantityPerVolume : newQuantity,
              totalCubicVolume: product.cubicVolume ? newQuantity * product.cubicVolume : 0,
              totalWeight: product.weight ? newQuantity * product.weight : 0
          };
      }

      setCart(updatedCart);
      toast.success(`${quantity} ${product.name} adicionado(s) ao carrinho!`);
    } else {
      // Substituir verificação de role
      if (user && isAdministrador(user.userTypeId)) {
        // Lógica para administrador
        const parsedQuantity = parseInt(String(quantity), 10);
          if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
              toast.error("Quantidade inválida. Por favor, insira um número maior que zero.");
              return;
          }
          
          const newItem: CartItem = {
              id: uuidv4(),
              productId: product.id,
              product: product,
              quantity: parsedQuantity,
              discount: discount,
              finalPrice: product.listPrice,
              subtotal: product.listPrice * parsedQuantity,
              totalUnits: product.quantityPerVolume ? parsedQuantity * product.quantityPerVolume : parsedQuantity,
              unitPrice: product.listPrice,
              totalCubicVolume: product.cubicVolume ? parsedQuantity * product.cubicVolume : 0,
              totalWeight: product.weight ? parsedQuantity * product.weight : 0
          };
          
          setCart([...cart, newItem]);
          toast.success(`${quantity} ${product.name} adicionado(s) ao carrinho!`);
      } else {
        // Lógica para não administrador
        const parsedQuantity = parseInt(String(quantity), 10);
          if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
              toast.error("Quantidade inválida. Por favor, insira um número maior que zero.");
              return;
          }
          
          if (product.quantity !== undefined && quantity > product.quantity) {
              toast.error(`Quantidade excede o estoque disponível (${product.quantity} unidades).`);
              return;
          }
          
          const newItem: CartItem = {
              id: uuidv4(),
              productId: product.id,
              product: product,
              quantity: parsedQuantity,
              discount: discount,
              finalPrice: product.listPrice,
              subtotal: product.listPrice * parsedQuantity,
              totalUnits: product.quantityPerVolume ? parsedQuantity * product.quantityPerVolume : parsedQuantity,
              unitPrice: product.listPrice,
              totalCubicVolume: product.cubicVolume ? parsedQuantity * product.cubicVolume : 0,
              totalWeight: product.weight ? parsedQuantity * product.weight : 0
          };
          
          setCart([...cart, newItem]);
          toast.success(`${quantity} ${product.name} adicionado(s) ao carrinho!`);
      }
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
    toast.success('Item removido do carrinho.');
  };

  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const updatedCart = cart.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity: quantity,
          subtotal: item.finalPrice * quantity
        };
      }
      return item;
    });

    setCart(updatedCart);
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('ferplas_cart');
    toast.success('Carrinho limpo!');
  };

  const calculateTotals = (items: CartItem[], options: CartOptions): CartTotals => {
    let subtotal = 0;
    let totalDiscount = 0;
    let deliveryFee = options.deliveryFee || 0;
    let taxSubstitutionTotal = 0;
    let ipiValue = 0;
    let productsTotal = 0;

    items.forEach(item => {
      productsTotal += item.product.listPrice * item.quantity;

      const itemDiscount = (item.product.listPrice * item.quantity) * (item.discount / 100);
      totalDiscount += itemDiscount;

      let finalPrice = item.product.listPrice - (item.product.listPrice * (item.discount / 100));
      item.finalPrice = finalPrice;

      let taxSubstitutionValue = 0;
      if (options.taxSubstitution) {
        const mva = item.product.mva || 0;
        taxSubstitutionValue = (finalPrice * mva / 100) * item.quantity;
        taxSubstitutionTotal += taxSubstitutionValue;
      }
      item.taxSubstitutionValue = taxSubstitutionValue;

      let ipiItemValue = 0;
      if (options.withIPI) {
        // Substituir verificação de role
        if (user && isAdministrador(user.userTypeId)) {
          ipiItemValue = 0;
        } else {
          ipiItemValue = 0;
        }
        ipiValue += ipiItemValue;
      }
      item.ipiValue = ipiItemValue;

      subtotal += (finalPrice + taxSubstitutionValue + ipiItemValue) * item.quantity;
      item.subtotal = (finalPrice + taxSubstitutionValue + ipiItemValue) * item.quantity;
    });

    const total = subtotal + deliveryFee;

    return {
      subtotal,
      totalDiscount,
      deliveryFee,
      taxSubstitutionTotal,
      ipiValue,
      productsTotal,
      total
    };
  };

  const saveOrder = async (options: CartOptions): Promise<Order | null> => {
    if (!customer) {
      toast.error('Por favor, selecione um cliente antes de salvar o pedido.');
      return null;
    }

    if (cart.length === 0) {
      toast.error('O carrinho está vazio. Adicione produtos antes de salvar o pedido.');
      return null;
    }

    const { subtotal, totalDiscount, deliveryFee, taxSubstitutionTotal, ipiValue, productsTotal, total } = calculateTotals(cart, options);

    const orderData = {
      customerId: customer.id,
      userId: user?.id,
      items: cart,
      appliedDiscounts: options.discountOptions || [],
      totalDiscount: totalDiscount,
      subtotal: subtotal,
      total: total,
      status: 'pending',
      shipping: options.shipping,
      fullInvoice: options.fullInvoice,
      taxSubstitution: options.taxSubstitution,
      paymentMethod: options.paymentMethod,
      paymentTerms: options.paymentTerms,
      notes: options.notes,
      observations: options.notes,
      deliveryLocation: options.deliveryLocation,
      halfInvoiceType: options.halfInvoiceType,
      halfInvoicePercentage: options.halfInvoicePercentage,
      deliveryFee: deliveryFee,
      withIPI: options.withIPI,
      ipiValue: ipiValue,
      transportCompanyId: options.transportCompanyId,
      transportCompanyName: options.transportCompanyName,
      productsTotal: productsTotal,
      taxSubstitutionTotal: taxSubstitutionTotal,
      withSuframa: options.withSuframa
    };

    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      clearCart();
      toast.success('Pedido salvo com sucesso!');
      return data as Order;
    } catch (error: any) {
      toast.error(`Erro ao salvar o pedido: ${error.message}`);
      return null;
    }
  };

  return (
    <OrderContext.Provider value={{
      cart,
      customer,
      setCustomer,
      addToCart,
      removeFromCart,
      updateCartItemQuantity,
      clearCart,
      calculateTotals,
      saveOrder,
      deliveryFees,
      setDeliveryFees,
      discountOptions,
      setDiscountOptions,
      transportCompanies,
      setTransportCompanies,
      companyInfo,
      setCompanyInfo
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder deve ser usado dentro de um OrderProvider');
  }
  return context;
};
