
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/Products/ProductList';
import ProductDetail from './pages/Products/ProductDetail';
import PageContainer from './components/layout/PageContainer';
import CustomerList from './pages/Customers/CustomerList';
import CustomerDetail from './pages/Customers/CustomerDetail';
import CustomerForm from './pages/Customers/CustomerForm';
import OrderList from './pages/Orders/OrderList';
import OrderDetail from './pages/Orders/OrderDetail';
import OrderUpdate from './pages/Orders/OrderUpdate';
import NotFound from './pages/NotFound';
import Cart from './pages/Cart/Cart';
import Index from './pages/Index';
import { AuthProvider, useAuth } from './context/AuthContext';
import Settings from './pages/Settings/Settings';
import UserManagement from './pages/Settings/UserManagement';
import UserTypeManagement from './pages/Settings/UserTypeManagement';
import CompanySettings from './pages/Settings/CompanySettings';
import ProductManagement from './pages/Settings/ProductManagement';
import CategoryManagement from './pages/Settings/CategoryManagement';
import DiscountManagement from './pages/Settings/DiscountManagement';
import TransportCompanyManagement from './pages/Settings/TransportCompanyManagement';
import { CompanyProvider } from './context/CompanyContext';
import { ProductProvider } from './context/ProductContext';
import { CustomerProvider } from './context/CustomerContext';
import { OrderProvider } from './context/OrderContext';
import { CartProvider } from './context/CartContext';
import './App.css';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

// Create a new QueryClient instance
const queryClient = new QueryClient();

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission }) => {
  const { user, hasPermission } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  console.log("App Routes rendering...");
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute requiredPermission="dashboard_access">
            <PageContainer>
              <Dashboard />
            </PageContainer>
          </ProtectedRoute>
        } 
      />

      {/* Products Routes */}
      <Route 
        path="/products" 
        element={
          <ProtectedRoute requiredPermission="products_view">
            <PageContainer>
              <ProductList />
            </PageContainer>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/products/:id" 
        element={
          <ProtectedRoute requiredPermission="products_view">
            <PageContainer>
              <ProductDetail />
            </PageContainer>
          </ProtectedRoute>
        } 
      />

      {/* Customers Routes */}
      <Route 
        path="/customers" 
        element={
          <ProtectedRoute requiredPermission="customers_view">
            <PageContainer>
              <CustomerList />
            </PageContainer>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customers/:id" 
        element={
          <ProtectedRoute requiredPermission="customers_view">
            <PageContainer>
              <CustomerDetail />
            </PageContainer>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customers/new" 
        element={
          <ProtectedRoute requiredPermission="customers_manage">
            <PageContainer>
              <CustomerForm />
            </PageContainer>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customers/:id/edit" 
        element={
          <ProtectedRoute requiredPermission="customers_manage">
            <PageContainer>
              <CustomerForm />
            </PageContainer>
          </ProtectedRoute>
        } 
      />

      {/* Orders Routes */}
      <Route 
        path="/orders" 
        element={
          <ProtectedRoute requiredPermission="orders_view">
            <PageContainer>
              <OrderList />
            </PageContainer>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/orders/:id" 
        element={
          <ProtectedRoute requiredPermission="orders_view">
            <PageContainer>
              <OrderDetail />
            </PageContainer>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/orders/:id/edit" 
        element={
          <ProtectedRoute requiredPermission="orders_manage">
            <PageContainer>
              <OrderUpdate />
            </PageContainer>
          </ProtectedRoute>
        } 
      />

      {/* Cart Route */}
      <Route 
        path="/cart" 
        element={
          <ProtectedRoute requiredPermission="orders_manage">
            <PageContainer>
              <Cart />
            </PageContainer>
          </ProtectedRoute>
        } 
      />

      {/* Settings Routes */}
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute requiredPermission="settings_view">
            <PageContainer>
              <Settings />
            </PageContainer>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings/users" 
        element={
          <ProtectedRoute requiredPermission="users_manage">
            <PageContainer>
              <UserManagement />
            </PageContainer>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings/user-types" 
        element={
          <ProtectedRoute requiredPermission="user_types_manage">
            <PageContainer>
              <UserTypeManagement />
            </PageContainer>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings/company" 
        element={
          <ProtectedRoute requiredPermission="settings_manage">
            <PageContainer>
              <CompanySettings />
            </PageContainer>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings/products" 
        element={
          <ProtectedRoute requiredPermission="products_manage">
            <PageContainer>
              <ProductManagement />
            </PageContainer>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings/categories" 
        element={
          <ProtectedRoute requiredPermission="categories_manage">
            <PageContainer>
              <CategoryManagement />
            </PageContainer>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings/discounts" 
        element={
          <ProtectedRoute requiredPermission="discounts_manage">
            <PageContainer>
              <DiscountManagement />
            </PageContainer>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings/transport-companies" 
        element={
          <ProtectedRoute requiredPermission="transport_companies_manage">
            <PageContainer>
              <TransportCompanyManagement />
            </PageContainer>
          </ProtectedRoute>
        } 
      />

      {/* Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  console.log("App component rendering");
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CompanyProvider>
          <ProductProvider>
            <CustomerProvider>
              <OrderProvider>
                <CartProvider>
                  <Router>
                    <Toaster position="top-right" />
                    <AppRoutes />
                  </Router>
                </CartProvider>
              </OrderProvider>
            </CustomerProvider>
          </ProductProvider>
        </CompanyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
