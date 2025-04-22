
// IDs fixos dos tipos de usuário
export const ADMIN_USER_TYPE_ID = '548dae75-9f43-4dd5-a476-5996430c40b7';
export const VENDEDOR_USER_TYPE_ID = 'c5ee0433-3faf-46a4-a516-be7261bfe575';

// Verifica se o usuário é um administrador
export const isAdministrador = (userTypeId: string): boolean => {
  return userTypeId === ADMIN_USER_TYPE_ID;
};

// Verifica se o usuário é um vendedor
export const isVendedor = (userTypeId: string): boolean => {
  return userTypeId === VENDEDOR_USER_TYPE_ID;
};

// Verifica se o usuário tem acesso à rota especificada
export const hasAccessToRoute = (userTypeId: string, route: string): boolean => {
  // Administrador tem acesso a todas as rotas
  if (isAdministrador(userTypeId)) {
    return true;
  }
  
  // Rotas específicas que vendedores têm acesso
  const vendedorRoutes = [
    '/dashboard',
    '/customers',
    '/customers/new',
    '/customers/:id/edit',
    '/orders',
    '/orders/:id',
    '/cart'
  ];
  
  // Verifica se a rota está na lista ou se é um padrão com parâmetros
  return vendedorRoutes.some(path => {
    if (path.includes(':')) {
      const regexPath = path.replace(/:\w+/g, '[^/]+');
      const pattern = new RegExp(`^${regexPath}$`);
      return pattern.test(route);
    }
    return path === route;
  });
};

// Verifica se o menu deve ser mostrado para o usuário
export const shouldShowMenuItem = (userTypeId: string, menuId: string): boolean => {
  // Administrador vê todos os menus
  if (isAdministrador(userTypeId)) {
    return true;
  }
  
  // Vendedor não vê o menu de configurações
  if (isVendedor(userTypeId) && menuId === 'settings') {
    return false;
  }
  
  // Menus que vendedores têm acesso
  const vendedorMenus = ['dashboard', 'customers', 'orders', 'cart'];
  return vendedorMenus.includes(menuId);
};
