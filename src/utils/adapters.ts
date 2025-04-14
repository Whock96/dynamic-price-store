
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
  order: any, 
  items: any[] = [], 
  discounts: DiscountOption[] = [],
  userData?: { name: string }
): Order => {
  if (!order) {
    throw new Error('Order data is null or undefined');
  }
  
  // Ensure customer is properly formatted
  const customer: Customer = order.customers ? {
    id: order.customers.id,
    companyName: order.customers.company_name,
    document: order.customers.document,
    salesPersonId: order.customers.sales_person_id,
    street: order.customers.street,
    number: order.customers.number || '',
    noNumber: Boolean(order.customers.no_number),
    complement: order.customers.complement || '',
    neighborhood: order.customers.neighborhood || '',
    city: order.customers.city,
    state: order.customers.state,
    zipCode: order.customers.zip_code,
    phone: order.customers.phone || '',
    email: order.customers.email || '',
    whatsapp: order.customers.whatsapp || '',
    stateRegistration: order.customers.state_registration || '',
    defaultDiscount: Number(order.customers.default_discount) || 0,
    maxDiscount: Number(order.customers.max_discount) || 0,
    createdAt: new Date(order.customers.created_at),
    updatedAt: new Date(order.customers.updated_at),
    registerDate: new Date(order.customers.register_date || order.customers.created_at),
    transportCompanyId: order.customers.transport_company_id || undefined,
  } : {} as Customer;

  // Format order items with improved safety checks
  const formattedItems: CartItem[] = items.map(item => {
    if (!item || !item.products) {
      console.warn('Invalid item or missing product data in order item');
      return {} as CartItem;
    }
    
    return {
      id: item.id,
      productId: item.product_id,
      product: {
        id: item.products.id,
        name: item.products.name,
        description: item.products.description || '',
        listPrice: Number(item.products.list_price),
        weight: Number(item.products.weight),
        quantity: Number(item.products.quantity),
        quantityPerVolume: Number(item.products.quantity_per_volume),
        dimensions: {
          width: Number(item.products.width),
          height: Number(item.products.height),
          length: Number(item.products.length),
        },
        cubicVolume: Number(item.products.cubic_volume),
        categoryId: item.products.category_id || '',
        subcategoryId: item.products.subcategory_id || '',
        imageUrl: item.products.image_url || '',
        mva: Number(item.products.mva || 39), // Ensure MVA is included with a default value
        createdAt: new Date(item.products.created_at),
        updatedAt: new Date(item.products.updated_at),
      },
      quantity: Number(item.quantity),
      discount: Number(item.discount),
      finalPrice: Number(item.final_price),
      subtotal: Number(item.subtotal),
    };
  }).filter(item => Object.keys(item).length > 0);

  // Ensure discounts are properly formatted with valid UUIDs
  const validatedDiscounts: DiscountOption[] = discounts.map(discount => {
    // Ensure discount has a valid ID (UUID)
    if (!discount.id || typeof discount.id !== 'string' || discount.id.length < 10) {
      console.warn('Invalid discount ID detected:', discount);
      // Generate a fallback UUID if needed
      const fallbackId = crypto.randomUUID();
      return {
        ...discount,
        id: fallbackId
      };
    }
    return discount;
  });

  // Ensure user.role is always one of the allowed values with stricter validation
  const validRoles: ('administrator' | 'salesperson' | 'billing' | 'inventory')[] = [
    'administrator', 'salesperson', 'billing', 'inventory'
  ];
  const defaultRole = 'salesperson';
  const userRole = validRoles.includes(order.user_role as any) 
    ? order.user_role as 'administrator' | 'salesperson' | 'billing' | 'inventory'
    : defaultRole;

  // Create a properly formatted user object for the order
  const user: User = {
    id: order.user_id || '',
    // If userData is provided, use its name, otherwise use empty string
    name: userData?.name || '',
    username: '',
    role: userRole,
    permissions: [],
    email: '',
    createdAt: new Date(),
    userTypeId: '' // Ensure userTypeId is provided with a default empty string
  };

  // Convert order status and shipping to proper types with validation
  const validStatus: ('pending' | 'confirmed' | 'invoiced' | 'completed' | 'canceled')[] = [
    'pending', 'confirmed', 'invoiced', 'completed', 'canceled'
  ];
  const status = validStatus.includes(order.status as any) 
    ? order.status as 'pending' | 'confirmed' | 'invoiced' | 'completed' | 'canceled'
    : 'pending';

  const validShipping: ('delivery' | 'pickup')[] = ['delivery', 'pickup'];
  const shipping = validShipping.includes(order.shipping as any) 
    ? order.shipping as 'delivery' | 'pickup'
    : 'delivery';

  const validPaymentMethod: ('cash' | 'credit')[] = ['cash', 'credit'];
  const paymentMethod = validPaymentMethod.includes(order.payment_method as any)
    ? order.payment_method as 'cash' | 'credit'
    : 'cash';

  return {
    id: order.id,
    orderNumber: order.order_number,
    customerId: order.customer_id,
    customer,
    userId: order.user_id,
    user,
    items: formattedItems,
    appliedDiscounts: validatedDiscounts,
    totalDiscount: Number(order.total_discount) || 0,
    subtotal: Number(order.subtotal) || 0,
    total: Number(order.total) || 0,
    status,
    shipping,
    fullInvoice: Boolean(order.full_invoice),
    taxSubstitution: Boolean(order.tax_substitution),
    paymentMethod,
    paymentTerms: order.payment_terms || '',
    notes: order.notes || '',
    observations: order.observations || '',
    createdAt: new Date(order.created_at),
    updatedAt: new Date(order.updated_at),
    deliveryLocation: order.delivery_location as 'capital' | 'interior' | null,
    halfInvoicePercentage: Number(order.half_invoice_percentage),
    deliveryFee: Number(order.delivery_fee) || 0,
    withIPI: Boolean(order.with_ipi) || false,
    ipiValue: Number(order.ipi_value) || 0,
    transportCompanyId: order.transport_company_id || null, // Ensure transportCompanyId is always properly mapped
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
