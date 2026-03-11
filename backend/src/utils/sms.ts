/**
 * Sends an OTP SMS to the given phone number via the configured SMS provider.
 *
 * Environment variables:
 *   SMS_API_KEY     - required (unless SMS_ENABLED=false or SMS_TEST_MODE=true)
 *   SMS_API_URL     - optional, defaults to https://sms.localhost.co.zw/api/v1/sms/send
 *   SMS_SENDER_ID   - optional, defaults to ZimCommute
 *   SMS_ENABLED     - set to "false" to disable SMS sending entirely
 *   SMS_TEST_MODE   - set to "true" to log OTPs instead of sending
 */
export async function sendOTPSMS(otp: string, phoneNumber: string): Promise<void> {
  if (process.env.SMS_ENABLED === 'false') {
    console.warn('[SMS] SMS sending is disabled (SMS_ENABLED=false)');
    return;
  }

  if (process.env.SMS_TEST_MODE === 'true') {
    console.log(`[SMS TEST MODE] OTP for ${phoneNumber}: ${otp}`);
    return;
  }

  const apiKey = process.env.SMS_API_KEY;
  if (!apiKey) {
    throw new Error('SMS_API_KEY environment variable is not set');
  }

  const apiUrl = process.env.SMS_API_URL ?? 'https://sms.localhost.co.zw/api/v1/sms/send';
  const senderId = process.env.SMS_SENDER_ID ?? 'ZimCommute';
  const message = `Your ZimCommute verification code is: ${otp}. It expires in 10 minutes.`;

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, senderId, recipient: phoneNumber, message }),
    });
  } catch (err) {
    throw new Error(`Failed to connect to SMS provider: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '(unreadable)');
    console.error(`[SMS] Provider error: HTTP ${response.status} - ${body}`);
    throw new Error(`SMS provider returned HTTP ${response.status}`);
  }
}
