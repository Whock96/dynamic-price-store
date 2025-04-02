
/**
 * Formats a number as currency in Brazilian Real (BRL)
 */
export const formatCurrency = (value: number | null | undefined) => {
  // Ensure value is a valid number
  const safeValue = Number(value) || 0;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(safeValue);
};

/**
 * Formats a date as DD/MM/YYYY in Brazilian Portuguese format
 */
export const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR').format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};
