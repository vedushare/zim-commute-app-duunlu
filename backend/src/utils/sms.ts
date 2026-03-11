/**
 * SMS utility – reads all secrets from environment variables.
 *
 * Required env var:
 *   SMS_API_KEY   – API key for sms.localhost.co.zw  (never commit this value)
 *
 * Optional env vars (defaults shown):
 *   SMS_API_URL   – https://sms.localhost.co.zw/api/v1/sms/send
 *   SMS_SENDER_ID – ZimCommute
 *   SMS_ENABLED   – true   (set to "false" to disable SMS sending)
 *   SMS_TEST_MODE – false  (set to "true" to log messages without sending)
 */

export interface SMSRuntimeConfig {
  /** Always returned as empty string – the API key is never sent to clients. */
  apiKey: string;
  apiUrl: string;
  senderId: string;
  enabled: boolean;
  testMode: boolean;
  /** True when SMS_API_KEY is present in the environment. */
  configured: boolean;
}

/** Return a sanitised (no secret) view of the current SMS config for admin APIs. */
export function getSMSRuntimeConfig(): SMSRuntimeConfig {
  return {
    apiKey: '',
    apiUrl: process.env.SMS_API_URL ?? 'https://sms.localhost.co.zw/api/v1/sms/send',
    senderId: process.env.SMS_SENDER_ID ?? 'ZimCommute',
    enabled: process.env.SMS_ENABLED !== 'false',
    testMode: process.env.SMS_TEST_MODE === 'true',
    configured: Boolean(process.env.SMS_API_KEY),
  };
}

export interface SendSMSResult {
  success: boolean;
  message: string;
}

/**
 * Send an SMS message via the configured provider.
 *
 * Throws if SMS_API_KEY is missing (unless SMS is disabled or in test mode).
 */
export async function sendSMS(to: string, body: string): Promise<SendSMSResult> {
  const enabled = process.env.SMS_ENABLED !== 'false';
  if (!enabled) {
    return { success: false, message: 'SMS service is disabled' };
  }

  const testMode = process.env.SMS_TEST_MODE === 'true';
  if (testMode) {
    // In test mode log only – never send over the network
    console.info(`[SMS TEST MODE] To: ${to} | Message: ${body}`);
    return { success: true, message: 'SMS logged (test mode – not actually sent)' };
  }

  const apiKey = process.env.SMS_API_KEY;
  if (!apiKey) {
    throw new Error(
      'SMS_API_KEY environment variable is not set. ' +
        'Configure it on the server – do not commit the key to the repository.'
    );
  }

  const apiUrl =
    process.env.SMS_API_URL ?? 'https://sms.localhost.co.zw/api/v1/sms/send';
  const senderId = process.env.SMS_SENDER_ID ?? 'ZimCommute';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ to, message: body, sender_id: senderId }),
  });

  if (!response.ok) {
    // Do NOT include the API key in error output
    throw new Error(`SMS provider returned HTTP ${response.status}`);
  }

  return { success: true, message: 'SMS sent successfully' };
}

/** Convenience wrapper for sending an OTP code. */
export async function sendOTPSMS(
  phoneNumber: string,
  otp: string
): Promise<SendSMSResult> {
  const message = `Your ZimCommute verification code is: ${otp}. It expires in 5 minutes. Do not share this code.`;
  return sendSMS(phoneNumber, message);
}
