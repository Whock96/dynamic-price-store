
export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  discount: number; // Individual discount percentage
  finalPrice: number; // After all discounts, without tax substitution
  subtotal: number; // (finalPrice + tax) * quantity
  totalDiscountPercentage?: number; // Total discount including global options
  taxSubstitutionValue?: number; // ICMS-ST value for this item
  ipiValue?: number; // IPI value for this item
  totalWithTaxes?: number; // Subtotal including all taxes
  totalUnits?: number; // Total units (quantity * quantityPerVolume)
  unitPrice?: number; // Unit price of the product
  totalCubicVolume?: number; // Total cubic volume (product cubic volume * quantity)
  totalWeight?: number; // Total weight (product weight * quantity)
}
