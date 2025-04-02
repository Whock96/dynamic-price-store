
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
