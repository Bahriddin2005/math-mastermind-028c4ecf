/**
 * Formats a phone number as user types
 * Supports Uzbekistan format: +998 XX XXX XX XX
 */
export const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters except +
  let cleaned = value.replace(/[^\d+]/g, '');
  
  // Ensure it starts with + if there are digits
  if (cleaned && !cleaned.startsWith('+')) {
    // If starts with 998, add +
    if (cleaned.startsWith('998')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.startsWith('9') && cleaned.length <= 2) {
      // User might be typing 998
      cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+')) {
      cleaned = '+998' + cleaned;
    }
  }
  
  // Limit length
  if (cleaned.length > 13) {
    cleaned = cleaned.slice(0, 13);
  }
  
  // Format the number
  let formatted = '';
  const digits = cleaned.replace('+', '');
  
  if (digits.length === 0) {
    return cleaned.startsWith('+') ? '+' : '';
  }
  
  // Country code (998)
  if (digits.length >= 3) {
    formatted = '+' + digits.slice(0, 3);
  } else {
    formatted = '+' + digits;
    return formatted;
  }
  
  // Operator code (XX)
  if (digits.length >= 5) {
    formatted += ' ' + digits.slice(3, 5);
  } else if (digits.length > 3) {
    formatted += ' ' + digits.slice(3);
    return formatted;
  }
  
  // First part (XXX)
  if (digits.length >= 8) {
    formatted += ' ' + digits.slice(5, 8);
  } else if (digits.length > 5) {
    formatted += ' ' + digits.slice(5);
    return formatted;
  }
  
  // Second part (XX)
  if (digits.length >= 10) {
    formatted += ' ' + digits.slice(8, 10);
  } else if (digits.length > 8) {
    formatted += ' ' + digits.slice(8);
    return formatted;
  }
  
  // Third part (XX)
  if (digits.length > 10) {
    formatted += ' ' + digits.slice(10, 12);
  }
  
  return formatted;
};

/**
 * Removes formatting from phone number for storage
 */
export const unformatPhoneNumber = (value: string): string => {
  return value.replace(/\s/g, '');
};

/**
 * Validates phone number format
 */
export const isValidPhoneNumber = (value: string): boolean => {
  const cleaned = value.replace(/[\s\-]/g, '');
  return /^\+998[0-9]{9}$/.test(cleaned);
};
