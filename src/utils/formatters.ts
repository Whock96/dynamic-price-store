
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

/**
 * Formats a phone number to the Brazilian format
 */
export const formatPhoneNumber = (phone: string | null | undefined) => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const numericOnly = phone.replace(/\D/g, '');
  
  // Handle different phone number lengths
  if (numericOnly.length === 11) {
    // Mobile phone: (xx) xxxxx-xxxx
    return numericOnly.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (numericOnly.length === 10) {
    // Landline: (xx) xxxx-xxxx
    return numericOnly.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  // Return the original format if it doesn't match expected patterns
  return phone;
};

/**
 * Formats a CNPJ/CPF document number to the Brazilian format
 */
export const formatDocument = (document: string | null | undefined) => {
  if (!document) return '';
  
  // Remove all non-numeric characters
  const numericOnly = document.replace(/\D/g, '');
  
  // Format CNPJ (14 digits)
  if (numericOnly.length === 14) {
    return numericOnly.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  
  // Format CPF (11 digits)
  if (numericOnly.length === 11) {
    return numericOnly.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  
  // Return original if it doesn't match expected patterns
  return document;
};

/**
 * Alias for formatPhoneNumber for backward compatibility
 */
export const formatPhone = formatPhoneNumber;
