
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ProductProvider } from "./context/ProductContext";
import { OrderProvider } from "./context/OrderContext";
import { CustomerProvider } from "./context/CustomerContext";
import PageContainer from "./components/layout/PageContainer";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProductList from "./pages/Products/ProductList";
import ProductDetail from "./pages/Products/ProductDetail";
import CustomerList from "./pages/Customers/CustomerList";
import CustomerForm from "./pages/Customers/CustomerForm";
import OrderList from "./pages/Orders/OrderList";
import OrderDetail from "./pages/Orders/OrderDetail";
import OrderUpdate from "./pages/Orders/OrderUpdate";
import ProductManagement from "./pages/Settings/ProductManagement";
import UserManagement from "./pages/Settings/UserManagement";
import CategoryManagement from "./pages/Settings/CategoryManagement";
import DiscountManagement from "./pages/Settings/DiscountManagement";
import Cart from "./pages/Cart/Cart";
import Settings from "./pages/Settings/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ProductProvider>
          <OrderProvider>
            <CustomerProvider>
              <CartProvider>
                <BrowserRouter>
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
                    <Route path="/customers/:id" element={<PageContainer><CustomerForm /></PageContainer>} />
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
                    <Route path="/settings/categories" element={<PageContainer><CategoryManagement /></PageContainer>} />
                    <Route path="/settings/discounts" element={<PageContainer><DiscountManagement /></PageContainer>} />
                    
                    {/* Catch-all route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </CartProvider>
            </CustomerProvider>
          </OrderProvider>
        </ProductProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
