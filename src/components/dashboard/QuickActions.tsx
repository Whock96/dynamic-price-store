
import React from 'react';
import { ShoppingCart, Package, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  
  const quickActions = [
    { title: 'Novo Pedido', icon: <ShoppingCart className="h-5 w-5" />, path: '/cart', color: 'bg-ferplas-500 hover:bg-ferplas-600' },
    { title: 'Ver Produtos', icon: <Package className="h-5 w-5" />, path: '/products', color: 'bg-blue-500 hover:bg-blue-600' },
    { title: 'Ver Clientes', icon: <Users className="h-5 w-5" />, path: '/customers', color: 'bg-purple-500 hover:bg-purple-600' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {quickActions.map((action, index) => (
        <Button
          key={index}
          className={`h-auto py-6 ${action.color} text-white w-full transition-all duration-300 transform hover:shadow-lg hover:-translate-y-1`}
          onClick={() => navigate(action.path)}
        >
          <div className="flex flex-col items-center justify-center">
            <div className="rounded-full bg-white/20 p-3 mb-3">
              {action.icon}
            </div>
            <span className="text-lg font-medium">{action.title}</span>
          </div>
        </Button>
      ))}
    </div>
  );
};

export default QuickActions;
