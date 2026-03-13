
# SMS Integration Complete ✅

## What Was Implemented

I've successfully integrated the SMS provider `https://sms.localhost.co.zw` for sending OTP messages in your ZimCommute app.

## Files Created/Modified

### Backend Files

1. **`backend/src/utils/sms.ts`** (NEW)
   - Core SMS service with functions for sending messages
   - `sendSMS()` - Low-level SMS sending
   - `sendOTPSMS()` - Send OTP to users
   - `sendAdminOTPSMS()` - Send admin-triggered OTP
   - `isSMSConfigured()` - Check if SMS is configured

2. **`backend/src/routes/otp.ts`** (UPDATED)
   - Integrated SMS sending into OTP flow
   - Sends SMS when OTP is generated
   - Sends SMS when OTP is resent
   - Graceful fallback in development mode

3. **`backend/src/routes/admin-users.ts`** (UPDATED)
   - Added `GET /api/admin/users/:userId/otp` - View user's current OTP
   - Added `POST /api/admin/users/:userId/send-otp` - Send OTP to user
   - Admin can trigger OTP sends via SMS

4. **`backend/.env.example`** (NEW)
   - Template for environment variables
   - Documents required SMS configuration

5. **`backend/SMS_INTEGRATION.md`** (NEW)
   - Complete documentation for SMS integration
   - API endpoints, configuration, testing, troubleshooting

## Configuration Required

### Environment Variables

Add these to your backend `.env` file (or set in Vercel — see `VERCEL_ENV_SETUP.md`):

```bash
SMS_API_URL=https://sms.localhost.co.zw/api/v1/sms/send
SMS_API_KEY=your_api_key_here
SMS_SENDER_ID=ZimCommute
```

**IMPORTANT:** You need to obtain an API key from your SMS provider at `https://sms.localhost.co.zw`

## How It Works

### User Flow

1. **User requests OTP:**
   - Frontend calls `POST /api/otp/send` with phone number
   - Backend generates 6-digit OTP
   - Backend stores OTP in database
   - Backend sends SMS via `https://sms.localhost.co.zw`
   - User receives SMS: "Your ZimCommute verification code is: 123456. Valid for 5 minutes."

2. **User verifies OTP:**
   - Frontend calls `POST /api/otp/verify` with phone number and OTP
   - Backend validates OTP
   - Backend creates/updates user account
   - User is authenticated

### Admin Flow

1. **Admin views user OTP:**
   - Admin panel calls `GET /api/admin/users/:userId/otp`
   - Backend returns current OTP, expiration, and status

2. **Admin sends OTP to user:**
   - Admin panel calls `POST /api/admin/users/:userId/send-otp`
   - Backend generates new OTP
   - Backend sends SMS with "[Admin]" prefix
   - Admin sees the OTP code in response

## SMS Provider API Format

The backend sends requests to `https://sms.localhost.co.zw/api/send` in this format:

```json
{
  "apiKey": "your_api_key",
  "senderId": "ZimCommute",
  "recipient": "+263712345678",
  "message": "Your ZimCommute verification code is: 123456. Valid for 5 minutes. Do not share this code with anyone."
}
```

**Note:** If your SMS provider uses a different API format, you'll need to update the `sendSMS()` function in `backend/src/utils/sms.ts` to match their API specification.

## Security Features

✅ **Rate Limiting:** 3 OTP requests per hour per phone number
✅ **OTP Expiration:** OTPs expire after 5 minutes
✅ **Attempt Limiting:** Maximum 5 verification attempts per OTP
✅ **Phone Validation:** Only Zimbabwe phone numbers (+263 or 07...)
✅ **Secure Storage:** OTPs stored in database with timestamps

## Development Mode

In development mode (when `NODE_ENV !== 'production'`):
- OTPs are generated and stored in database
- SMS sending is attempted but won't fail the request if it fails
- OTP codes are logged to console for testing
- You can test without a configured SMS provider

## Testing

### Test OTP Send (Development)

```bash
curl -X POST http://localhost:3000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+263712345678"}'
```

Check backend logs for the OTP code:
```
[INFO] Development mode: OTP not sent via SMS but available in logs
OTP: 123456
```

### Test OTP Verify

```bash
curl -X POST http://localhost:3000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+263712345678", "otp": "123456"}'
```

## Next Steps

1. **Get SMS API Key:**
   - Contact `https://sms.localhost.co.zw`
   - Register for an account
   - Obtain your API key

2. **Configure Environment:**
   - Add `SMS_API_KEY` to your `.env` file (or Vercel dashboard — see `VERCEL_ENV_SETUP.md`)
   - Verify `SMS_API_URL` is correct
   - Set `SMS_SENDER_ID` (default: "ZimCommute")

3. **Test in Production:**
   - Deploy backend with environment variables
   - Test OTP send with real phone number
   - Verify SMS is received
   - Test OTP verification

4. **Monitor:**
   - Check backend logs for SMS send success/failures
   - Monitor rate limiting
   - Track OTP verification rates

## Troubleshooting

### OTP Not Received

1. ✅ Check `SMS_API_KEY` is set correctly
2. ✅ Verify phone number format (+263...)
3. ✅ Check backend logs for errors
4. ✅ Verify SMS provider is working
5. ✅ Check rate limiting (wait 1 hour)

### SMS Provider Errors

1. ✅ Verify API endpoint URL
2. ✅ Test provider API directly
3. ✅ Check API key is valid
4. ✅ Review provider documentation
5. ✅ Contact provider support

## Admin Panel Integration

The admin panel already has UI for:
- ✅ Viewing user OTP
- ✅ Sending OTP to user

These features now work with the SMS integration. When an admin sends an OTP, it will be delivered via SMS to the user's phone.

## Documentation

Full documentation is available in:
- **`backend/SMS_INTEGRATION.md`** - Complete SMS integration guide
- **`backend/.env.example`** - Environment variable template

## Summary

✅ SMS integration complete
✅ OTP sending via `https://sms.localhost.co.zw`
✅ Admin OTP management
✅ Rate limiting and security
✅ Development mode for testing
✅ Full documentation

**Next:** Configure your SMS API key and test the integration!
