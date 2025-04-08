
/**
 * Validate a Brazilian CNPJ
 * @param cnpj CNPJ to validate
 * @returns boolean indicating if the CNPJ is valid
 */
export function validateCNPJ(cnpj: string): boolean {
  // Remove non-digit characters
  cnpj = cnpj.replace(/[^\d]/g, '');

  // Check if CNPJ has 14 digits
  if (cnpj.length !== 14) {
    return false;
  }

  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  // Validate verification digits
  const cnpjArray = cnpj.split('').map(Number);
  
  // First verification digit
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += cnpjArray[i] * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  
  let digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  
  if (cnpjArray[12] !== digit) {
    return false;
  }
  
  // Second verification digit
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += cnpjArray[i] * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  
  digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  
  if (cnpjArray[13] !== digit) {
    return false;
  }
  
  return true;
}
