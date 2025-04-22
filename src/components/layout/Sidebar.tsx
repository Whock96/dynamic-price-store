import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '@/lib/utils';
import { MENU_ITEMS } from '../../context/AuthContext';
import { shouldShowMenuItem } from '../../utils/permissionUtils';

interface SidebarProps {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isExpanded, setIsExpanded }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Se não houver usuário, não renderiza o sidebar
  if (!user) return null;

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-20 flex flex-col h-screen bg-white border-r border-gray-200 w-64 transition-transform duration-300 ease-in-out",
        isExpanded ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0 lg:sticky",
      )}
    >
      {/* Cabeçalho do Sidebar */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <Link to="/" className="flex items-center text-2xl font-bold text-gray-800">
          Ferplas
        </Link>
      </div>
      
      {/* Lista de itens do menu */}
      <div className="flex flex-col h-full">
        {MENU_ITEMS.map((item) => {
          // Verifica se o usuário tem acesso a este menu
          if (!shouldShowMenuItem(user.userTypeId, item.id)) {
            return null;
          }
          
          const isActive = location.pathname.startsWith(item.path);
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100",
                isActive ? "bg-gray-100 font-medium" : ""
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
      
      {/* Rodapé do Sidebar */}
      <div className="flex items-center justify-center h-16 border-t border-gray-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100"
        >
          {isExpanded ? "Minimizar" : "Expandir"}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
