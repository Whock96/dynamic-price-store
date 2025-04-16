
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (date: Date | string): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);
};

export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove non-numeric characters
  const numbers = phone.replace(/\D/g, '');
  
  if (numbers.length === 11) {
    // Format as (XX) XXXXX-XXXX (with 9 digit)
    return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7)}`;
  } else if (numbers.length === 10) {
    // Format as (XX) XXXX-XXXX
    return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 6)}-${numbers.substring(6)}`;
  }
  
  // Return original if not a standard format
  return phone;
};

export const formatDocument = (document: string): string => {
  if (!document) return '';
  
  // Remove non-numeric characters
  const numbers = document.replace(/\D/g, '');
  
  if (numbers.length === 11) {
    // CPF: XXX.XXX.XXX-XX
    return `${numbers.substring(0, 3)}.${numbers.substring(3, 6)}.${numbers.substring(6, 9)}-${numbers.substring(9)}`;
  } else if (numbers.length === 14) {
    // CNPJ: XX.XXX.XXX/XXXX-XX
    return `${numbers.substring(0, 2)}.${numbers.substring(2, 5)}.${numbers.substring(5, 8)}/${numbers.substring(8, 12)}-${numbers.substring(12)}`;
  }
  
  // Return original if not a standard format
  return document;
};
