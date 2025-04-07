
/**
 * Format a number to currency string (BRL)
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Format a date to a localized string
 */
export const formatDate = (date: Date | string): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR');
};

/**
 * Format a phone number to Brazilian format
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 11) {
    // Mobile: (XX) 9XXXX-XXXX
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
  } else if (digits.length === 10) {
    // Landline: (XX) XXXX-XXXX
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
  }
  
  return phone;
};

/**
 * Format a document (CPF/CNPJ) to Brazilian format
 */
export const formatDocument = (doc: string | null | undefined): string => {
  if (!doc) return '';
  
  // Remove all non-digit characters
  const digits = doc.replace(/\D/g, '');
  
  if (digits.length === 11) {
    // CPF: XXX.XXX.XXX-XX
    return `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 9)}-${digits.substring(9)}`;
  } else if (digits.length === 14) {
    // CNPJ: XX.XXX.XXX/XXXX-XX
    return `${digits.substring(0, 2)}.${digits.substring(2, 5)}.${digits.substring(5, 8)}/${digits.substring(8, 12)}-${digits.substring(12)}`;
  }
  
  return doc;
};

/**
 * Format a number as a percentage
 */
export const formatPercent = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100);
};

/**
 * Format a number with specified decimal places
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};
