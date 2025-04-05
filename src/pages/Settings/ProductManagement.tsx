
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const ProductManagement = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  useEffect(() => {
    // Check if user has permission to manage products
    // Added additional logging and ensure proper permission check
    console.log("ProductManagement - User:", user);
    console.log("ProductManagement - Has products_manage permission:", hasPermission('products_manage'));
    
    if (!hasPermission('products_manage')) {
      toast.error('Você não tem permissão para acessar esta página');
      navigate('/dashboard');
    }
  }, [navigate, hasPermission, user]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight">Gerenciar Produtos</h1>
      <p className="text-muted-foreground">
        Esta página está em desenvolvimento.
      </p>
    </div>
  );
};

export default ProductManagement;
