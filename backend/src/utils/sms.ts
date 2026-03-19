/**
 * Validates that required SMS environment variables are present and logs guidance
 * when variables are missing. Call this once at application startup.
 *
 * Safe to call in all environments; it only logs warnings and does not throw.
 */
export function validateSMSEnv(): void {
  const enabled = process.env.SMS_ENABLED !== 'false';
  const testMode = process.env.SMS_TEST_MODE === 'true';

  if (!enabled) {
    console.info('[SMS] SMS sending is disabled (SMS_ENABLED=false). No validation needed.');
    return;
  }

  if (testMode) {
    console.info('[SMS] Running in test mode (SMS_TEST_MODE=true). OTPs will be logged instead of sent.');
    return;
  }

  if (!process.env.SMS_API_KEY) {
    console.error(
      '[SMS] CONFIGURATION ERROR: SMS_API_KEY is not set.\n' +
      '  On Vercel: Project Settings → Environment Variables → add SMS_API_KEY → select Production/Preview/Development → Save → Redeploy.\n' +
      '  Alternatively, set SMS_TEST_MODE=true to log OTPs without sending (safe for testing).\n' +
      '  See VERCEL_ENV_SETUP.md for full instructions.'
    );
  }
}

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
export async function sendOTPSMS(otp: string, phoneNumber: string): Promise<'sent' | 'disabled' | 'test_mode'> {
  if (process.env.SMS_ENABLED === 'false') {
    console.warn('[SMS] SMS sending is disabled (SMS_ENABLED=false)');
    return 'disabled';
  }

  if (process.env.SMS_TEST_MODE === 'true') {
    console.log(`[SMS TEST MODE] OTP for ${phoneNumber}: ${otp}`);
    return 'test_mode';
  }

  const apiKey = process.env.SMS_API_KEY;
  if (!apiKey) {
    throw new Error(
      'SMS_API_KEY environment variable is not set. ' +
      'On Vercel, add it in Project Settings → Environment Variables → SMS_API_KEY → select Production/Preview/Development → Save → Redeploy. ' +
      'To skip SMS sending during testing, set SMS_TEST_MODE=true.'
    );
  }

  const apiUrl = process.env.SMS_API_URL ?? 'https://sms.localhost.co.zw/api/v1/sms/send';
  const sender = process.env.SMS_SENDER_ID ?? 'ZimCommute';
  const message = `Your ZimCommute verification code is: ${otp}. It expires in 10 minutes.`;

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, sender, to: phoneNumber, message }),
    });
  } catch (err) {
    throw new Error(`Failed to connect to SMS provider: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '(unreadable)');
    console.error(`[SMS] Provider error: HTTP ${response.status} - ${body}`);
    throw new Error(`SMS provider returned HTTP ${response.status}`);
  }

  return 'sent';
}
