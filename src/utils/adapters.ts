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
      listPrice: Number(item.products.list_price),
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
    totalDiscountPercentage: Number(item.total_discount_percentage || 0),
    taxSubstitutionValue: Number(item.tax_substitution_value || 0),
    ipiValue: Number(item.ipi_value || 0),
    totalWithTaxes: Number(item.total_with_taxes || 0),
    totalUnits: Number(item.total_units || (item.quantity * (item.products.quantity_per_volume || 1))),
    totalWeight: Number(item.products.weight || 0) * Number(item.quantity || 0),
    totalCubicVolume: Number(item.total_cubic_volume || 0)
  }));

  // Parse applied_discounts from JSONB to DiscountOption[] type
  let appliedDiscounts: DiscountOption[] = [];
  
  if (supabaseOrder.applied_discounts) {
    try {
      // Ensure we're handling the applied_discounts correctly
      if (Array.isArray(supabaseOrder.applied_discounts)) {
        // We need to cast this as unknown first and then as DiscountOption[] to satisfy TypeScript
        appliedDiscounts = (supabaseOrder.applied_discounts as unknown) as DiscountOption[];
      } else {
        console.warn("Applied discounts is not an array:", supabaseOrder.applied_discounts);
      }
    } catch (error) {
      console.error("Error parsing applied discounts:", error);
    }
  }

  // Extract transport company information more robustly
  let transportCompanyName = null;
  let transportCompanyId = supabaseOrder.transport_company_id || null;
  
  // Log raw transport company data for debugging
  console.log("supabaseOrderToAppOrder - Raw transport company data:", {
    id: transportCompanyId,
    rawData: supabaseOrder.transport_companies
  });
  
  // Try to get transport company name from joined data
  if (supabaseOrder.transport_companies) {
    // Handle both object and array formats that could come from Supabase
    if (typeof supabaseOrder.transport_companies === 'object' && 
        supabaseOrder.transport_companies !== null) {
        
      // Handle array format (sometimes returned by Supabase)
      if (Array.isArray(supabaseOrder.transport_companies) && 
          supabaseOrder.transport_companies.length > 0) {
        transportCompanyName = supabaseOrder.transport_companies[0].name;
        console.log("Found transport company name from array:", transportCompanyName);
      }
      // Handle object format
      else if (supabaseOrder.transport_companies.name) {
        transportCompanyName = supabaseOrder.transport_companies.name;
        console.log("Found transport company name from object:", transportCompanyName);
      }
    }
  }
  
  // If we still don't have a name but have an ID, log this situation
  if (!transportCompanyName && transportCompanyId) {
    console.log("Have transport company ID but no name:", transportCompanyId);
  }
  
  // Log the final extracted transport company data
  console.log("Final transport company data extracted:", {
    id: transportCompanyId,
    name: transportCompanyName
  });

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
    halfInvoiceType: supabaseOrder.half_invoice_type === 'price' ? 'price' : 'quantity',
    halfInvoicePercentage: Number(supabaseOrder.half_invoice_percentage || 50),
    deliveryFee: Number(supabaseOrder.delivery_fee || 0),
    withIPI: supabaseOrder.with_ipi || false,
    ipiValue: Number(supabaseOrder.ipi_value || 0),
    transportCompanyId: transportCompanyId,
    transportCompanyName: transportCompanyName,
    invoiceNumber: supabaseOrder.invoice_number || null,
    invoicePdfPath: supabaseOrder.invoice_pdf_path || null,
    productsTotal: Number(supabaseOrder.products_total || 0),
    taxSubstitutionTotal: Number(supabaseOrder.tax_substitution_total || 0),
    withSuframa: supabaseOrder.with_suframa || false
  };
};

// Adaptar o formato dos dados do usuário enviados pelo backend com validações adicionais
export const adaptUserData = (userData: any): User => {
  if (!userData) {
    throw new Error('User data is null or undefined');
  }
  
  return {
    id: userData.id || '',
    name: userData.name || '',
    username: userData.username || '',
    email: userData.email || '',
    createdAt: new Date(userData.created_at || userData.createdAt || new Date()),
    userTypeId: userData.user_type_id || userData.userTypeId || ''
  };
};
