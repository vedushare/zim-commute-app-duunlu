
# SMS Integration – Environment-Variable Secret Handling ✅

> **Security update:** The SMS API key is now sourced **exclusively from the `SMS_API_KEY`
> environment variable** on the backend server.  
> ⚠️ **Never commit a real API key to the repository.**

## What Was Implemented

SMS provider `https://sms.localhost.co.zw` is integrated for sending OTP messages.

## Files Created / Modified

### Backend Files

1. **`backend/src/utils/sms.ts`** (NEW)
   - Core SMS service: `sendSMS()`, `sendOTPSMS()`, `getSMSRuntimeConfig()`
   - Reads **all secrets from env vars** – no secret is ever hardcoded.
   - Validates that `SMS_API_KEY` is present before sending; logs a clear error if missing.
   - Supports test mode (`SMS_TEST_MODE=true`) to log messages without sending.

2. **`backend/src/routes/otp.ts`** (UPDATED)
   - Sends SMS via `sendOTPSMS()` after storing the OTP in the database.
   - SMS failure is non-fatal – request succeeds; error is logged.

3. **`backend/src/routes/admin-config.ts`** (UPDATED)
   - `GET /api/admin/sms-config` – returns config from env vars; `apiKey` is always `""`.
   - `POST /api/admin/sms-config` – accepts non-secret fields only; ignores any `apiKey`.
   - `POST /api/admin/sms-config/test` – sends a test SMS using `SMS_API_KEY`.

4. **`backend/.env.example`** (NEW)
   - Template documenting all required and optional SMS env vars.

5. **`app/admin/sms-config.tsx`** (UPDATED)
   - Hardcoded API key removed; default is `""`.
   - API Key field replaced with an info box explaining env-var management.
   - `handleSave` and `handleTestSMS` no longer require or transmit an API key.

6. **`utils/adminApi.ts`** (UPDATED)
   - `apiKey` removed from the `updateSMSConfig` parameter type.

## Configuration Required

### Environment Variables

Add these to your backend `.env` file (copy from `backend/.env.example`):

```bash
# Required – obtain from https://sms.localhost.co.zw dashboard
# ⚠️  DO NOT commit this value to the repository
SMS_API_KEY=<your-key>

# Optional overrides
SMS_API_URL=https://sms.localhost.co.zw/api/v1/sms/send
SMS_SENDER_ID=ZimCommute
SMS_ENABLED=true
SMS_TEST_MODE=false
```

## How It Works

### User Flow

1. Frontend calls `POST /api/otp/send` with phone number.
2. Backend generates OTP, stores it, then calls `sendOTPSMS()`.
3. `sendOTPSMS()` reads `SMS_API_KEY` from env and POSTs to the provider.
4. User receives SMS with the 6-digit code.

### Admin Flow

- **GET /api/admin/sms-config** – returns `{ apiUrl, senderId, enabled, testMode, configured }`.
  `apiKey` is always empty; `configured: true` indicates `SMS_API_KEY` is set.
- **POST /api/admin/sms-config** – updates non-secret display fields (informational only;
  changes require env-var update + server restart).
- **POST /api/admin/sms-config/test** – sends a test SMS using the server-side key.

## Security Guarantees

- API key is **never** stored in the database, returned by any API, committed to git, or
  logged.
- Admin UI has no way to read or submit the API key.
- If `SMS_API_KEY` is missing, a clear error is logged and the test/send endpoints return
  a `503 Service Unavailable` with an actionable message.

## Security Features

✅ Rate Limiting: 3 OTP requests per hour per phone number  
✅ OTP Expiration: 5 minutes  
✅ Attempt Limiting: 5 attempts per OTP  
✅ Phone Validation: Zimbabwe numbers only (+263 / 07xx)  
✅ API key sourced from env var only – never committed

## Testing

### Send OTP

```bash
curl -X POST http://localhost:3000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+263712345678"}'
```

### Test via Admin API

```bash
# Requires valid admin session token
curl -X POST http://localhost:3000/api/admin/sms-config/test \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+263712345678"}'
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "SMS_API_KEY is not configured" | Set `SMS_API_KEY` in backend `.env` and restart server |
| SMS not received, no error | Check `SMS_ENABLED=true` and `SMS_TEST_MODE=false` |
| Provider returns HTTP 4xx | Verify API key is correct and not revoked |
| Rate-limit hit | Wait 1 hour, or clear `rateLimitStore` in dev |

