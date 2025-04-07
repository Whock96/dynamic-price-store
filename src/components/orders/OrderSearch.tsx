
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface OrderSearchProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}

const OrderSearch: React.FC<OrderSearchProps> = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className="relative w-full md:w-96">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar por número, CNPJ ou cliente..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-10"
      />
    </div>
  );
};

export default OrderSearch;
