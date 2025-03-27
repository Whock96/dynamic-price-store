
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import PageContainer from './components/layout/PageContainer';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/Products/ProductList';
import ProductDetail from './pages/Products/ProductDetail';
import CustomerList from './pages/Customers/CustomerList';
import CustomerForm from './pages/Customers/CustomerForm';
import OrderList from './pages/Orders/OrderList';
import OrderDetail from './pages/Orders/OrderDetail';
import OrderUpdate from './pages/Orders/OrderUpdate';
import Settings from './pages/Settings/Settings';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Cart from './pages/Cart/Cart';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { CartProvider } from './context/CartContext';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider attribute="class" defaultTheme="light">
          <AuthProvider>
            <CartProvider>
              <Router>
                <div className="flex h-screen overflow-hidden bg-muted/10">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Navbar />
                    <PageContainer>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/products" element={<ProductList />} />
                        <Route path="/products/:id" element={<ProductDetail />} />
                        <Route path="/customers" element={<CustomerList />} />
                        <Route path="/customers/new" element={<CustomerForm />} />
                        <Route path="/customers/:id" element={<CustomerForm />} />
                        <Route path="/orders" element={<OrderList />} />
                        <Route path="/orders/:id" element={<OrderDetail />} />
                        <Route path="/orders/:id/update" element={<OrderUpdate />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/settings/*" element={<Settings />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </PageContainer>
                  </div>
                </div>
                <Toaster />
              </Router>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
