
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { isAdministrador } from '@/utils/permissionUtils';

interface SettingsTab {
  id: string;
  label: string;
  path: string;
}

export const SettingsTabs: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const isAdmin = user && isAdministrador(user.userTypeId);
  
  if (!isAdmin) return null;

  const tabs: SettingsTab[] = [
    { id: 'company', label: 'Empresa', path: '/settings/company' },
    { id: 'categories', label: 'Categorias', path: '/settings/categories' },
    { id: 'products', label: 'Produtos', path: '/settings/products' },
    { id: 'discounts', label: 'Descontos', path: '/settings/discounts' },
    { id: 'transport-companies', label: 'Transportadoras', path: '/settings/transport-companies' },
    { id: 'users', label: 'Usuários', path: '/settings/users' },
    { id: 'user-types', label: 'Tipos de Usuário', path: '/settings/user-types' },
  ];

  return (
    <div className="flex overflow-x-auto pb-2">
      <nav className="flex space-x-2 border-b w-full">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            to={tab.path}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap",
              location.pathname === tab.path
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default SettingsTabs;
