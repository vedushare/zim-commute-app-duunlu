
// Zimbabwe cities for dropdown selection
export const ZIMBABWE_CITIES = [
  'Harare',
  'Bulawayo',
  'Mutare',
  'Gweru',
  'Kwekwe',
  'Masvingo',
  'Chitungwiza',
  'Bindura',
  'Victoria Falls',
  'Hwange',
  'Kariba',
  'Marondera',
  'Kadoma',
  'Chinhoyi',
  'Zvishavane',
  'Chegutu',
  'Redcliff',
  'Rusape',
  'Chiredzi',
  'Karoi',
];

// Zimbabwe phone number validation regex
export const ZIMBABWE_PHONE_REGEX = /^(?:\+263|0)7(?:1|3|7|8)[0-9]{7}$/;

// Format phone number to international format
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with +263
  if (cleaned.startsWith('0')) {
    return '+263' + cleaned.substring(1);
  }
  
  // If starts with 263, add +
  if (cleaned.startsWith('263')) {
    return '+' + cleaned;
  }
  
  // If already has +263, return as is
  if (phone.startsWith('+263')) {
    return phone;
  }
  
  // Otherwise, assume it's missing country code
  return '+263' + cleaned;
}

// Validate Zimbabwe phone number
export function validateZimbabwePhone(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  return ZIMBABWE_PHONE_REGEX.test(formatted);
}
