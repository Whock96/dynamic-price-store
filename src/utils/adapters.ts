import { Tables } from "@/integrations/supabase/client";
import { Product, Order, CartItem, DiscountOption, Customer, User } from "@/types/types";

/**
 * Converte um registro de produto do Supabase para o formato da aplicação
 */
export const supabaseProductToAppProduct = (supabaseProduct: Tables<'products'>): Product => {
  if (!supabaseProduct) {
    throw new Error('Product data is null or undefined');
  }
  
  return {
    id: supabaseProduct.id,
    name: supabaseProduct.name,
    description: supabaseProduct.description || "",
    listPrice: Number(supabaseProduct.list_price) || 0,
    weight: Number(supabaseProduct.weight) || 0,
    quantity: Number(supabaseProduct.quantity) || 0,
    quantityPerVolume: Number(supabaseProduct.quantity_per_volume) || 1,
    dimensions: {
      width: Number(supabaseProduct.width) || 0,
      height: Number(supabaseProduct.height) || 0,
      length: Number(supabaseProduct.length) || 0,
    },
    cubicVolume: Number(supabaseProduct.cubic_volume) || 0,
    categoryId: supabaseProduct.category_id || "",
    subcategoryId: supabaseProduct.subcategory_id || "",
    imageUrl: supabaseProduct.image_url || "",
    mva: Number(supabaseProduct.mva || 39), // Ensure we have a default MVA value
    createdAt: new Date(supabaseProduct.created_at),
    updatedAt: new Date(supabaseProduct.updated_at),
  };
};

/**
 * Converte um pedido com dados relacionados do formato Supabase para o formato da aplicação
 */
