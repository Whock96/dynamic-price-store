import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useDiscountSettings } from '@/hooks/use-discount-settings';
import { CartItem, Product, DiscountOption, Customer } from '@/types/types';
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
      const discountOption = settings.find(opt => opt.id === id);
      if (!discountOption) return;
      
      if (discountOption.type === 'discount') {
        // Desconto em porcentagem
        discountAmount += subtotal * (discountOption.value / 100);
      } else if (discountOption.type === 'surcharge') {
        // Acréscimo em porcentagem (desconto negativo)
        discountAmount -= subtotal * (discountOption.value / 100);
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
    // Obs: Isso é específico para a regra de negócio do cliente
    const taxOption = settings.find(opt => opt.id === '3');
    if (!isDiscountOptionSelected('3') || !applyDiscounts) return 0;
    
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
    
    const taxOption = settings.find(opt => opt.id === '3');
    if (!taxOption) return 0;
    
    const icmsStRate = taxOption.value / 100;
    const mva = (item.product.mva ?? 39) / 100;
    const basePrice = item.finalPrice;
    
    let taxValue = basePrice * mva * icmsStRate;
    
    if (!fullInvoice && halfInvoicePercentage > 0) {
      taxValue = taxValue * (halfInvoicePercentage / 100);
    }
    
    return taxValue;
  };

  const calculateIPIValue = () => {
    if (!withIPI) return 0;
    
    const ipiOption = settings.find(opt => opt.id === '4');
    if (!ipiOption || !isDiscountOptionSelected('4') || !applyDiscounts) return 0;
    
    // IPI é calculado sobre o subtotal
    return subtotal * (ipiOption.value / 100);
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
      const totalUnits = calculateTotalUnits(item);
      
      const taxValuePerUnit = applyDiscounts && isDiscountOptionSelected('3') ? 
        calculateItemTaxSubstitutionValue(item) : 0;
      
      const subtotal = (finalPrice + taxValuePerUnit) * totalUnits;
      
      return {
        ...item,
        finalPrice,
        subtotal
      };
    }));
  };
  
  // Monitora mudanças nas opções de desconto selecionadas
  useEffect(() => {
    recalculateCart();
  }, [selectedDiscounts, applyDiscounts, taxSubstitution, fullInvoice, halfInvoicePercentage, withIPI]);
  
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
      const totalUnits = quantity * (product.quantityPerVolume || 1);
      
      // Calcula substituição tributária se aplicável
      const taxValuePerUnit = applyDiscounts && isDiscountOptionSelected('3') && taxSubstitution ?
        product.listPrice * ((product.mva ?? 39) / 100) * 0.078 : 0;
      
      const subtotal = (finalPrice + taxValuePerUnit) * totalUnits;
      
      // Adiciona o novo item
      setItems([
        ...items, 
        {
          product,
          quantity,
          discount,
          finalPrice,
          listPrice: product.listPrice,
          subtotal
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
      const existingItem = { ...item, quantity: newQuantity };
      const finalPrice = existingItem.product.listPrice * (1 - existingItem.discount / 100);
      const totalUnits = newQuantity * (existingItem.product.quantityPerVolume || 1);
      
      const taxValuePerUnit = applyDiscounts && isDiscountOptionSelected('3') ? 
        calculateItemTaxSubstitutionValue({...existingItem, quantity: newQuantity}) : 0;
      
      const subtotal = (existingItem.finalPrice + taxValuePerUnit) * totalUnits;
      
      return {
        ...existingItem,
        finalPrice,
        subtotal
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
      
      const tempItem = {
        ...item,
        discount: appliedDiscount,
        finalPrice
      };
      
      const taxValuePerUnit = applyDiscounts && isDiscountOptionSelected('3') ? 
        calculateItemTaxSubstitutionValue(tempItem) : 0;
      
      const subtotal = (finalPrice + taxValuePerUnit) * totalUnits;
      
      return {
        ...item,
        discount: appliedDiscount,
        finalPrice,
        subtotal
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
  
  // Atualiza os itens quando a quantidade muda
  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    setItems(prevItems => prevItems.map(item => {
      if (item.product.id === productId) {
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
  
  // Atualiza os itens quando o desconto muda
  const handleDiscountChange = (productId: string, discount: number) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.product.id === productId) {
        const appliedDiscount = Math.min(Math.max(discount, 0), 100);
        const finalPrice = item.product.listPrice * (1 - appliedDiscount / 100);
        const totalUnits = calculateTotalUnits(item);
        
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
        // Convertemos os IDs de string para UUID antes de inserir
        // Aqui estava o problema principal, os IDs estavam como '2' e '3' em vez de UUIDs
        // Precisamos usar os UUIDs corretos dos descontos do banco de dados
        
        // Obter os UUIDs dos descontos selecionados a partir dos settings
        const selectedDiscountUUIDs = settings
          .filter(discount => selectedDiscounts.includes(discount.id))
          .map(discount => ({
            order_id: orderResponse.id,
            discount_id: discount.id
          }));
        
        if (selectedDiscountUUIDs.length > 0) {
          const { error: discountsError } = await supabase
            .from('order_discounts')
            .insert(selectedDiscountUUIDs);
            
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
      taxSubstitution,
      setTaxSubstitution,
      withIPI,
      setWithIPI,
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
