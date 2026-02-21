
# 🚀 ZimCommute Production Deployment Guide

## 📱 App Overview
**ZimCommute** is a Zimbabwean carpooling platform built with React Native + Expo 54.

### Key Features
- ✅ Phone-based authentication with OTP
- ✅ Ride posting and booking
- ✅ Real-time ride search
- ✅ Driver verification system
- ✅ Emergency SOS alerts
- ✅ Wallet system for payments
- ✅ User ratings and reviews
- ✅ **Comprehensive Admin Panel (Web & Mobile)**

---

## 🌐 Admin Panel Access

### Web Admin Panel (Recommended for Desktop)
**URL:** `https://your-domain.com/admin-web`

**Features:**
- 📊 Real-time dashboard with metrics
- 👥 User management (search, ban, wallet adjustments, OTP viewing)
- ✅ Verification queue (approve/reject ID documents)
- 🚗 Ride management (view, cancel, adjust pricing)
- 🚨 SOS alerts monitoring
- 📋 Reports & moderation
- 🗺️ Route configuration
- 💰 Pricing templates
- 🎟️ Promo code management
- 📈 Analytics & data export
- 📜 Audit logs

**How to Access:**
1. Deploy your app to production (see deployment steps below)
2. Navigate to: `https://your-domain.com/admin-web`
3. Login with an admin account
4. If you don't have admin access, promote a user to admin (see below)

### Mobile Admin Panel
Access via the app's profile screen → "Admin Dashboard" button (only visible to admins)

---

## 🔐 Creating Admin Users

### Method 1: Using Supabase SQL Editor (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run this query to promote a user to admin:

```sql
-- Promote user to admin
UPDATE users 
SET role = 'admin' 
WHERE phone_number = '+263712345678';  -- Replace with actual phone number

-- Or promote to super_admin (full privileges)
UPDATE users 
SET role = 'super_admin' 
WHERE phone_number = '+263712345678';
```

### Method 2: Using Backend API (if you have super_admin access)
```bash
curl -X PUT https://your-backend-url.com/api/admin/users/{userId}/role \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

### User Roles
- **`user`** - Regular passenger/driver (default)
- **`admin`** - Can access admin panel, manage users, moderate content
- **`super_admin`** - Full access including role management and system configuration

---

## 📦 Deployment Steps

### 1. **Prepare for Production**

#### Update Environment Variables
Edit `app.json`:
```json
{
  "expo": {
    "extra": {
      "backendUrl": "https://your-production-backend.com"
    }
  }
}
```

#### Verify Backend URL
The backend is currently: `https://q3k4fsea3tg38xxu8kgvz4h2nvu6gtwh.app.specular.dev`

Make sure this is your production backend or update it accordingly.

### 2. **Build for Android (APK)**

```bash
# Install EAS CLI (if not already installed)
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS Build
eas build:configure

# Build production APK
eas build --platform android --profile production
```

The APK will be available for download once the build completes.

### 3. **Build for iOS**

```bash
# Build production IPA
eas build --platform ios --profile production
```

### 4. **Deploy Web Version**

```bash
# Build web version
npx expo export -p web

# The output will be in the 'dist' folder
# Deploy this folder to your web hosting service (Vercel, Netlify, etc.)
```

#### Deploy to Vercel (Recommended for Web)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Your admin panel will be accessible at: `https://your-domain.vercel.app/admin-web`

### 5. **Submit to App Stores**

#### Google Play Store
```bash
# Submit to Google Play
eas submit --platform android
```

#### Apple App Store
```bash
# Submit to App Store
eas submit --platform ios
```

---

## 🔧 Post-Deployment Configuration

### 1. **Create First Admin User**
After deployment, create your first admin:

```sql
-- In Supabase SQL Editor
UPDATE users 
SET role = 'super_admin' 
WHERE phone_number = '+263YOUR_PHONE';
```

### 2. **Initialize Routes**
1. Login to admin panel: `https://your-domain.com/admin-web`
2. Navigate to **Configuration → Routes**
3. Click **"Initialize Zimbabwe Routes"** to populate common routes

### 3. **Configure Pricing**
1. Go to **Configuration → Pricing Templates**
2. Create pricing templates for different vehicle types
3. Set base price, price per km, and commission rates

### 4. **Create Promo Codes** (Optional)
1. Go to **Configuration → Promo Codes**
2. Create launch promo codes for early users

---

## 📊 Monitoring & Maintenance

### Admin Dashboard Metrics
The admin panel provides real-time monitoring:
- Total users (drivers/passengers)
- Active rides today
- Total revenue
- Verification queue length
- Pending reports
- Active SOS alerts

### Regular Admin Tasks
1. **Daily:**
   - Check SOS alerts
   - Review pending reports
   - Monitor active rides

2. **Weekly:**
   - Review verification queue
   - Check user growth metrics
   - Export revenue reports

3. **Monthly:**
   - Analyze ride trends
   - Review pricing effectiveness
   - Update promo codes

---

## 🐛 Troubleshooting

### Admin Panel Not Loading
1. Check if user has admin role in database
2. Verify backend URL in `app.json`
3. Check browser console for errors
4. Ensure backend is running and accessible

### Can't Access Admin Features
1. Verify user role: `SELECT role FROM users WHERE id = 'your-user-id'`
2. Logout and login again to refresh token
3. Check if backend admin routes are deployed

### Metrics Not Showing
1. Check backend logs for errors
2. Verify database connection
3. Ensure admin API endpoints are accessible

---

## 🔒 Security Best Practices

1. **Protect Admin Routes:**
   - All admin endpoints require authentication
   - Role-based access control (RBAC) is enforced
   - Audit logs track all admin actions

2. **Regular Security Audits:**
   - Review audit logs weekly
   - Monitor for suspicious admin activity
   - Rotate admin credentials periodically

3. **Backup Strategy:**
   - Daily database backups (Supabase handles this)
   - Export critical data weekly
   - Test restore procedures monthly

---

## 📞 Support & Resources

### Documentation
- **Admin Panel Guide:** See the guide section in the web admin dashboard
- **API Documentation:** Check backend README
- **Expo Documentation:** https://docs.expo.dev

### Getting Help
- Check backend logs for API errors
- Review frontend logs in browser console
- Contact support if issues persist

---

## ✅ Production Checklist

Before going live, ensure:

- [ ] Backend is deployed and accessible
- [ ] Environment variables are set correctly
- [ ] First admin user is created
- [ ] Routes are initialized
- [ ] Pricing templates are configured
- [ ] App is tested on both iOS and Android
- [ ] Web admin panel is accessible
- [ ] SOS alert system is tested
- [ ] Payment/wallet system is verified
- [ ] Privacy policy is updated
- [ ] Terms of service are in place
- [ ] App store listings are prepared
- [ ] Analytics are configured
- [ ] Backup strategy is in place

---

## 🎉 You're Ready for Production!

Your ZimCommute app is now production-ready with a fully functional admin panel.

**Next Steps:**
1. Build and deploy the app
2. Create your first admin user
3. Access the admin panel at `/admin-web`
4. Configure routes and pricing
5. Start onboarding users!

**Admin Panel URL:** `https://your-domain.com/admin-web`

Good luck with your launch! 🚀🇿🇼
