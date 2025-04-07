
import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortDirection = 'asc' | 'desc' | null;

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSortKey: string | null;
  currentSortDirection: SortDirection;
  onSort: (key: string) => void;
  className?: string;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortKey,
  currentSortKey,
  currentSortDirection,
  onSort,
  className
}) => {
  const isActive = currentSortKey === sortKey;

  return (
    <button 
      onClick={() => onSort(sortKey)} 
      className={cn(
        "flex items-center gap-1 focus:outline-none font-medium",
        isActive && "text-primary",
        className
      )}
    >
      {label}
      {isActive ? (
        currentSortDirection === 'asc' ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )
      ) : (
        <div className="h-4 w-4" />
      )}
    </button>
  );
};

export default SortableHeader;
