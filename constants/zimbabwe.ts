
/**
 * Zimbabwe-specific constants and utilities
 */

// Zimbabwe cities for ride-sharing
export const ZIMBABWE_CITIES = [
  'Harare',
  'Bulawayo',
  'Chitungwiza',
  'Mutare',
  'Gweru',
  'Kwekwe',
  'Kadoma',
  'Masvingo',
  'Chinhoyi',
  'Norton',
  'Marondera',
  'Ruwa',
  'Chegutu',
  'Zvishavane',
  'Bindura',
  'Beitbridge',
  'Redcliff',
  'Victoria Falls',
  'Hwange',
  'Chiredzi',
] as const;

export type ZimbabweCity = typeof ZIMBABWE_CITIES[number];

// Zimbabwe phone number validation
// Accepts formats: +263712345678, 0712345678, 263712345678
// Valid prefixes: 71, 73, 77, 78 (Econet, NetOne, Telecel)
export const ZIMBABWE_PHONE_REGEX = /^(?:\+263|0|263)7(?:1|3|7|8)[0-9]{7}$/;

/**
 * Validate Zimbabwe phone number
 */
export function validateZimbabwePhone(phoneNumber: string): boolean {
  if (!phoneNumber) return false;
  
  // Remove all spaces and special characters for validation
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  return ZIMBABWE_PHONE_REGEX.test(cleaned);
}

/**
 * Format phone number to +263 format
 */
export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // Remove all spaces and special characters
  let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // If starts with 0, replace with +263
  if (cleaned.startsWith('0')) {
    return '+263' + cleaned.slice(1);
  }
  
  // If starts with 263, add +
  if (cleaned.startsWith('263')) {
    return '+' + cleaned;
  }
  
  // If already starts with +263, return as is
  if (cleaned.startsWith('+263')) {
    return cleaned;
  }
  
  // Otherwise, assume it's missing country code
  return '+263' + cleaned;
}

/**
 * Format phone number for display (masked)
 */
export function maskPhoneNumber(phoneNumber: string): string {
  const formatted = formatPhoneNumber(phoneNumber);
  
  // Format: +263 71 *** ****
  if (formatted.length >= 13) {
    return `${formatted.slice(0, 4)} ${formatted.slice(4, 6)} *** ****`;
  }
  
  return formatted;
}

/**
 * Parse phone number input (allows partial input)
 */
export function parsePhoneInput(input: string): string {
  // Remove all non-digit characters except +
  let cleaned = input.replace(/[^\d+]/g, '');
  
  // If starts with +263, keep it
  if (cleaned.startsWith('+263')) {
    return cleaned;
  }
  
  // If starts with 263, add +
  if (cleaned.startsWith('263')) {
    return '+' + cleaned;
  }
  
  // If starts with 0, keep it (user is typing)
  if (cleaned.startsWith('0')) {
    return cleaned;
  }
  
  // Otherwise return as is
  return cleaned;
}

// Zimbabwe currency
export const ZIMBABWE_CURRENCY = 'USD'; // Zimbabwe uses USD primarily

// Popular routes (for quick selection)
export const POPULAR_ROUTES = [
  { origin: 'Harare', destination: 'Bulawayo' },
  { origin: 'Harare', destination: 'Mutare' },
  { origin: 'Harare', destination: 'Gweru' },
  { origin: 'Bulawayo', destination: 'Victoria Falls' },
  { origin: 'Harare', destination: 'Masvingo' },
  { origin: 'Harare', destination: 'Chitungwiza' },
] as const;

// Emergency numbers in Zimbabwe
export const EMERGENCY_NUMBERS = {
  police: '995',
  ambulance: '994',
  fire: '993',
} as const;
