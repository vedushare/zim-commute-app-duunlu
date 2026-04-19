import bcrypt from 'bcrypt';

/**
 * Hashes a given OTP using bcrypt.
 * @param {string} otp - The OTP to hash.
 * @returns {Promise<string>} - The hashed OTP.
 */
export async function hashOTP(otp: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(otp, saltRounds);
}

/**
 * Verifies if the provided OTP matches the hashed OTP.
 * @param {string} otp - The OTP to verify.
 * @param {string} hashedOTP - The hashed OTP to compare against.
 * @returns {Promise<boolean>} - True if the OTP matches, else false.
 */
export async function verifyOTP(otp: string, hashedOTP: string): Promise<boolean> {
    return await bcrypt.compare(otp, hashedOTP);
}