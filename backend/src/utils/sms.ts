import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

// Node.js 18+ has fetch as a global; declare it for TypeScript
declare const fetch: (input: string, init?: {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}) => Promise<{ ok: boolean; status: number; text: () => Promise<string> }>;

export type SMSSendStatus =
  | 'sent'
  | 'test_mode'
  | 'disabled'
  | 'provider_error'
  | 'connection_error';

export interface SMSSendResult {
  status: SMSSendStatus;
  message: string;
}

/**
 * Fetch the current SMS configuration from the database.
 * Returns default values if no config row exists yet.
 */
async function getSMSConfig(app: App) {
  const row = await app.db.query.smsConfig.findFirst({
    where: eq(schema.smsConfig.id, 1),
  });

  return {
    apiUrl: row?.apiUrl ?? 'https://sms.localhost.co.zw/api/v1/sms/send',
    apiKey: row?.apiKey ?? '',
    senderId: row?.senderId ?? 'ZimCommute',
    enabled: row?.enabled ?? false,
    testMode: row?.testMode ?? true,
  };
}

/**
 * Send an OTP SMS message to a phone number.
 * Returns a status indicating the outcome so callers can relay it to the client.
 */
export async function sendOTPSMS(
  app: App,
  phoneNumber: string,
  otp: string
): Promise<SMSSendResult> {
  const config = await getSMSConfig(app);

  const message = `Your ZimCommute verification code is: ${otp}. It expires in 5 minutes. Do not share this code with anyone.`;

  // If SMS is disabled, log OTP and return disabled status
  if (!config.enabled) {
    app.logger.info(
      { phoneNumber },
      `🔐 OTP for ${phoneNumber}: ${otp} (SMS disabled – logged only)`
    );
    return {
      status: 'disabled',
      message: 'SMS service is disabled. OTP logged to console.',
    };
  }

  // If test mode is on, log OTP instead of sending
  if (config.testMode) {
    app.logger.info(
      { phoneNumber },
      `🔐 OTP for ${phoneNumber}: ${otp} (test mode – not sent)`
    );
    return {
      status: 'test_mode',
      message: 'SMS test mode active. OTP logged to console.',
    };
  }

  // Attempt to send SMS via configured provider
  try {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        to: phoneNumber,
        from: config.senderId,
        message,
      }),
    });

    if (response.ok) {
      app.logger.info({ phoneNumber }, 'OTP SMS sent successfully');
      return { status: 'sent', message: 'OTP sent successfully via SMS.' };
    }

    // Provider returned a non-2xx status
    const errorBody = await response.text().catch(() => '');
    app.logger.error(
      { phoneNumber, status: response.status, body: errorBody },
      'SMS provider returned an error'
    );
    // Still log OTP so admin can retrieve it manually
    app.logger.info(
      { phoneNumber },
      `🔐 OTP for ${phoneNumber}: ${otp} (provider error – logged only)`
    );
    return {
      status: 'provider_error',
      message: `SMS provider error (HTTP ${response.status}). OTP logged to console.`,
    };
  } catch (error: any) {
    app.logger.error(
      { err: error, phoneNumber },
      'Failed to connect to SMS provider'
    );
    // Still log OTP so admin can retrieve it manually
    app.logger.info(
      { phoneNumber },
      `🔐 OTP for ${phoneNumber}: ${otp} (connection error – logged only)`
    );
    return {
      status: 'connection_error',
      message: `Unable to reach SMS provider: ${error.message ?? 'Unknown error'}. OTP logged to console.`,
    };
  }
}
