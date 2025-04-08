
/**
 * Formata um número como moeda em Real Brasileiro (BRL)
 */
export const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'R$ 0,00';
  
  // Validar que o valor é um número
  const safeValue = Number.isNaN(Number(value)) ? 0 : Number(value);
  
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(safeValue);
  } catch (error) {
    console.error('Erro ao formatar valor monetário:', error);
    return `R$ ${safeValue.toFixed(2).replace('.', ',')}`;
  }
};

/**
 * Formata uma data como DD/MM/YYYY no formato brasileiro
 */
export const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Verificar se é uma data válida
    if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
      return new Intl.DateTimeFormat('pt-BR').format(dateObj);
    }
    
    return '';
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '';
  }
};

/**
 * Formata um número de telefone no padrão brasileiro
 */
export const formatPhoneNumber = (phone: string | null | undefined) => {
  if (!phone) return '';
  
  // Remove todos caracteres não-numéricos
  const numericOnly = phone.replace(/\D/g, '');
  
  // Trata diferentes comprimentos de números de telefone
  if (numericOnly.length === 11) {
    // Celular: (xx) xxxxx-xxxx
    return numericOnly.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (numericOnly.length === 10) {
    // Fixo: (xx) xxxx-xxxx
    return numericOnly.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (numericOnly.length === 9) {
    // Celular sem DDD: xxxxx-xxxx
    return numericOnly.replace(/(\d{5})(\d{4})/, '$1-$2');
  } else if (numericOnly.length === 8) {
    // Fixo sem DDD: xxxx-xxxx
    return numericOnly.replace(/(\d{4})(\d{4})/, '$1-$2');
  }
  
  // Se não corresponder aos padrões conhecidos, retornar o formato original
  return phone;
};

/**
 * Formata um número de documento CNPJ/CPF no padrão brasileiro
 */
export const formatDocument = (document: string | null | undefined) => {
  if (!document) return '';
  
  // Remove todos caracteres não-numéricos
  const numericOnly = document.replace(/\D/g, '');
  
  // Formatar CNPJ (14 dígitos)
  if (numericOnly.length === 14) {
    return numericOnly.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  
  // Formatar CPF (11 dígitos)
  if (numericOnly.length === 11) {
    return numericOnly.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  
  // Se não corresponder aos padrões conhecidos, retornar o formato original
  return document;
};

/**
 * Formata um número como porcentagem
 */
export const formatPercent = (value: number | null | undefined, decimals: number = 2) => {
  if (value === null || value === undefined) return '0%';
  
  // Validar que o valor é um número
  const safeValue = Number.isNaN(Number(value)) ? 0 : Number(value);
  
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(safeValue / 100);
  } catch (error) {
    console.error('Erro ao formatar percentual:', error);
    return `${safeValue.toFixed(decimals).replace('.', ',')}%`;
  }
};

/**
 * Formata um CEP no padrão brasileiro (12345-678)
 */
export const formatZipCode = (zipCode: string | null | undefined) => {
  if (!zipCode) return '';
  
  // Remove caracteres não-numéricos
  const numericOnly = zipCode.replace(/\D/g, '');
  
  // Formata como CEP se tiver 8 dígitos
  if (numericOnly.length === 8) {
    return numericOnly.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  }
  
  return zipCode;
};

/**
 * Formata um número como valor numérico com separadores brasileiros
 */
export const formatNumber = (value: number | null | undefined, decimals: number = 2) => {
  if (value === null || value === undefined) return '0';
  
  // Validar que o valor é um número
  const safeValue = Number.isNaN(Number(value)) ? 0 : Number(value);
  
  try {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(safeValue);
  } catch (error) {
    console.error('Erro ao formatar número:', error);
    return safeValue.toFixed(decimals).replace('.', ',');
  }
};
