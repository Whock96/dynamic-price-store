
export interface User {
  id: string;
  username: string;
  name: string;
  role: 'administrator' | 'salesperson' | 'billing' | 'inventory';
  permissions: Permission[];
  email: string;
  createdAt: Date;
  userTypeId: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  isGranted: boolean;
  code?: string;
}

export interface UserType {
  id: string;
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
  permissions?: Permission[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  listPrice: number;
  weight: number;
  quantity: number;
  quantityPerVolume: number;
  dimensions: {
    width: number;
    height: number;
    length: number;
  };
  cubicVolume: number;
  categoryId: string;
  subcategoryId: string;
  imageUrl: string;
  mva: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  description: string;
  categoryId: string;
}

export interface TransportCompany {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  whatsapp: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  companyName: string;
  document: string;
  salesPersonId: string;
  street: string;
  number: string;
  noNumber: boolean;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  whatsapp?: string;
  stateRegistration?: string;
  defaultDiscount: number;
  maxDiscount: number;
  transportCompanyId?: string;
  createdAt: Date;
  updatedAt: Date;
  registerDate: Date;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  discount: number;
  finalPrice: number;
  subtotal: number;
}

export interface DiscountOption {
  id: string;
  name: string;
  description: string;
  value: number;
  type: 'discount' | 'surcharge';
  isActive: boolean;
}

export interface DeliveryFees {
  capital: number;
  interior: number;
}

export interface Order {
  id: string;
  orderNumber?: number;
  customerId: string;
  customer: Customer;
  userId: string;
  user: User;
  items: CartItem[];
  appliedDiscounts: DiscountOption[];
  totalDiscount: number;
  subtotal: number;
  total: number;
  status: 'pending' | 'confirmed' | 'invoiced' | 'completed' | 'canceled';
  shipping: 'delivery' | 'pickup';
  fullInvoice: boolean;
  taxSubstitution: boolean;
  paymentMethod: 'cash' | 'credit';
  paymentTerms?: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  observations?: string;
  deliveryLocation?: 'capital' | 'interior' | null;
  halfInvoicePercentage?: number;
  halfInvoiceType?: 'quantity' | 'price';
  discountOptions?: DiscountOption[];
  deliveryFee?: number;
  withIPI?: boolean;
  ipiValue?: number;
  transportCompanyId?: string;
  transportCompany?: TransportCompany;
}

export interface MenuItem {
  id: string;
  name: string;
  path: string;
  icon: string;
  requiredRoles: string[];
  submenus?: MenuItem[];
}
