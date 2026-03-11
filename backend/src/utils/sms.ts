/**
 * Sends an OTP SMS to the given phone number.
 * TODO: Replace with a real SMS provider (e.g. Twilio, Africa's Talking).
 */
export async function sendOTPSMS(otp: string, phoneNumber: string): Promise<void> {
  // In production, integrate with an SMS provider here.
  console.log(`[SMS] Sending OTP ${otp} to ${phoneNumber}`);
}
