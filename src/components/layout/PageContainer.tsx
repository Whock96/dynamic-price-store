
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PageContainerProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { user, loading, checkAccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set initial expanded state based on screen size
    const handleResize = () => {
      setIsExpanded(window.innerWidth >= 1024);
    };

    // Call once on mount
    handleResize();
    setMounted(true);

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      // If authentication is required and user is not logged in, redirect to login
      if (requireAuth && !user) {
        navigate('/login');
        return;
      }

      // If user is logged in but doesn't have permission to access this page
      if (user && requireAuth && !checkAccess(location.pathname)) {
        // Redirect to dashboard or show access denied
        toast.error('Você não tem permissão para acessar esta página');
        navigate('/dashboard');
      }
    }
  }, [user, loading, navigate, requireAuth, location.pathname, checkAccess]);

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
    <div className="flex flex-col min-h-screen bg-gray-50">
      {user && <Navbar />}
      
      <div className="flex flex-1">
        {user && <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />}
        
        <main 
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out pt-6 px-4 sm:px-6 lg:px-8 pb-12",
            user ? "ml-16 lg:ml-16" : "",
            isExpanded && "lg:ml-64"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageContainer;
