
import React from 'react';
import { useLocation } from 'react-router-dom';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen flex flex-col">
      {/* You can add a header/sidebar here conditionally if not on login page */}
      <main className="flex-1">
        {children}
      </main>
      {/* You can add a footer here */}
    </div>
  );
};

export default MainLayout;
