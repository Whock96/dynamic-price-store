
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useDiscountSettings } from '@/hooks/use-discount-settings';
import { CartItem, Product, Customer } from '@/types/types';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Define o tipo do contexto do carrinho
interface CartContextType {
  items: CartItem[];
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
  addItem: (product: Product, quantity: number, discount?: number) => void;
  removeItem: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  updateItemDiscount: (productId: string, discount: number) => void;
  clearCart: () => void;
  subtotal: number;
  total: number;
  totalItems: number;
  totalUnits: number;
  applyDiscounts: boolean;
  setApplyDiscounts: (apply: boolean) => void;
  selectedDiscounts: string[];
  toggleDiscount: (id: string) => void;
  isDiscountOptionSelected: (id: string) => boolean;
  totalDiscount: number;
  taxSubstitutionValue: number;
  ipiValue: number;
  deliveryFee: number;
  setDeliveryFee: (fee: number) => void;
  shipping: 'delivery' | 'pickup';
  setShipping: (type: 'delivery' | 'pickup') => void;
  deliveryLocation: 'capital' | 'interior' | null;
  setDeliveryLocation: (location: 'capital' | 'interior' | null) => void;
  notes: string;
  setNotes: (notes: string) => void;
  fullInvoice: boolean; 
  setFullInvoice: (fullInvoice: boolean) => void;
  halfInvoicePercentage: number;
  setHalfInvoicePercentage: (percentage: number) => void;
  taxSubstitution: boolean;
  setTaxSubstitution: (taxSubstitution: boolean) => void;
  withIPI: boolean;
  setWithIPI: (withIPI: boolean) => void;
  paymentMethod: 'cash' | 'credit';
  setPaymentMethod: (method: 'cash' | 'credit') => void;
  paymentTerms: string;
  setPaymentTerms: (terms: string) => void;
  finalizeOrder: () => Promise<boolean>;
  isSubmitting: boolean;
  observations: string;
  setObservations: (observations: string) => void;
  // Add these to match Cart.tsx usage
  toggleApplyDiscounts: (value: boolean) => void;
  halfInvoiceType: 'quantity' | 'price';
  setHalfInvoiceType: (type: 'quantity' | 'price') => void;
  toggleIPI: (value: boolean) => void;
}

// Criando o contexto
export const CartContext = createContext<CartContextType | undefined>(undefined);

