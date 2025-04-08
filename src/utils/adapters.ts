
import { Tables } from "@/integrations/supabase/client";
import { Product, Order, CartItem, DiscountOption, Customer, User } from "@/types/types";

/**
 * Converts a Supabase product record to application format with improved type safety
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
    mva: Number(supabaseProduct.mva || 39), // Default MVA value
    createdAt: new Date(supabaseProduct.created_at),
    updatedAt: new Date(supabaseProduct.updated_at),
  };
};

/**
 * Extracts and validates customer data from order record
 */
export const extractCustomerFromOrder = (orderData: any): Customer => {
  if (!orderData?.customers) {
    throw new Error('Customer data is missing from order');
  }
  
  const customerData = orderData.customers;
  
  return {
    id: customerData.id,
    companyName: customerData.company_name,
    document: customerData.document,
    salesPersonId: customerData.sales_person_id,
    street: customerData.street,
    number: customerData.number || '',
    noNumber: Boolean(customerData.no_number),
    complement: customerData.complement || '',
    neighborhood: customerData.neighborhood || '',
    city: customerData.city,
    state: customerData.state,
    zipCode: customerData.zip_code,
    phone: customerData.phone || '',
    email: customerData.email || '',
    whatsapp: customerData.whatsapp || '',
    stateRegistration: customerData.state_registration || '',
    defaultDiscount: Number(customerData.default_discount) || 0,
    maxDiscount: Number(customerData.max_discount) || 0,
    createdAt: new Date(customerData.created_at),
    updatedAt: new Date(customerData.updated_at),
    registerDate: new Date(customerData.register_date || customerData.created_at),
    transportCompanyId: customerData.transport_company_id,
  };
};

/**
 * Formats order items from raw data with improved safety
 */
export const formatOrderItems = (items: any[] = []): CartItem[] => {
  return items.map(item => {
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
        mva: Number(item.products.mva || 39),
        createdAt: new Date(item.products.created_at),
        updatedAt: new Date(item.products.updated_at),
      },
      quantity: Number(item.quantity),
      discount: Number(item.discount),
      finalPrice: Number(item.final_price),
      subtotal: Number(item.subtotal),
    };
  }).filter(item => Object.keys(item).length > 0);
};

/**
 * Creates a normalized user object for orders with proper validation
 */
export const createOrderUser = (userData: { name?: string } | undefined, userRole: string, userId: string): User => {
  // Validate user role
  const validRoles: ('administrator' | 'salesperson' | 'billing' | 'inventory')[] = [
    'administrator', 'salesperson', 'billing', 'inventory'
  ];
  const normalizedRole = validRoles.includes(userRole as any) 
    ? userRole as 'administrator' | 'salesperson' | 'billing' | 'inventory'
    : 'salesperson';

  return {
    id: userId || '',
    name: userData?.name || '',
    username: '',
    role: normalizedRole,
    permissions: [],
    email: '',
    createdAt: new Date(),
    userTypeId: ''
  };
};

/**
 * Converts an order with related data from Supabase format to application format
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
  
  // Extract validated customer data
  const customer = extractCustomerFromOrder(order);
  
  // Format order items safely
  const formattedItems = formatOrderItems(items);
  
  // Create properly validated user object
  const user = createOrderUser(userData, order.user_role || '', order.user_id || '');

  // Validate order status
  const validStatus: ('pending' | 'confirmed' | 'invoiced' | 'completed' | 'canceled')[] = [
    'pending', 'confirmed', 'invoiced', 'completed', 'canceled'
  ];
  const status = validStatus.includes(order.status as any) 
    ? order.status as 'pending' | 'confirmed' | 'invoiced' | 'completed' | 'canceled'
    : 'pending';

  // Validate shipping type
  const validShipping: ('delivery' | 'pickup')[] = ['delivery', 'pickup'];
  const shipping = validShipping.includes(order.shipping as any) 
    ? order.shipping as 'delivery' | 'pickup'
    : 'delivery';

  // Validate payment method
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
    appliedDiscounts: discounts,
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
    halfInvoiceType: order.half_invoice_type as 'quantity' | 'price' || undefined,
    deliveryFee: Number(order.delivery_fee) || 0,
    withIPI: Boolean(order.with_ipi) || false,
    ipiValue: Number(order.ipi_value) || 0,
    transportCompanyId: order.transport_company_id,
  };
};

/**
 * Adapts user data from backend format with improved validation
 */
export const adaptUserData = (userData: any): User => {
  if (!userData) {
    throw new Error('User data is null or undefined');
  }
  
  // Normalize role name
  let normalizedRole: 'administrator' | 'salesperson' | 'billing' | 'inventory' = 'salesperson';
  
  // Handle both raw string values and user_type object
  const roleValue = typeof userData.role === 'string' ? userData.role : 
                   (userData.user_type ? userData.user_type.name : 'salesperson');
                   
  // Map role to normalized value
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
