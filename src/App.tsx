import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { SidebarProvider } from './context/SidebarContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CustomerProvider } from './context/CustomerContext';
import { DiscountProvider } from './context/DiscountContext';
import { CartProvider } from './context/CartContext';
import Dashboard from './pages/Dashboard/Dashboard';
import Login from './pages/Login/Login';
import ProductsPage from './pages/Products/ProductsPage';
import ProductForm from './pages/Products/ProductForm';
import CategoriesPage from './pages/Categories/CategoriesPage';
import CategoryForm from './pages/Categories/CategoryForm';
import CustomersPage from './pages/Customers/CustomersPage';
import CustomerForm from './pages/Customers/CustomerForm';
import OrdersPage from './pages/Orders/OrdersPage';
import OrderDetails from './pages/Orders/OrderDetails';
import Cart from './pages/Cart/Cart';
import SettingsPage from './pages/Settings/SettingsPage';
import CompanySettingsPage from './pages/Settings/CompanySettingsPage';
import DiscountOptionsPage from './pages/Settings/DiscountOptionsPage';
import DiscountOptionForm from './pages/Settings/DiscountOptionsForm';
import UsersPage from './pages/Users/UsersPage';
import UserForm from './pages/Users/UserForm';
import UserTypesPage from './pages/Users/UserTypesPage';
import UserTypeForm from './pages/Users/UserTypeForm';
import PermissionsPage from './pages/Permissions/PermissionsPage';
import PermissionForm from './pages/Permissions/PermissionForm';
import TransportCompaniesPage from './pages/Settings/TransportCompanies/TransportCompaniesPage';
import TransportCompanyForm from './pages/Settings/TransportCompanies/TransportCompanyForm';
import { TransportCompanyProvider } from './context/TransportCompanyContext';

function App() {
  return (
    <React.Fragment>
      <Toaster closeButton position="top-right" theme="light" />
      <BrowserRouter>
        <SidebarProvider>
          <AuthProvider>
            <CustomerProvider>
              <DiscountProvider>
                <CartProvider>
                  <TransportCompanyProvider>
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/products/new" element={<ProductForm />} />
                      <Route path="/products/:id" element={<ProductForm />} />
                      
                      <Route path="/categories" element={<CategoriesPage />} />
                      <Route path="/categories/new" element={<CategoryForm />} />
                      <Route path="/categories/:id" element={<CategoryForm />} />
                      
                      <Route path="/customers" element={<CustomersPage />} />
                      <Route path="/customers/new" element={<CustomerForm />} />
                      <Route path="/customers/:id" element={<CustomerForm />} />
                      
                      <Route path="/orders" element={<OrdersPage />} />
                      <Route path="/orders/:id" element={<OrderDetails />} />
                      
                      <Route path="/cart" element={<Cart />} />
                      
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/settings/company" element={<CompanySettingsPage />} />
                      
                      <Route path="/settings/discounts" element={<DiscountOptionsPage />} />
                      <Route path="/settings/discounts/new" element={<DiscountOptionForm />} />
                      <Route path="/settings/discounts/:id" element={<DiscountOptionForm />} />
                      
                      <Route path="/settings/users" element={<UsersPage />} />
                      <Route path="/settings/users/new" element={<UserForm />} />
                      <Route path="/settings/users/:id" element={<UserForm />} />

                      <Route path="/settings/user-types" element={<UserTypesPage />} />
                      <Route path="/settings/user-types/new" element={<UserTypeForm />} />
                      <Route path="/settings/user-types/:id" element={<UserTypeForm />} />

                      <Route path="/settings/permissions" element={<PermissionsPage />} />
                      <Route path="/settings/permissions/new" element={<PermissionForm />} />
                      <Route path="/settings/permissions/:id" element={<PermissionForm />} />

                      <Route path="/settings/transport-companies" element={<TransportCompaniesPage />} />
                      <Route path="/settings/transport-companies/new" element={<TransportCompanyForm />} />
                      <Route path="/settings/transport-companies/:id" element={<TransportCompanyForm />} />
                    </Routes>
                  </TransportCompanyProvider>
                </CartProvider>
              </DiscountProvider>
            </CustomerProvider>
          </AuthProvider>
        </SidebarProvider>
      </BrowserRouter>
    </React.Fragment>
  );
}

export default App;