// Provedor de contexto do carrinho
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [applyDiscounts, setApplyDiscounts] = useState(true);
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [shipping, setShipping] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryLocation, setDeliveryLocation] = useState<'capital' | 'interior' | null>(null);
  const [notes, setNotes] = useState('');
  const [observations, setObservations] = useState('');
  const [fullInvoice, setFullInvoice] = useState(true);
  const [halfInvoicePercentage, setHalfInvoicePercentage] = useState(50);
  const [halfInvoiceType, setHalfInvoiceType] = useState<'quantity' | 'price'>('quantity');
  const [taxSubstitution, setTaxSubstitution] = useState(false);
  const [withIPI, setWithIPI] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { settings } = useDiscountSettings();

  const calculateTotalUnits = (item: CartItem) => {
    const quantityPerVolume = item.product.quantityPerVolume || 1;
    return item.quantity * quantityPerVolume;
  };

  // Calcula o subtotal de todos os itens
  const calculateSubtotal = () => {
    return items.reduce((total, item) => {
      const totalUnits = calculateTotalUnits(item);
      return total + (item.finalPrice * totalUnits);
    }, 0);
  };
  
  const subtotal = calculateSubtotal();

  // Verifica se uma opção de desconto está selecionada
  const isDiscountOptionSelected = (id: string) => {
    return selectedDiscounts.includes(id);
  };

  // Alterna uma opção de desconto
  const toggleDiscount = (id: string) => {
    setSelectedDiscounts(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Calcula o valor total de desconto
  const calculateTotalDiscount = () => {
    if (!applyDiscounts) return 0;
    
    let discountAmount = 0;
    
    // Aplica os descontos selecionados
    selectedDiscounts.forEach(id => {
      // Here we need to check for settings.pickup, settings.cashPayment, etc.
      // instead of using find() which is not available on DiscountSettings type
      if (id === '1' && settings) { // Pickup discount
        discountAmount += subtotal * (settings.pickup / 100);
      } else if (id === '4' && settings) { // Cash payment discount
        discountAmount += subtotal * (settings.cashPayment / 100);
      } else if (id === '2' && settings) { // Half invoice discount
        discountAmount += subtotal * (settings.halfInvoice / 100);
      }
    });
    
    // Limitamos o desconto para não ultrapassar o subtotal
    return Math.min(discountAmount, subtotal);
  };
  
  const totalDiscount = calculateTotalDiscount();
  
  // Calcula a substituição tributária
  const calculateTaxSubstitutionValue = () => {
    // Apenas se a opção de substituição tributária estiver ativada
    if (!taxSubstitution) return 0;
    
    // Verifica se o desconto de substituição tributária está selecionado
    if (!isDiscountOptionSelected('3') || !applyDiscounts || !settings) return 0;
    
    return items.reduce((total, item) => {
      const unitTaxValue = calculateItemTaxSubstitutionValue(item);
      const totalUnits = calculateTotalUnits(item);
      return total + (unitTaxValue * totalUnits);
    }, 0);
  };

  // Calcula a substituição tributária para um item
  const calculateItemTaxSubstitutionValue = (item: CartItem) => {
    // Apenas se a opção de substituição tributária estiver ativada
    if (!taxSubstitution) return 0;
    
    if (!isDiscountOptionSelected('3') || !applyDiscounts || !settings) return 0;
    
    const icmsStRate = settings.taxSubstitution / 100;
    const mva = (item.product.mva ?? 39) / 100;
    const basePrice = item.finalPrice;
    
    let taxValue = basePrice * mva * icmsStRate;
    
    if (!fullInvoice && halfInvoicePercentage > 0) {
      taxValue = taxValue * (halfInvoicePercentage / 100);
    }
    
    return taxValue;
  };

  const calculateIPIValue = () => {
    if (!withIPI || !applyDiscounts || !settings) return 0;
    
    if (!isDiscountOptionSelected('4')) return 0;
    
    // IPI é calculado sobre o subtotal
    return subtotal * (settings.ipiRate / 100);
  };
  
  const taxSubstitutionValue = calculateTaxSubstitutionValue();
  const ipiValue = calculateIPIValue();
  
  // Calcula o total geral
  const total = subtotal - totalDiscount + taxSubstitutionValue + ipiValue + deliveryFee;
  
  // Total de itens no carrinho
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  
  // Total de unidades (considera quantidade por volume)
  const totalUnits = items.reduce((acc, item) => {
    const quantityPerVolume = item.product.quantityPerVolume || 1;
    return acc + (item.quantity * quantityPerVolume);
  }, 0);
  
  // Recalcula o carrinho (aplicando descontos selecionados)
  const recalculateCart = () => {
    setItems(prevItems => prevItems.map(item => {
      const discount = item.discount;
      const originalPrice = item.product.listPrice;
      const finalPrice = originalPrice * (1 - discount / 100);
      
      return {
        ...item,
        finalPrice,
      };
    }));
  };
  
  // Monitora mudanças nas opções de desconto selecionadas
  useEffect(() => {
    recalculateCart();
  }, [selectedDiscounts, applyDiscounts, taxSubstitution, fullInvoice, halfInvoicePercentage, withIPI]);
  
  // Toggle apply discounts function for Cart.tsx compatibility
  const toggleApplyDiscounts = (value: boolean) => {
    setApplyDiscounts(value);
  };
  
  // Toggle IPI function for Cart.tsx compatibility
  const toggleIPI = (value: boolean) => {
    setWithIPI(value);
  };

  // Adiciona um item ao carrinho
  const addItem = (product: Product, quantity: number, discount = 0) => {
    // Verifica se o produto já existe no carrinho
    const existingItem = items.find(item => item.product.id === product.id);
    
    if (existingItem) {
      // Se já existe, atualiza a quantidade
      updateItemQuantity(product.id, existingItem.quantity + quantity);
      toast.success(`${product.name} - Quantidade atualizada para ${existingItem.quantity + quantity}`);
    } else {
      // Se não existe, adiciona novo item
      const finalPrice = product.listPrice * (1 - discount / 100);
      
      // Adiciona o novo item
      setItems([
        ...items, 
        {
          id: product.id, // Ensure id exists for CartItem
          product,
          quantity,
          discount,
          finalPrice,
          subtotal: finalPrice * (product.quantityPerVolume || 1) * quantity
        }
      ]);
      
      toast.success(`${quantity} ${product.name} adicionado ao carrinho`);
    }
  };
  
  // Remove um item do carrinho
  const removeItem = (productId: string) => {
    setItems(items.filter(item => item.product.id !== productId));
    toast.info('Produto removido do carrinho');
  };
  
  // Atualiza a quantidade de um item
  const updateItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }
    
    setItems(prevItems => prevItems.map(item => {
      if (item.product.id !== productId) {
        return item;
      }
      
      // Atualiza a quantidade e o subtotal
      const finalPrice = item.product.listPrice * (1 - item.discount / 100);
      const totalUnits = newQuantity * (item.product.quantityPerVolume || 1);
      
      return {
        ...item,
        quantity: newQuantity,
        finalPrice,
        subtotal: finalPrice * totalUnits
      };
    }));
  };
  
  // Atualiza o desconto de um item
  const updateItemDiscount = (productId: string, discount: number) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.product.id !== productId) {
        return item;
      }
      
      // Limita o desconto entre 0 e 100%
      const appliedDiscount = Math.min(Math.max(discount, 0), 100);
      
      // Recalcula o preço final e subtotal
      const finalPrice = item.product.listPrice * (1 - appliedDiscount / 100);
      const totalUnits = calculateTotalUnits(item);
      
      return {
        ...item,
        discount: appliedDiscount,
        finalPrice,
        subtotal: finalPrice * totalUnits
      };
    }));
  };
  
  // Limpa o carrinho
  const clearCart = () => {
    setItems([]);
    setSelectedDiscounts([]);
    setDeliveryFee(0);
    setShipping('delivery');
    setDeliveryLocation(null);
    setNotes('');
    setObservations('');
    setFullInvoice(true);
    setHalfInvoicePercentage(50);
    setHalfInvoiceType('quantity');
    setTaxSubstitution(false);
    setWithIPI(false);
    setPaymentMethod('cash');
    setPaymentTerms('');
    setCustomer(null);
  };
  
  // Atualiza o carrinho quando as propriedades de entrega ou faturamento são alteradas
  useEffect(() => {
    if (shipping === 'pickup') {
      setDeliveryFee(0);
      setDeliveryLocation(null);
    }
  }, [shipping]);
  
  // Finaliza o pedido
  const finalizeOrder = async (): Promise<boolean> => {
    if (!customer) {
      toast.error('Por favor, selecione um cliente');
      return false;
    }
    
    if (items.length === 0) {
      toast.error('Seu carrinho está vazio');
      return false;
    }
    
    setIsSubmitting(true);
    
    try {
      // Preparar dados do pedido para enviar ao banco de dados
      const orderData = {
        customer_id: customer.id,
        user_id: user?.id || 'anonymous',
        status: 'pending',
        shipping,
        full_invoice: fullInvoice,
        tax_substitution: taxSubstitution,
        payment_method: paymentMethod,
        payment_terms: paymentTerms || null,
        notes: notes || '',
        observations: observations || '',
        delivery_location: deliveryLocation || null,
        half_invoice_percentage: halfInvoicePercentage || null,
        half_invoice_type: halfInvoiceType || 'quantity',
        delivery_fee: deliveryFee || 0,
        subtotal,
        total_discount: totalDiscount,
        total
      };
      
      console.log('Criando pedido com os dados:', orderData);
      
      // Criar o pedido no banco de dados
      const { data: orderResponse, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();
        
      if (orderError) throw orderError;
      
      console.log('Pedido criado:', orderResponse);
      
      // Criar os itens do pedido
      const orderItems = items.map(item => ({
        order_id: orderResponse.id,
        product_id: item.product.id,
        quantity: item.quantity,
        discount: item.discount || 0,
        final_price: item.finalPrice,
        subtotal: item.subtotal
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
        
      if (itemsError) throw itemsError;
      
      // Adicionar descontos aplicados ao pedido
      if (selectedDiscounts.length > 0 && applyDiscounts) {
        // Create order discounts without relying on settings.filter
        const orderDiscounts = selectedDiscounts.map(discountId => ({
          order_id: orderResponse.id,
          discount_id: discountId
        }));
        
        if (orderDiscounts.length > 0) {
          const { error: discountsError } = await supabase
            .from('order_discounts')
            .insert(orderDiscounts);
            
          if (discountsError) {
            console.error('Erro ao inserir descontos:', discountsError);
            // Não vamos lançar erro aqui para não impedir a finalização do pedido
            // mas vamos registrar no console para depuração
          }
        }
      }
      
      toast.success(`Pedido #${orderResponse.order_number} criado com sucesso!`);
      clearCart();
      return true;
      
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      toast.error('Erro ao finalizar pedido. Por favor, tente novamente.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CartContext.Provider value={{
      items,
      customer,
      setCustomer,
      addItem,
      removeItem,
      updateItemQuantity,
      updateItemDiscount,
      clearCart,
      subtotal,
      total,
      totalItems,
      totalUnits,
      applyDiscounts,
      setApplyDiscounts,
      toggleApplyDiscounts,
      selectedDiscounts,
      toggleDiscount,
      isDiscountOptionSelected,
      totalDiscount,
      taxSubstitutionValue,
      ipiValue,
      deliveryFee,
      setDeliveryFee,
      shipping,
      setShipping,
      deliveryLocation,
      setDeliveryLocation,
      notes,
      setNotes,
      fullInvoice,
      setFullInvoice,
      halfInvoicePercentage,
      setHalfInvoicePercentage,
      halfInvoiceType,
      setHalfInvoiceType,
      taxSubstitution,
      setTaxSubstitution,
      withIPI,
      setWithIPI,
      toggleIPI,
      paymentMethod,
      setPaymentMethod,
      paymentTerms,
      setPaymentTerms,
      finalizeOrder,
      isSubmitting,
      observations,
      setObservations
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
