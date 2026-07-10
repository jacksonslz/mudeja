/**
 * Utility functions for CPF and CNPJ input masking and validation.
 */

/**
 * Formats a given string value as CPF (000.000.000-00) or CNPJ (00.000.000/0000-00) dynamically.
 * @param value The raw or partially formatted input string.
 */
export function formatCpfOrCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  
  if (digits.length <= 11) {
    // CPF formatting
    let formatted = digits;
    if (digits.length > 9) {
      formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    } else if (digits.length > 6) {
      formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    } else if (digits.length > 3) {
      formatted = `${digits.slice(0, 3)}.${digits.slice(3)}`;
    }
    return formatted;
  } else {
    // CNPJ formatting
    let formatted = digits;
    if (digits.length > 12) {
      formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    } else if (digits.length > 8) {
      formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    } else if (digits.length > 5) {
      formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}.${digits.slice(2)}`;
    }
    return formatted;
  }
}

/**
 * Validates a Brazilian CPF number.
 */
export function validateCpf(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, '');
  if (cleanCpf.length !== 11) return false;
  
  // Check for known invalid CPFs
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
  
  // Validate first verifier digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCpf.charAt(9))) return false;
  
  // Validate second verifier digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCpf.charAt(10))) return false;
  
  return true;
}

/**
 * Validates a Brazilian CNPJ number.
 */
export function validateCnpj(cnpj: string): boolean {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  if (cleanCnpj.length !== 14) return false;
  
  // Check for known invalid CNPJs
  if (/^(\d)\1{13}$/.test(cleanCnpj)) return false;
  
  // Validate first digit
  let size = cleanCnpj.length - 2;
  let numbers = cleanCnpj.substring(0, size);
  const digits = cleanCnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let results = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (results !== parseInt(digits.charAt(0))) return false;
  
  // Validate second digit
  size = size + 1;
  numbers = cleanCnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  results = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (results !== parseInt(digits.charAt(1))) return false;
  
  return true;
}

/**
 * Validates a value that can be either CPF or CNPJ.
 * Returns an object with the validation result and the identified type.
 */
export function validateCpfOrCnpj(value: string): { isValid: boolean; type: 'CPF' | 'CNPJ' | 'invalid' } {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length === 11) {
    const isValid = validateCpf(cleanValue);
    return { isValid, type: isValid ? 'CPF' : 'invalid' };
  } else if (cleanValue.length === 14) {
    const isValid = validateCnpj(cleanValue);
    return { isValid, type: isValid ? 'CNPJ' : 'invalid' };
  }
  return { isValid: false, type: 'invalid' };
}
