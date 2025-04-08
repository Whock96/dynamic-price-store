
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProductProvider } from "./context/ProductContext";
import { CustomerProvider } from "./context/CustomerContext";
import { OrderProvider } from "./context/OrderContext";
import { CartProvider } from "./context/CartContext";
import { CompanyProvider } from "./context/CompanyContext";
import PageContainer from "./components/layout/PageContainer";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProductList from "./pages/Products/ProductList";
import ProductDetail from "./pages/Products/ProductDetail";
import CustomerList from "./pages/Customers/CustomerList";
import CustomerForm from "./pages/Customers/CustomerForm";
import CustomerDetail from "./pages/Customers/CustomerDetail";
import OrderList from "./pages/Orders/OrderList";
import OrderDetail from "./pages/Orders/OrderDetail";
import OrderUpdate from "./pages/Orders/OrderUpdate";
import ProductManagement from "./pages/Settings/ProductManagement";
import UserManagement from "./pages/Settings/UserManagement";
import UserTypeManagement from "./pages/Settings/UserTypeManagement";
import CategoryManagement from "./pages/Settings/CategoryManagement";
import DiscountManagement from "./pages/Settings/DiscountManagement";
import CompanySettings from "./pages/Settings/CompanySettings";
import TransportCompanyManagement from "./pages/Settings/TransportCompanyManagement";
import Cart from "./pages/Cart/Cart";
import Settings from "./pages/Settings/Settings";
import NotFound from "./pages/NotFound";
import React from "react";

// Create a new QueryClient instance outside of the component
const queryClient = new QueryClient();

const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <CompanyProvider>
                <ProductProvider>
                  <CustomerProvider>
                    <OrderProvider>
                      <CartProvider>
                        <Toaster />
                        <Sonner />
                        <Routes>
                          <Route path="/login" element={<Login />} />
                          <Route path="/" element={<PageContainer><Dashboard /></PageContainer>} />
                          <Route path="/dashboard" element={<PageContainer><Dashboard /></PageContainer>} />
                          
                          {/* Product routes */}
                          <Route path="/products" element={<PageContainer><ProductList /></PageContainer>} />
                          <Route path="/products/:id" element={<PageContainer><ProductDetail /></PageContainer>} />
                          
                          {/* Customer routes */}
                          <Route path="/customers" element={<PageContainer><CustomerList /></PageContainer>} />
                          <Route path="/customers/new" element={<PageContainer><CustomerForm /></PageContainer>} />
                          <Route path="/customers/:id" element={<PageContainer><CustomerDetail /></PageContainer>} />
                          <Route path="/customers/:id/edit" element={<PageContainer><CustomerForm /></PageContainer>} />
                          
                          {/* Order routes */}
                          <Route path="/orders" element={<PageContainer><OrderList /></PageContainer>} />
                          <Route path="/orders/:id" element={<PageContainer><OrderDetail /></PageContainer>} />
                          <Route path="/orders/:id/edit" element={<PageContainer><OrderUpdate /></PageContainer>} />
                          
                          {/* Cart route */}
                          <Route path="/cart" element={<PageContainer><Cart /></PageContainer>} />
                          
                          {/* Settings routes */}
                          <Route path="/settings" element={<PageContainer><Settings /></PageContainer>} />
                          <Route path="/settings/products" element={<PageContainer><ProductManagement /></PageContainer>} />
                          <Route path="/settings/users" element={<PageContainer><UserManagement /></PageContainer>} />
                          <Route path="/settings/user-types" element={<PageContainer><UserTypeManagement /></PageContainer>} />
                          <Route path="/settings/categories" element={<PageContainer><CategoryManagement /></PageContainer>} />
                          <Route path="/settings/discounts" element={<PageContainer><DiscountManagement /></PageContainer>} />
                          <Route path="/settings/company" element={<PageContainer><CompanySettings /></PageContainer>} />
                          <Route path="/settings/transport-companies" element={<PageContainer><TransportCompanyManagement /></PageContainer>} />
                          
                          {/* Catch-all route */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </CartProvider>
                    </OrderProvider>
                  </CustomerProvider>
                </ProductProvider>
              </CompanyProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
