# Vercel Environment Variable Setup

This guide explains how to configure the SMS/OTP environment variables for the ZimCommute backend deployed on Vercel.

> **Important:** `.env` files committed to the repository are **not** used by Vercel at runtime. You must set environment variables through the Vercel dashboard (or Vercel CLI). Never commit real secrets to `.env` files.

---

## Required Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SMS_API_KEY` | ✅ Yes (unless test mode) | — | API key from your SMS provider (`sms.localhost.co.zw`) |
| `SMS_API_URL` | No | `https://sms.localhost.co.zw/api/v1/sms/send` | SMS provider endpoint |
| `SMS_SENDER_ID` | No | `ZimCommute` | Sender name shown on received SMS |
| `SMS_ENABLED` | No | `true` | Set to `false` to disable SMS entirely |
| `SMS_TEST_MODE` | No | `false` | Set to `true` to log OTPs instead of sending (useful for staging/preview) |

---

## Adding Variables in Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and open your project.
2. Click **Settings** (top navigation).
3. Click **Environment Variables** (left sidebar).
4. For each variable in the table above:
   - Enter the **Name** (e.g. `SMS_API_KEY`).
   - Enter the **Value**.
   - Select the environments to apply it to: **Production**, **Preview**, and/or **Development**.
   - Click **Save**.

5. After adding all variables, **redeploy** your project:
   - Go to the **Deployments** tab.
   - Find the latest deployment.
   - Click the three-dot menu (⋮) → **Redeploy**.

   > Vercel only injects environment variables into a deployment that was built *after* the variable was saved. Existing deployments do not automatically pick up new values.

---

## Recommended Configuration by Environment

### Production
```
SMS_API_KEY=<your-real-api-key>
SMS_API_URL=https://sms.localhost.co.zw/api/v1/sms/send
SMS_SENDER_ID=ZimCommute
SMS_ENABLED=true
SMS_TEST_MODE=false
```

### Preview / Staging
```
SMS_API_KEY=<your-real-api-key>
SMS_ENABLED=true
SMS_TEST_MODE=true   ← logs OTPs instead of sending; safe for PR previews
```

### Development (local)
Copy `backend/.env.example` to `backend/.env` and fill in your values:
```bash
cp backend/.env.example backend/.env
# then edit backend/.env — this file is git-ignored and never committed
```

---

## Runtime Behaviour

| Condition | Behaviour |
|---|---|
| `SMS_ENABLED=false` | No SMS is sent; logs a warning |
| `SMS_TEST_MODE=true` | OTP is logged to console; no HTTP call to provider |
| `SMS_ENABLED=true` + `SMS_TEST_MODE=false` + `SMS_API_KEY` set | OTP sent via provider |
| `SMS_ENABLED=true` + `SMS_TEST_MODE=false` + `SMS_API_KEY` **missing** | Throws a clear error with Vercel configuration instructions; logged in Vercel Function Logs |

At startup the backend calls `validateSMSEnv()`, which logs a clear error message (visible in **Vercel → Project → Functions / Logs**) if `SMS_API_KEY` is missing and SMS is active.

---

## Troubleshooting

### OTP is not received
1. Check **Vercel → Deployments → Functions logs** for any `[SMS]` log lines.
2. Confirm `SMS_API_KEY` is set for the correct environment (Production vs Preview).
3. Confirm you redeployed *after* saving the variable.
4. Temporarily set `SMS_TEST_MODE=true` and redeploy — if you see `[SMS TEST MODE] OTP for …` in logs, the env var configuration is working; the issue is with the API key or provider.

### "SMS_API_KEY environment variable is not set"
The variable was not saved for the target environment, or the deployment predates when you saved it. Add the variable and redeploy.

### HTTP 401 / 403 from provider
The API key is set but invalid. Verify the key in your sms.localhost.co.zw account dashboard.

---

## Security Notes

- **Never commit real API keys** to the repository. `backend/.env` is git-ignored for this reason. Use `backend/.env.example` as a template only.
- The `.env` files that exist locally are only used when running the backend server locally with `npm run dev` (or equivalent). They are not deployed to Vercel.
- Rotate your `SMS_API_KEY` immediately if you suspect it has been exposed.
