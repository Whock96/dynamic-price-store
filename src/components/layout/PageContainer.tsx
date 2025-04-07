
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const PageContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);

  // Para debug
  useEffect(() => {
    console.log('Current user in PageContainer:', user);
  }, [user]);

  useEffect(() => {
    // Se o usuário não estiver autenticado e não estivermos carregando, redirecione para o login
    if (!user && !isLoading) {
      console.log('Usuário não autenticado, redirecionando para /login');
      navigate('/login');
    }
    
    // Definir o estado inicial da barra lateral com base no tamanho da tela
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsExpanded(false);
      } else {
        setIsExpanded(true);
      }
    };
    
    // Chamar uma vez na montagem
    handleResize();
    
    // Adicionar listener de evento
    window.addEventListener('resize', handleResize);
    
    // Limpar
    return () => window.removeEventListener('resize', handleResize);
  }, [user, navigate, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ferplas-500"></div>
      </div>
    );
  }

  if (!user) {
    console.log('PageContainer: sem usuário, retornando null');
    return null;
  }

  console.log('PageContainer: renderizando com sidebar');
  console.log('Papel do usuário:', user.role);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      <div className={`flex-1 flex flex-col ${isExpanded ? 'md:ml-64' : 'md:ml-16'} transition-all duration-300`}>
        <Navbar />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageContainer;
