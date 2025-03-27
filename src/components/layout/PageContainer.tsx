
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && requireAuth && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate, requireAuth]);

  if (loading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-white to-gray-100">
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-ferplas-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Will redirect due to useEffect
  }

  return (
    <main className="flex-1 overflow-y-auto pt-6 px-4 sm:px-6 lg:px-8 pb-12">
      {children}
    </main>
  );
};

export default PageContainer;