export const supabaseOrderToAppOrder = (
  supabaseOrder: any,
  orderItems: any[] = [],
  discounts: any[] = []
): Order => {
  // Process order items
  const processedItems: CartItem[] = orderItems.map(item => ({
    id: item.id,
    productId: item.product_id,
    product: {
      id: item.products.id,
      name: item.products.name,
      description: item.products.description || '',
      listPrice: item.products.list_price,
      weight: item.products.weight,
      quantity: item.products.quantity,
      quantityPerVolume: item.products.quantity_per_volume,
      dimensions: {
        width: item.products.width,
        height: item.products.height,
        length: item.products.length,
      },
      cubicVolume: item.products.cubic_volume,
      categoryId: item.products.category_id,
      subcategoryId: item.products.subcategory_id,
      imageUrl: item.products.image_url,
      mva: item.products.mva,
      createdAt: new Date(item.products.created_at),
      updatedAt: new Date(item.products.updated_at),
    },
    quantity: Number(item.quantity),
    discount: Number(item.discount || 0),
    finalPrice: Number(item.final_price || 0),
    subtotal: Number(item.subtotal || 0),
  }));

  // Use the discounts directly from the parameter or from the applied_discounts field if available
  const appliedDiscounts = discounts || supabaseOrder.applied_discounts || [];
  
  console.log("Processing discounts in adapter:", appliedDiscounts);

  return {
    id: supabaseOrder.id,
    orderNumber: supabaseOrder.order_number,
    customerId: supabaseOrder.customer_id,
    customer: supabaseOrder.customers ? {
      id: supabaseOrder.customers.id,
      companyName: supabaseOrder.customers.company_name,
      document: supabaseOrder.customers.document,
      salesPersonId: supabaseOrder.customers.sales_person_id,
      street: supabaseOrder.customers.street,
      number: supabaseOrder.customers.number || '',
      noNumber: supabaseOrder.customers.no_number || false,
      complement: supabaseOrder.customers.complement || '',
      neighborhood: supabaseOrder.customers.neighborhood || '',
      city: supabaseOrder.customers.city,
      state: supabaseOrder.customers.state,
      zipCode: supabaseOrder.customers.zip_code,
      phone: supabaseOrder.customers.phone || '',
      email: supabaseOrder.customers.email || '',
      whatsapp: supabaseOrder.customers.whatsapp || '',
      stateRegistration: supabaseOrder.customers.state_registration || '',
      defaultDiscount: Number(supabaseOrder.customers.default_discount || 0),
      maxDiscount: Number(supabaseOrder.customers.max_discount || 0),
      createdAt: new Date(supabaseOrder.customers.created_at),
      updatedAt: new Date(supabaseOrder.customers.updated_at),
      registerDate: new Date(supabaseOrder.customers.register_date),
      transportCompanyId: supabaseOrder.customers.transport_company_id,
    } : {
      id: supabaseOrder.customer_id,
      companyName: 'Cliente não encontrado',
      document: '',
      salesPersonId: '',
      street: '',
      number: '',
      noNumber: false,
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
      defaultDiscount: 0,
      maxDiscount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      registerDate: new Date(),
    },
    userId: supabaseOrder.user_id,
    user: {
      id: supabaseOrder.user_id || '',
      username: '',
      name: '',
      role: 'salesperson',
      permissions: [],
      email: '',
      createdAt: new Date(),
      userTypeId: '',
    },
    items: processedItems,
    appliedDiscounts: appliedDiscounts,
    totalDiscount: Number(supabaseOrder.total_discount || 0),
    subtotal: Number(supabaseOrder.subtotal || 0),
    total: Number(supabaseOrder.total || 0),
    status: supabaseOrder.status as Order['status'],
    shipping: supabaseOrder.shipping as Order['shipping'],
    fullInvoice: supabaseOrder.full_invoice,
    taxSubstitution: supabaseOrder.tax_substitution,
    paymentMethod: supabaseOrder.payment_method as Order['paymentMethod'],
    paymentTerms: supabaseOrder.payment_terms || '',
    notes: supabaseOrder.notes || '',
    observations: supabaseOrder.observations || '',
    createdAt: new Date(supabaseOrder.created_at),
    updatedAt: new Date(supabaseOrder.updated_at),
    deliveryLocation: supabaseOrder.delivery_location as Order['deliveryLocation'],
    halfInvoicePercentage: supabaseOrder.half_invoice_percentage,
    halfInvoiceType: 'quantity', // Default value
    deliveryFee: Number(supabaseOrder.delivery_fee || 0),
    withIPI: supabaseOrder.with_ipi || false,
    ipiValue: Number(supabaseOrder.ipi_value || 0),
    transportCompanyId: supabaseOrder.transport_company_id || null,
  };
};

// Adaptar o formato dos dados do usuário enviados pelo backend com validações adicionais
export const adaptUserData = (userData: any): User => {
  if (!userData) {
    throw new Error('User data is null or undefined');
  }
  
  // Map the role to one of the allowed values in our User type
  let normalizedRole: 'administrator' | 'salesperson' | 'billing' | 'inventory' = 'salesperson';
  
  // Handle both raw string values and user_type object from database
  const roleValue = typeof userData.role === 'string' ? userData.role : 
                    (userData.user_type ? userData.user_type.name : 'salesperson');
                    
  // Normalize role names to match our enum
  if (roleValue) {
    const roleLower = roleValue.toLowerCase();
    if (roleLower.includes('admin')) {
      normalizedRole = 'administrator';
    } else if (roleLower.includes('sales') || roleLower.includes('vend')) {
      normalizedRole = 'salesperson';
    } else if (roleLower.includes('bill') || roleLower.includes('financ')) {
      normalizedRole = 'billing';
    } else if (roleLower.includes('inven') || roleLower.includes('estoque')) {
      normalizedRole = 'inventory';
    }
  }
  
  return {
    id: userData.id || '',
    name: userData.name || '',
    username: userData.username || '',
    role: normalizedRole,
    permissions: Array.isArray(userData.permissions) ? userData.permissions : [],
    email: userData.email || '',
    createdAt: new Date(userData.created_at || userData.createdAt || new Date()),
    userTypeId: userData.user_type_id || userData.userTypeId || ''
  };
};
