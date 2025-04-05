
import { Tables } from "@/integrations/supabase/client";
import { Product, Order, CartItem, DiscountOption, Customer, User } from "@/types/types";

/**
 * Converts a Supabase product record to our application's Product interface
 */
export const supabaseProductToAppProduct = (supabaseProduct: Tables<'products'>): Product => {
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
 * Converts an order with related data from Supabase format to our application's Order interface
 */
export const supabaseOrderToAppOrder = (
  order: any, 
  items: any[] = [], 
  discounts: DiscountOption[] = [],
  userData?: { name: string } // Optional parameter to provide user data
): Order => {
  // Ensure customer is properly formatted
  const customer: Customer = order.customers ? {
    id: order.customers.id,
    companyName: order.customers.company_name,
    document: order.customers.document,
    salesPersonId: order.customers.sales_person_id,
    street: order.customers.street,
    number: order.customers.number || '',
    noNumber: order.customers.no_number,
    complement: order.customers.complement || '',
    city: order.customers.city,
    state: order.customers.state,
    zipCode: order.customers.zip_code,
    phone: order.customers.phone || '',
    email: order.customers.email || '',
    defaultDiscount: Number(order.customers.default_discount) || 0,
    maxDiscount: Number(order.customers.max_discount) || 0,
    createdAt: new Date(order.customers.created_at),
    updatedAt: new Date(order.customers.updated_at),
  } : {} as Customer;

  // Format order items
  const formattedItems: CartItem[] = items.map(item => ({
    id: item.id,
    productId: item.product_id,
    product: item.products ? {
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
    } : {} as Product,
    quantity: Number(item.quantity),
    discount: Number(item.discount),
    finalPrice: Number(item.final_price),
    subtotal: Number(item.subtotal),
  }));

  // Ensure user.role is always one of the allowed values
  const userRole: 'administrator' | 'salesperson' | 'billing' | 'inventory' = 'salesperson';

  // Create a properly formatted user object for the order
  const user: User = {
    id: order.user_id,
    // If userData is provided, use its name, otherwise use empty string (calling code should handle this)
    name: userData?.name || '',
    username: '',
    role: userRole,
    permissions: [],
    email: '',
    createdAt: new Date(),
    userTypeId: '' // Ensure userTypeId is provided with a default empty string
  };

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
    status: order.status as any,
    shipping: order.shipping as any,
    fullInvoice: Boolean(order.full_invoice),
    taxSubstitution: Boolean(order.tax_substitution),
    paymentMethod: order.payment_method as any,
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
  };
};

// Adaptar o formato dos dados do usuário enviados pelo backend
export const adaptUserData = (userData: any): User => {
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
    id: userData.id,
    name: userData.name || '',
    username: userData.username || '',
    role: normalizedRole,
    permissions: userData.permissions || [],
    email: userData.email || '',
    createdAt: new Date(userData.created_at || userData.createdAt || new Date()),
    userTypeId: userData.user_type_id || userData.userTypeId || ''
  };
};
