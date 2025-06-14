
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, ShoppingCart, Users, Package, Clipboard, Settings, 
  ChevronRight, List, UserPlus, Search, Edit, Menu, Building2, LogOut,
  Tag, Percent, Shield, Truck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MENU_ITEMS } from '../../constants/menuItems';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { isAdministrator } from '@/utils/permissionUtils';

interface SidebarProps {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isExpanded, setIsExpanded }) => {
  const { user, logout, hasPermission, checkAccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  useEffect(() => {
    if (!isExpanded) {
      setExpandedMenu(null);
    }
    
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

  useEffect(() => {
    const currentPath = location.pathname;
    
    MENU_ITEMS.forEach(item => {
      if (item.submenus && item.submenus.some(sub => currentPath.startsWith(sub.path))) {
        setExpandedMenu(item.id);
      }
    });
  }, [location.pathname]);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
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
      case 'building-2': return <Building2 size={20} />;
      case 'shield': return <Shield size={20} />;
      case 'tag': return <Tag size={20} />;
      case 'percent': return <Percent size={20} />;
      case 'truck': return <Truck size={20} />;
      default: return <Home size={20} />;
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const hasAccessToMenu = (menuItem: typeof MENU_ITEMS[0]) => {
    if (!user) return false;
    
    // Administradores têm acesso total a todos os menus
    if (isAdministrator(user.role)) {
      return true;
    }

    return menuItem.requiredRoles.includes(user.role) || checkAccess(menuItem.path);
  };

  if (!user) return null;

  return (
    <div 
      ref={sidebarRef}
      className={cn(
        "h-screen fixed left-0 top-16 bg-sidebar z-40 transition-all duration-300 ease-in-out border-r border-sidebar-border",
        isExpanded ? "sidebar-expanded" : "sidebar-collapsed"
      )}
    >
      <div className="flex flex-col h-full py-4">
        <div className="px-2 mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
          >
            <Menu className="h-5 w-5" />
            {isExpanded && <span className="ml-2">Fechar menu</span>}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-2 overflow-y-auto">
          {MENU_ITEMS
            .filter(item => hasAccessToMenu(item))
            .map((item) => (
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
                
                {!isExpanded && (
                  <div className="sidebar-tooltip group-hover:scale-100">
                    {item.name}
                  </div>
                )}
                
                {isExpanded && item.submenus && expandedMenu === item.id && (
                  <div className="pl-10 mt-1 space-y-1 animate-accordion-down">
                    {item.submenus
                      .filter(submenu => isAdministrator(user.role) || checkAccess(submenu.path))
                      .map((submenu) => (
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

          <div className="relative mt-2">
            <button
              onClick={handleLogout}
              className={cn(
                "group w-full flex items-center py-2 px-2 rounded-md transition-all duration-200 text-red-500 hover:bg-red-50 hover:text-red-600",
                !isExpanded && "justify-center"
              )}
            >
              <div className="flex items-center justify-center w-8 h-8">
                <LogOut size={20} />
              </div>
              {isExpanded && <span className="ml-3">Sair</span>}
            </button>
            
            {!isExpanded && (
              <div className="sidebar-tooltip group-hover:scale-100">
                Sair
              </div>
            )}
          </div>
        </nav>
        
        <div className="px-2 mt-4">
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
