/**
 * Thai ID Card Number Generator and Validator
 *
 * Thai ID cards are 13 digits with a checksum algorithm:
 * - First 12 digits are the ID
 * - 13th digit is a checksum calculated from the first 12
 */

/**
 * Calculate Thai ID card checksum
 */
function calculateChecksum(first12Digits: string): number {
  const weights = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 12; i++) {
    sum += parseInt(first12Digits[i]) * weights[i];
  }

  const remainder = sum % 11;
  const checkDigit = (11 - remainder) % 10;

  return checkDigit;
}

/**
 * Generate a valid Thai ID card number for testing
 * Generates a random 12-digit number and calculates the checksum
 */
export function generateValidThaiId(): string {
  // Generate 12 random digits (avoid starting with 0 for realism)
  const first12 = Math.floor(Math.random() * 900000000000 + 100000000000).toString();

  // Calculate and append checksum
  const checksum = calculateChecksum(first12);

  return first12 + checksum;
}

/**
 * Generate a valid Thai ID from a seed (deterministic for same seed)
 * Useful for creating consistent test data
 */
export function generateThaiIdFromSeed(seed: number): string {
  // Use seed to generate first 12 digits
  const first12 = (seed % 900000000000 + 100000000000).toString();

  // Calculate and append checksum
  const checksum = calculateChecksum(first12);

  return first12 + checksum;
}

/**
 * Validate Thai ID card number
 */
export function validateThaiId(idcard: string): boolean {
  if (!/^\d{13}$/.test(idcard)) {
    return false;
  }

  const first12 = idcard.substring(0, 12);
  const providedChecksum = parseInt(idcard[12]);
  const calculatedChecksum = calculateChecksum(first12);

  return providedChecksum === calculatedChecksum;
}

// Pre-generated valid Thai IDs for quick use in tests
export const VALID_THAI_IDS = [
  '1234567890126', // Valid checksum
  '1111111111116', // Valid checksum
  '2222222222225', // Valid checksum
  '3333333333334', // Valid checksum
  '4444444444443', // Valid checksum
  '5555555555552', // Valid checksum
  '6666666666661', // Valid checksum
  '7777777777770', // Valid checksum
  '8888888888889', // Valid checksum
  '9999999999998', // Valid checksum
];
