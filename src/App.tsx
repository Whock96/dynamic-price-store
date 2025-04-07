import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products/Products';
import ProductForm from '@/pages/Products/ProductForm';
import Categories from '@/pages/Categories/Categories';
import CategoryForm from '@/pages/Categories/CategoryForm';
import Subcategories from '@/pages/Subcategories/Subcategories';
import SubcategoryForm from '@/pages/Subcategories/SubcategoryForm';
import Customers from '@/pages/Customers/Customers';
import CustomerForm from '@/pages/Customers/CustomerForm';
import Orders from '@/pages/Orders/Orders';
import OrderDetail from '@/pages/Orders/OrderDetail';
import OrderUpdate from '@/pages/Orders/OrderUpdate';
import OrderPrint from '@/pages/Orders/OrderPrint';
import Cart from '@/pages/Cart/Cart';
import Login from '@/pages/Login';
import Settings from '@/pages/Settings/Settings';
import Users from '@/pages/Settings/Users';
import UserForm from '@/pages/Settings/UserForm';
import UserTypes from '@/pages/Settings/UserTypes';
import UserTypeForm from '@/pages/Settings/UserTypeForm';
import Permissions from '@/pages/Settings/Permissions';
import DiscountOptions from '@/pages/Settings/DiscountOptions';
import CompanySettings from '@/pages/Settings/CompanySettings';
import Billing from '@/pages/Billing/Billing';
import Inventory from '@/pages/Inventory/Inventory';
import NotFound from '@/pages/NotFound';
import RequireAuth from '@/components/auth/RequireAuth';
import { AuthProvider } from '@/context/AuthContext';
import { CustomerProvider } from '@/context/CustomerContext';
import { OrderProvider } from '@/context/OrderContext';
import { CartProvider } from '@/context/CartContext';
import { OrderDataProvider } from '@/context/OrderDataContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';

// Add TransportCompanyProvider to the providers list
import { TransportCompanyProvider } from './context/TransportCompanyContext';

// Add the new page to the routes
import TransportCompanies from './pages/Settings/TransportCompanies';

function App() {
  return (
    <AuthProvider>
      <CustomerProvider>
        <TransportCompanyProvider>
          <OrderProvider>
            <CartProvider>
              <OrderDataProvider>
                <TooltipProvider>
                  <ThemeProvider>
                    <Toaster theme="light" expand closeButton position="top-center" />
                    <BrowserRouter>
                      <MainLayout>
                        <Routes>
                          <Route path="/login" element={<Login />} />
                          <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
                          <Route path="/products" element={<RequireAuth><Products /></RequireAuth>} />
                          <Route path="/products/new" element={<RequireAuth><ProductForm /></RequireAuth>} />
                          <Route path="/products/:id" element={<RequireAuth><ProductForm /></RequireAuth>} />
                          <Route path="/categories" element={<RequireAuth><Categories /></RequireAuth>} />
                          <Route path="/categories/new" element={<RequireAuth><CategoryForm /></RequireAuth>} />
                          <Route path="/categories/:id" element={<RequireAuth><CategoryForm /></RequireAuth>} />
                          <Route path="/subcategories" element={<RequireAuth><Subcategories /></RequireAuth>} />
                          <Route path="/subcategories/new" element={<RequireAuth><SubcategoryForm /></RequireAuth>} />
                          <Route path="/subcategories/:id" element={<RequireAuth><SubcategoryForm /></RequireAuth>} />
                          <Route path="/customers" element={<RequireAuth><Customers /></RequireAuth>} />
                          <Route path="/customers/new" element={<RequireAuth><CustomerForm /></RequireAuth>} />
                          <Route path="/customers/:id" element={<RequireAuth><CustomerForm /></RequireAuth>} />
                          <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
                          <Route path="/orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />
                          <Route path="/orders/:id/update" element={<RequireAuth><OrderUpdate /></RequireAuth>} />
                          <Route path="/orders/:id/print" element={<RequireAuth><OrderPrint /></RequireAuth>} />
                          <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
                          <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
                          <Route path="/settings/users" element={<RequireAuth><Users /></RequireAuth>} />
                          <Route path="/settings/users/new" element={<RequireAuth><UserForm /></RequireAuth>} />
                          <Route path="/settings/users/:id" element={<RequireAuth><UserForm /></RequireAuth>} />
                          <Route path="/settings/user-types" element={<RequireAuth><UserTypes /></RequireAuth>} />
                          <Route path="/settings/user-types/new" element={<RequireAuth><UserTypeForm /></RequireAuth>} />
                          <Route path="/settings/user-types/:id" element={<RequireAuth><UserTypeForm /></RequireAuth>} />
                          <Route path="/settings/permissions" element={<RequireAuth><Permissions /></RequireAuth>} />
                          <Route path="/settings/discount-options" element={<RequireAuth><DiscountOptions /></RequireAuth>} />
                          <Route path="/settings/company" element={<RequireAuth><CompanySettings /></RequireAuth>} />
                          <Route path="/billing" element={<RequireAuth><Billing /></RequireAuth>} />
                          <Route path="/inventory" element={<RequireAuth><Inventory /></RequireAuth>} />
                          <Route path="/settings/transport-companies" element={<TransportCompanies />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </MainLayout>
                    </BrowserRouter>
                  </ThemeProvider>
                </TooltipProvider>
              </OrderDataProvider>
            </CartProvider>
          </OrderProvider>
        </TransportCompanyProvider>
      </CustomerProvider>
    </AuthProvider>
  );
}

export default App;
