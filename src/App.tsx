
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import './App.css';

const App = () => {
  return (
    <AuthProvider>
      <CompanyProvider>
        <TransportCompanyProvider>
          <ProductProvider>
            <CustomerProvider>
              <OrderProvider>
                <CartProvider>
                  <Router>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/customers" element={<div className="p-6">Customers page content</div>} />
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
  );
};

export default App;
