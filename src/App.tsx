import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { CompanyProvider } from './context/CompanyContext';
import { ProductProvider } from './context/ProductContext';
import { CustomerProvider } from './context/CustomerContext';
import { AuthProvider } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import { CartProvider } from './context/CartContext';
import { TransportCompanyProvider } from './context/TransportCompanyContext';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import RequireAuth from './components/RequireAuth';
import Users from './pages/Users';
import Categories from './pages/Categories';
import DiscountOptions from './pages/DiscountOptions';
import TransportCompanies from './pages/TransportCompanies';

const App = () => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <AuthProvider>
        <CompanyProvider>
          <TransportCompanyProvider>
            <ProductProvider>
              <CustomerProvider>
                <OrderProvider>
                  <CartProvider>
                    <Router>
                      <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password/:token" element={<ResetPassword />} />

                        <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
                        <Route path="/products" element={<RequireAuth><Products /></RequireAuth>} />
                        <Route path="/customers" element={<RequireAuth><Customers /></RequireAuth>} />
                        <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
                        <Route path="/users" element={<RequireAuth><Users /></RequireAuth>} />
                        <Route path="/categories" element={<RequireAuth><Categories /></RequireAuth>} />
                        <Route path="/discount-options" element={<RequireAuth><DiscountOptions /></RequireAuth>} />
                        <Route path="/transport-companies" element={<RequireAuth><TransportCompanies /></RequireAuth>} />
                        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
                      </Routes>
                    </Router>
                    <Toaster />
                    <SonnerToaster position="top-right" />
                  </CartProvider>
                </OrderProvider>
              </CustomerProvider>
            </ProductProvider>
          </TransportCompanyProvider>
        </CompanyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
