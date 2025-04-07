
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "@/components/ui/toaster"

import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import ProductList from '@/pages/Products/ProductList';
import ProductDetail from '@/pages/Products/ProductDetail';
import CustomerList from '@/pages/Customers/CustomerList';
import CustomerForm from '@/pages/Customers/CustomerForm';
import CustomerDetail from '@/pages/Customers/CustomerDetail';
import OrderList from '@/pages/Orders/OrderList';
import OrderDetail from '@/pages/Orders/OrderDetail';
import OrderUpdate from '@/pages/Orders/OrderUpdate';
import Cart from './pages/Cart';
import Settings from './pages/Settings';
import CompanySettings from '@/pages/Settings/CompanySettings';
import CategoryManagement from '@/pages/Settings/CategoryManagement';
import UserManagement from '@/pages/Settings/UserManagement';
import UserTypeManagement from '@/pages/Settings/UserTypeManagement';
import DiscountManagement from '@/pages/Settings/DiscountManagement';
import ProductManagement from '@/pages/Settings/ProductManagement';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';

import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CompanyProvider } from '@/context/CompanyContext';
import { CartProvider } from '@/context/CartContext';
import { OrderProvider } from '@/context/OrderContext';
import { ProductProvider } from '@/context/ProductContext';
import { CustomerProvider } from '@/context/CustomerContext';

const queryClient = new QueryClient();

function App() {
  const { user } = useAuth();
  const loggedIn = !!user; // Check if user exists
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [collapsed, setCollapsed] = useState(isMobileView);

  const checkScreenSize = useCallback(() => {
    setIsMobileView(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', checkScreenSize);
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [checkScreenSize]);

  useEffect(() => {
    if (isMobileView) {
      setCollapsed(true);
    }
  }, [isMobileView]);

  const toggleSidebar = (open: boolean) => {
    setCollapsed(!open);
  };

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CompanyProvider>
            <CartProvider>
              <OrderProvider>
                <ProductProvider>
                  <CustomerProvider>
                    <ThemeProvider defaultTheme="light" storageKey="ferplas-theme">
                      <div className="min-h-screen">
                        {loggedIn ? (
                          <div className="flex">
                            <Sidebar 
                              collapsed={isMobileView}
                              onToggle={() => toggleSidebar(!isMobileView)}
                            />
                            <div className="flex-1 p-8">
                              <Navbar toggleSidebar={() => toggleSidebar(true)} />
                              <div className="mt-4">
                                <Routes>
                                  <Route path="/" element={<Index />} />
                                  <Route path="/dashboard" element={<Dashboard />} />
                                  <Route path="/products" element={<ProductList />} />
                                  <Route path="/products/:id" element={<ProductDetail />} />
                                  <Route path="/customers" element={<CustomerList />} />
                                  <Route path="/customers/new" element={<CustomerForm />} />
                                  <Route path="/customers/:id" element={<CustomerDetail />} />
                                  <Route path="/customers/:id/edit" element={<CustomerForm />} />
                                  <Route path="/orders" element={<OrderList />} />
                                  <Route path="/orders/:id" element={<OrderDetail />} />
                                  <Route path="/orders/new" element={<Cart />} />
                                  <Route path="/orders/:id/update" element={<OrderUpdate />} />
                                  <Route path="/cart" element={<Cart />} />
                                  <Route path="/settings" element={<Settings />} />
                                  <Route path="/settings/company" element={<CompanySettings />} />
                                  <Route path="/settings/categories" element={<CategoryManagement />} />
                                  <Route path="/settings/users" element={<UserManagement />} />
                                  <Route path="/settings/user-types" element={<UserTypeManagement />} />
                                  <Route path="/settings/discounts" element={<DiscountManagement />} />
                                  <Route path="/settings/products" element={<ProductManagement />} />
                                  <Route path="*" element={<NotFound />} />
                                </Routes>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Routes>
                            <Route path="*" element={<Login />} />
                          </Routes>
                        )}
                      </div>
                      <Toaster />
                    </ThemeProvider>
                  </CustomerProvider>
                </ProductProvider>
              </OrderProvider>
            </CartProvider>
          </CompanyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;
