
# OTP/SMS System Audit & Fix – Complete Report

> **Security update (latest):** The SMS API key is now managed **exclusively via the
> `SMS_API_KEY` environment variable** on the backend. It is never stored in the database,
> returned by any API, or committed to the repository.  
> ⚠️ **Never commit a real API key – rotate any previously committed key immediately.**

## 🔍 AUDIT FINDINGS

### Critical Issues Found:
1. ❌ **Missing SMS utility file** – `backend/src/utils/sms.ts` didn't exist
2. ❌ **No actual SMS sending** – OTP was generated but never sent via SMS
3. ❌ **Hardcoded API key** – `app/admin/sms-config.tsx` contained a real API key as a default value
4. ❌ **No OTP logging for testing** – When SMS failed, OTP wasn't logged for manual verification
5. ❌ **Phone validation inconsistency** – Frontend and backend used different validation logic
6. ❌ **No SMS integration in OTP routes** – OTP endpoints didn't call SMS sending functions

## ✅ FIXES IMPLEMENTED

### 1. Created SMS Utility (`backend/src/utils/sms.ts`)
**Features:**
- `getSMSRuntimeConfig()` – Returns sanitised config (no secret) for admin API responses
- `sendSMS()` – Low-level SMS sending via `SMS_API_KEY` env var
- `sendOTPSMS()` – Sends OTP message to a phone number
- **Secret sourced from env only** – `SMS_API_KEY` must be set on the server
- **Test mode support** – Logs OTP without sending when `SMS_TEST_MODE=true`
- **Clear error on missing key** – Returns actionable message if `SMS_API_KEY` is unset

### 2. Database Schema – No `sms_config` table needed
The API key is not stored in the database. Non-secret config (URL, sender ID, enabled, test mode)
is controlled via environment variables. This eliminates the risk of key exposure via DB access.

### 3. Integrated SMS into OTP Routes (`backend/src/routes/otp.ts`)
**Changes:**
- ✅ Calls `sendOTPSMS()` after generating OTP
- ✅ SMS failure is non-fatal – logs error and continues
- ✅ Improved phone number normalization

### 4. Admin SMS Config Routes (`backend/src/routes/admin-config.ts`)
**Endpoints:**
- `GET /api/admin/sms-config` – Returns config from env vars; `apiKey` is always `""`
- `POST /api/admin/sms-config` – Accepts non-secret fields only; `apiKey` field is ignored
- `POST /api/admin/sms-config/test` – Sends test SMS using `SMS_API_KEY` env var

**Security:**
- API key is **never returned** to any client
- `configured: true/false` indicates whether `SMS_API_KEY` is set

### 5. Removed Hardcoded API Key from Admin UI (`app/admin/sms-config.tsx`)
- Default `apiKey` value changed from hardcoded secret → `""`
- API Key text input replaced with an info box explaining env-var management
- `handleSave` and `handleTestSMS` no longer require or transmit the API key

### 6. Updated Admin API Client (`utils/adminApi.ts`)
- `apiKey` removed from `updateSMSConfig` parameter type

### 7. Created `backend/.env.example`
Documents all required and optional SMS environment variables.

## 🛡️ SECRET HANDLING

| Location | API key present? |
|----------|-----------------|
| Source code | ❌ Never |
| Database | ❌ Never |
| API responses | ❌ Never (always `""`) |
| Server environment (`SMS_API_KEY`) | ✅ Required |
| `backend/.env.example` | Empty placeholder only |

## ⚙️ CONFIGURATION

```bash
# backend/.env
SMS_API_KEY=<your-key>          # Required – never commit this value
SMS_API_URL=https://sms.localhost.co.zw/api/v1/sms/send
SMS_SENDER_ID=ZimCommute
SMS_ENABLED=true
SMS_TEST_MODE=false
```

## 🎯 HOW IT WORKS NOW

### Normal Flow (SMS Working):
1. User enters phone number → Validates format
2. Backend generates 6-digit OTP → Stores in database
3. Backend calls `sendOTPSMS()` → Reads `SMS_API_KEY` from env → Sends via sms.localhost.co.zw
4. User receives SMS with OTP

### Fallback Flow (SMS Fails / Key Missing):
1. OTP is still stored in the database
2. Error is logged server-side (no OTP in logs – use DB for manual lookup)
3. HTTP response still returns `success: true` so the user can proceed to the verify screen

### Test Mode (`SMS_TEST_MODE=true`):
1. OTP is logged as `[SMS TEST MODE] To: ... | Message: ...`
2. SMS is NOT sent (saves costs during development)

## 📊 LOGGING & DEBUGGING

```
[INFO] OTP generated and stored successfully { phoneNumber: '+263712345678' }
[ERROR] Failed to send OTP SMS – check SMS_API_KEY env var { err: '...' }
```

Test mode:
```
[SMS TEST MODE] To: +263712345678 | Message: Your ZimCommute verification code is: 123456...
```

## ✅ VERIFICATION CHECKLIST

- [x] SMS utility created – reads secrets from env only
- [x] Hardcoded API key removed from all source files
- [x] OTP routes integrated with SMS sending
- [x] Admin SMS config endpoints – apiKey always masked/empty
- [x] Admin UI – API key field replaced with env-var info box
- [x] `backend/.env.example` created with documentation
- [x] `SMS_INTEGRATION_SUMMARY.md` updated
- [x] Test mode and disabled mode supported
- [x] Rate limiting retained
- [x] Clear error messages when `SMS_API_KEY` is missing

## 🚀 NEXT STEPS

1. **Set `SMS_API_KEY`** on your backend server (do not commit it)
2. **Restart the backend** to pick up the env var
3. **Test** via Admin Panel → SMS Config → Send Test SMS
4. **Monitor logs** for any provider errors

## 📝 NOTES

- **No DB table for SMS config** – env vars are the single source of truth for secrets
- **Test Mode** – perfect for local development; set `SMS_TEST_MODE=true`
- **Rate Limiting** – 3 OTP requests per hour per phone number
- **Expiration** – OTPs expire after 5 minutes; max 5 verification attempts

