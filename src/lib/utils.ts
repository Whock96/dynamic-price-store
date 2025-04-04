
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatCurrency, formatDate } from "@/utils/formatters"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export formatters for backward compatibility
export { formatCurrency, formatDate }
