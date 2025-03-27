
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, ShoppingCart, Users, Package, Clipboard, Settings, 
  ChevronRight, List, UserPlus, Search, Edit 
} from 'lucide-react';
import { useAuth, MENU_ITEMS } from '../../context/AuthContext';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isExpanded, setIsExpanded }) => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  useEffect(() => {
    // Close expanded menu when sidebar is collapsed
    if (!isExpanded) {
      setExpandedMenu(null);
    }
    
    // Click outside listener to collapse sidebar on mobile
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && window.innerWidth < 1024) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, setIsExpanded]);

  const toggleMenu = (menuId: string) => {
    if (expandedMenu === menuId) {
      setExpandedMenu(null);
    } else {
      setExpandedMenu(menuId);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      setIsExpanded(false);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'home': return <Home size={20} />;
      case 'package': return <Package size={20} />;
      case 'users': return <Users size={20} />;
      case 'clipboard': return <Clipboard size={20} />;
      case 'shopping-cart': return <ShoppingCart size={20} />;
      case 'settings': return <Settings size={20} />;
      case 'list': return <List size={20} />;
      case 'user-plus': return <UserPlus size={20} />;
      case 'search': return <Search size={20} />;
      case 'edit': return <Edit size={20} />;
      default: return <Home size={20} />;
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  if (!user) return null;

  return (
    <div 
      ref={sidebarRef}
      className={cn(
        "h-screen fixed left-0 top-0 z-40 bg-sidebar transition-all duration-300 ease-in-out border-r border-sidebar-border pt-16",
        isExpanded ? "sidebar-expanded" : "sidebar-collapsed"
      )}
    >
      <div className="flex flex-col h-full py-4">
        <nav className="flex-1 space-y-1 px-2">
          {MENU_ITEMS.filter(item => hasPermission(item.path)).map((item) => (
            <div key={item.id} className="relative">
              <button
                onClick={() => item.submenus?.length ? toggleMenu(item.id) : handleNavigate(item.path)}
                className={cn(
                  "group w-full flex items-center py-2 px-2 rounded-md transition-all duration-200",
                  isActive(item.path) 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  !isExpanded && "justify-center"
                )}
              >
                <div className="flex items-center justify-center w-8 h-8">
                  {getIcon(item.icon)}
                </div>
                {isExpanded && (
                  <>
                    <span className="ml-3">{item.name}</span>
                    {item.submenus?.length > 0 && (
                      <ChevronRight 
                        className={cn(
                          "ml-auto transition-transform duration-200",
                          expandedMenu === item.id && "transform rotate-90"
                        )}
                        size={16} 
                      />
                    )}
                  </>
                )}
              </button>
              
              {/* Tooltip for collapsed sidebar */}
              {!isExpanded && (
                <div className="sidebar-tooltip group-hover:scale-100">
                  {item.name}
                </div>
              )}
              
              {/* Submenu */}
              {isExpanded && item.submenus && expandedMenu === item.id && (
                <div className="pl-10 mt-1 space-y-1 animate-accordion-down">
                  {item.submenus.filter(submenu => hasPermission(submenu.path)).map((submenu) => (
                    <button
                      key={submenu.id}
                      onClick={() => handleNavigate(submenu.path)}
                      className={cn(
                        "w-full flex items-center py-2 px-2 rounded-md transition-colors duration-200",
                        isActive(submenu.path) 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <div className="flex items-center justify-center w-5 h-5">
                        {getIcon(submenu.icon)}
                      </div>
                      <span className="ml-2 text-sm">{submenu.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        
        <div className="px-2 mt-auto">
          {isExpanded ? (
            <div className="border-t border-sidebar-border pt-2 text-xs text-sidebar-foreground/70 text-center">
              Ferplas © {new Date().getFullYear()}
            </div>
          ) : (
            <div className="flex justify-center text-sidebar-foreground/70">
              <span>©</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
