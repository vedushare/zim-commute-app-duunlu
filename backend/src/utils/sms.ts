/**
 * SMS utility — sends messages via the configured provider using env-var secrets.
 *
 * Required env vars:
 *   SMS_API_KEY      – provider API key (required when SMS_ENABLED=true and SMS_TEST_MODE=false)
 *   SMS_API_URL      – provider endpoint  (default: https://sms.localhost.co.zw/api/v1/sms/send)
 *   SMS_SENDER_ID    – sender name shown on handset (default: ZimCommute)
 *   SMS_ENABLED      – set to "false" to disable all sending (default: true)
 *   SMS_TEST_MODE    – set to "true" to log-only without sending (default: false)
 *
 * Provider payload contract (sms.localhost.co.zw):
 *   POST <SMS_API_URL>
 *   Content-Type: application/json
 *   Body: { apiKey, senderId, recipient, message }
 *
 * The API key is NEVER stored in the database and is NEVER returned via any API endpoint.
 */

export type SMSSendStatus =
  | 'sent'
  | 'test_mode'
  | 'disabled'
  | 'provider_error'
  | 'connection_error'
  | 'missing_config';

export interface SMSRuntimeConfig {
  apiUrl: string;
  apiKey: string;
  senderId: string;
  enabled: boolean;
  testMode: boolean;
  configured: boolean;
}

export interface SMSSendResult {
  status: SMSSendStatus;
  message: string;
}

/**
 * Returns the current SMS runtime configuration sourced exclusively from environment variables.
 * The apiKey is included here for internal use only — never expose it externally.
 */
export function getSMSRuntimeConfig(): SMSRuntimeConfig {
  const apiKey = process.env.SMS_API_KEY ?? '';
  const apiUrl =
    process.env.SMS_API_URL ?? 'https://sms.localhost.co.zw/api/v1/sms/send';
  const senderId = process.env.SMS_SENDER_ID ?? 'ZimCommute';
  const enabled = process.env.SMS_ENABLED !== 'false';
  const testMode = process.env.SMS_TEST_MODE === 'true';
  const configured = apiKey.length > 0;

  return { apiUrl, apiKey, senderId, enabled, testMode, configured };
}

/**
 * Send an SMS message.
 *
 * SMS failures are non-fatal — callers should log the returned status but
 * must NOT block the OTP flow on SMS failure.
 *
 * @param recipient - Phone number in E.164 format (+263...)
 * @param message   - Message body
 * @returns SMSSendResult describing outcome without exposing the API key
 */
export async function sendSMS(
  recipient: string,
  message: string
): Promise<SMSSendResult> {
  const cfg = getSMSRuntimeConfig();

  if (!cfg.enabled) {
    return { status: 'disabled', message: 'SMS is disabled (SMS_ENABLED=false)' };
  }

  if (cfg.testMode) {
    // Log-only; never actually send
    console.log(
      `[SMS TEST MODE] Would send to ${recipient}: "${message}"`
    );
    return {
      status: 'test_mode',
      message: 'SMS test mode active — message logged but not sent (SMS_TEST_MODE=true)',
    };
  }

  if (!cfg.configured) {
    const err =
      'SMS_API_KEY environment variable is not set. ' +
      'Configure it on the backend server and restart.';
    console.error(`[SMS] ${err}`);
    return { status: 'missing_config', message: err };
  }

  // Build provider payload
  const payload = {
    apiKey: cfg.apiKey,
    senderId: cfg.senderId,
    recipient,
    message,
  };

  try {
    const response = await fetch(cfg.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let body = '';
      try {
        body = await response.text();
      } catch {
        // ignore body read failure
      }
      // Log status + body but never the API key
      console.error(
        `[SMS] Provider error — HTTP ${response.status} — URL: ${cfg.apiUrl} — ` +
          `recipient: ${recipient} — response body: ${body}`
      );
      return {
        status: 'provider_error',
        message: `SMS provider returned HTTP ${response.status}. Check server logs.`,
      };
    }

    return { status: 'sent', message: 'SMS sent successfully' };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unknown network error';
    console.error(
      `[SMS] Connection error — URL: ${cfg.apiUrl} — recipient: ${recipient} — ${message}`
    );
    return {
      status: 'connection_error',
      message: `Failed to reach SMS provider: ${message}`,
    };
  }
}

/**
 * Send an OTP code to a phone number.
 *
 * @param phoneNumber - Recipient in E.164 format
 * @param otp         - 6-digit OTP code
 */
export async function sendOTPSMS(
  phoneNumber: string,
  otp: string
): Promise<SMSSendResult> {
  const message =
    `Your ZimCommute verification code is: ${otp}. ` +
    `Valid for 5 minutes. Do not share this code with anyone.`;
  return sendSMS(phoneNumber, message);
}
