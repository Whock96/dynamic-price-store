
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { CustomerProvider } from './context/CustomerContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { TransportCompanyProvider } from './context/TransportCompanyContext';
import DiscountManagement from './pages/Settings/DiscountManagement';
import Cart from './pages/Cart/Cart';
import OrderDetailsPage from './pages/Orders/OrderDetailsPage';

function App() {
  return (
    <React.StrictMode>
      <React.Fragment>
        <Toaster closeButton position="top-right" theme="light" />
        <BrowserRouter>
          <AuthProvider>
            <OrderProvider>
              <CustomerProvider>
                <TransportCompanyProvider>
                  <CartProvider>
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      
                      {/* Products Routes */}
                      <Route path="/products" element={<div>Products Page</div>} />
                      <Route path="/products/new" element={<div>New Product</div>} />
                      <Route path="/products/:id" element={<div>Edit Product</div>} />
                      
                      {/* Categories Routes */}
                      <Route path="/categories" element={<div>Categories Page</div>} />
                      <Route path="/categories/new" element={<div>New Category</div>} />
                      <Route path="/categories/:id" element={<div>Edit Category</div>} />
                      
                      {/* Customers Routes */}
                      <Route path="/customers" element={<div>Customers Page</div>} />
                      <Route path="/customers/new" element={<div>New Customer</div>} />
                      <Route path="/customers/:id" element={<div>Edit Customer</div>} />
                      
                      {/* Orders Routes */}
                      <Route path="/orders" element={<div>Orders Page</div>} />
                      <Route path="/orders/:id" element={<OrderDetailsPage />} />
                      
                      {/* Cart Route */}
                      <Route path="/cart" element={<Cart />} />
                      
                      {/* Settings Routes */}
                      <Route path="/settings" element={<div>Settings Page</div>} />
                      <Route path="/settings/company" element={<div>Company Settings</div>} />
                      
                      <Route path="/settings/discounts" element={<DiscountManagement />} />
                      <Route path="/settings/discounts/new" element={<div>New Discount Option</div>} />
                      <Route path="/settings/discounts/:id" element={<div>Edit Discount Option</div>} />
                      
                      <Route path="/settings/users" element={<div>Users Page</div>} />
                      <Route path="/settings/users/new" element={<div>New User</div>} />
                      <Route path="/settings/users/:id" element={<div>Edit User</div>} />

                      <Route path="/settings/user-types" element={<div>User Types Page</div>} />
                      <Route path="/settings/user-types/new" element={<div>New User Type</div>} />
                      <Route path="/settings/user-types/:id" element={<div>Edit User Type</div>} />

                      <Route path="/settings/permissions" element={<div>Permissions Page</div>} />
                      <Route path="/settings/permissions/new" element={<div>New Permission</div>} />
                      <Route path="/settings/permissions/:id" element={<div>Edit Permission</div>} />

                      <Route path="/settings/transport-companies" element={<div>Transport Companies</div>} />
                      <Route path="/settings/transport-companies/new" element={<div>New Transport Company</div>} />
                      <Route path="/settings/transport-companies/:id" element={<div>Edit Transport Company</div>} />
                    </Routes>
                  </CartProvider>
                </TransportCompanyProvider>
              </CustomerProvider>
            </OrderProvider>
          </AuthProvider>
        </BrowserRouter>
      </React.Fragment>
    </React.StrictMode>
  );
}

export default App;
