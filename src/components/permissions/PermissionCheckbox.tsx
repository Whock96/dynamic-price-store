
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PermissionCheckboxProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

const PermissionCheckbox = ({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  className
}: PermissionCheckboxProps) => {
  return (
    <div className={cn("flex items-start space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors", className)}>
      <Checkbox 
        id={id} 
        checked={checked} 
        onCheckedChange={onCheckedChange}
        className="mt-1"
      />
      <div className="flex flex-col">
        <Label 
          htmlFor={id} 
          className="font-medium text-gray-900 cursor-pointer"
        >
          {label}
        </Label>
        {description && (
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
};

export default PermissionCheckbox;
