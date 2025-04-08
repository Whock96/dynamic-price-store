
export const PERMISSION_MENU_MAP: Record<string, string[]> = {
  'dashboard_access': ['/dashboard'],
  'products_view': ['/products'],
  'products_manage': ['/settings/products'],
  'customers_view': ['/customers'],
  'customers_manage': ['/customers/new', '/customers/:id/edit'],
  'orders_view': ['/orders', '/orders/:id'],
  'orders_manage': ['/orders/:id/edit', '/cart'],
  'users_view': ['/settings/users'],
  'users_manage': ['/settings/users'],
  'user_types_manage': ['/settings/user-types'],
  'settings_view': ['/settings'],
  'settings_manage': ['/settings/company'],
  'categories_manage': ['/settings/categories'],
  'discounts_manage': ['/settings/discounts'],
  'transport_companies_view': ['/settings/transport-companies'],
  'transport_companies_manage': ['/settings/transport-companies']
};
