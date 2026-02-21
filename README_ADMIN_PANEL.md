
# 🎯 ZimCommute Admin Panel - Complete Guide

## 🌐 Quick Access

### **Web Admin Panel (Recommended)**
**URL:** `https://your-domain.com/admin-web`

**Current Backend:** `https://q3k4fsea3tg38xxu8kgvz4h2nvu6gtwh.app.specular.dev`

---

## 🚀 Getting Started in 3 Steps

### Step 1: Create Your First Admin User

You need to promote a user to admin role. Choose one method:

#### **Method A: Using Supabase Dashboard (Easiest)**
1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Run this query:

```sql
-- Replace with your actual phone number
UPDATE users 
SET role = 'super_admin' 
WHERE phone_number = '+263712345678';
```

4. Verify the update:
```sql
SELECT id, phone_number, full_name, role 
FROM users 
WHERE role IN ('admin', 'super_admin');
```

#### **Method B: Using Backend API (If you have existing admin access)**
```bash
curl -X PUT https://q3k4fsea3tg38xxu8kgvz4h2nvu6gtwh.app.specular.dev/api/admin/users/{userId}/role \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "super_admin"}'
```

### Step 2: Access the Admin Panel

1. **Open your browser** and navigate to:
   - **Local Development:** `http://localhost:8081/admin-web`
   - **Production:** `https://your-domain.com/admin-web`

2. **Login** with your admin phone number and OTP

3. **You're in!** The dashboard will load with real-time metrics

### Step 3: Initialize System Data

On first access, initialize the system:

1. Go to **Configuration → Routes**
2. Click **"Initialize Zimbabwe Routes"**
3. This will populate:
   - Common city-to-city routes (Harare ↔ Bulawayo, etc.)
   - Default pricing template
   - Suggested prices based on distance

---

## 📊 Admin Panel Features

### 1. **Dashboard** 📊
**What you see:**
- Total users (drivers/passengers)
- Active rides today
- Total revenue
- Verification queue length
- Pending reports
- Active SOS alerts

**Quick Actions:**
- Manage Users
- Review Verifications
- Check SOS Alerts
- Review Reports
- Configure Routes
- View Analytics

### 2. **User Management** 👥
**Capabilities:**
- ✅ Search users by name or phone
- ✅ View user details and statistics
- ✅ View and send OTP codes
- ✅ Ban/unban users with reasons
- ✅ Adjust wallet balances
- ✅ Create new users manually
- ✅ Update user information
- ✅ Delete users (permanent)
- ✅ Change user roles (super_admin only)

**Common Workflows:**

**Help User Login:**
```
1. Search user by phone number
2. Click "View OTP"
3. Share OTP with user (securely)
```

**Ban Problematic User:**
```
1. Search user
2. Click "Ban User"
3. Enter reason (e.g., "Inappropriate behavior")
4. Confirm
```

**Adjust Wallet:**
```
1. Search user
2. Click "Adjust Wallet"
3. Enter amount (positive to add, negative to deduct)
4. Enter reason (e.g., "Refund for cancelled ride")
5. Confirm
```

### 3. **Verification Queue** ✅
**Capabilities:**
- ✅ Review ID documents
- ✅ View document images
- ✅ Approve verified users
- ✅ Reject with reasons
- ✅ Track verification status

**Workflow:**
```
1. Click on pending document
2. View ID image (full screen)
3. Verify information matches user profile
4. Approve → User gets verified badge
   OR
   Reject → Enter reason → User notified
```

**Document Types:**
- National ID
- Driver's License
- Passport
- Vehicle Registration

### 4. **Ride Management** 🚗
**Capabilities:**
- ✅ View all rides (active, completed, cancelled)
- ✅ Filter by status and date
- ✅ Cancel problematic rides
- ✅ Adjust ride pricing
- ✅ View ride details and bookings

**Common Actions:**

**Cancel Ride:**
```
1. Find ride
2. Click "Cancel Ride"
3. Enter reason (e.g., "Driver reported vehicle issue")
4. Confirm → Passengers notified and refunded
```

**Adjust Price:**
```
1. Find ride
2. Click "Adjust Price"
3. Enter new price
4. Enter reason (e.g., "Route pricing correction")
5. Confirm
```

### 5. **SOS Alerts** 🚨
**Capabilities:**
- ✅ Monitor active emergencies
- ✅ View alert location
- ✅ See user details
- ✅ Resolve alerts with notes
- ✅ Track alert history

**Emergency Response Protocol:**
```
1. Alert appears with red badge
2. Click to view details
3. Check location (map view)
4. Contact user immediately
5. Contact emergency services if needed
6. Mark as resolved with notes
```

**Priority:** SOS alerts require immediate attention!

### 6. **Reports & Moderation** 📋
**Capabilities:**
- ✅ Review user reports
- ✅ Filter by category (Safety, Behavior, Payment, Vehicle)
- ✅ View evidence (photos, descriptions)
- ✅ Take moderation actions
- ✅ Resolve incidents

**Report Categories:**
- **Safety:** Dangerous driving, harassment
- **Behavior:** Rudeness, no-show
- **Payment:** Overcharging, refund issues
- **Vehicle:** Condition, cleanliness

**Workflow:**
```
1. Review report details
2. Check evidence
3. Contact involved parties if needed
4. Take action:
   - Ban user (temporary/permanent)
   - Warn user
   - No action (false report)
5. Add admin notes
6. Mark as resolved
```

### 7. **Configuration** ⚙️

#### **Routes** 🗺️
**Capabilities:**
- ✅ View all routes
- ✅ Create new routes
- ✅ Edit route details
- ✅ Delete routes
- ✅ Mark popular routes
- ✅ Initialize Zimbabwe routes

**Route Fields:**
- Origin city
- Destination city
- Distance (km)
- Estimated duration (minutes)
- Suggested price ($)
- Popular flag

#### **Pricing Templates** 💰
**Capabilities:**
- ✅ Create pricing models
- ✅ Set base price
- ✅ Configure price per km
- ✅ Set commission rates
- ✅ Activate/deactivate templates

**Example Template:**
```
Name: Standard Sedan
Base Price: $5.00
Price per KM: $0.50
Commission Rate: 15%
```

#### **Promo Codes** 🎟️
**Capabilities:**
- ✅ Create discount codes
- ✅ Set discount type (percentage/fixed)
- ✅ Set expiration dates
- ✅ Limit usage count
- ✅ Track redemptions
- ✅ Activate/deactivate codes

**Example Promo:**
```
Code: LAUNCH50
Type: Percentage
Value: 50%
Max Uses: 100
Valid: 2024-01-01 to 2024-01-31
```

### 8. **Analytics** 📈
**Capabilities:**
- ✅ View revenue reports
- ✅ Track user growth
- ✅ Monitor ride trends
- ✅ Analyze popular routes
- ✅ Export data (CSV)

**Available Reports:**
- User growth (daily/weekly/monthly)
- Revenue trends
- Ride completion rates
- Popular routes
- Driver performance
- Passenger activity

**Export Options:**
- Users list (CSV)
- Rides data (CSV)
- Revenue report (CSV)

### 9. **Audit Logs** 📜
**Capabilities:**
- ✅ View all admin actions
- ✅ Filter by admin
- ✅ Filter by action type
- ✅ Track changes
- ✅ Accountability

**Logged Actions:**
- User banned/unbanned
- Wallet adjusted
- Role changed
- Verification approved/rejected
- Ride cancelled
- Price adjusted
- Report reviewed
- SOS alert resolved

---

## 🔐 User Roles & Permissions

### **User** (Default)
- Regular passenger or driver
- No admin access

### **Admin**
- Access admin panel
- Manage users (view, ban, wallet)
- Review verifications
- Manage rides
- Handle reports and SOS
- Configure routes and pricing
- View analytics
- **Cannot:** Change user roles

### **Super Admin**
- All admin permissions
- **Plus:** Change user roles
- Promote users to admin
- Full system configuration

---

## 🛠️ Technical Details

### **Backend API Endpoints**

All admin endpoints require authentication and admin role.

#### **Dashboard**
- `GET /api/admin/dashboard/metrics` - Get overview metrics
- `GET /api/admin/dashboard/analytics` - Get analytics data

#### **User Management**
- `GET /api/admin/users` - Search and list users
- `GET /api/admin/users/:userId` - Get user details
- `GET /api/admin/users/:userId/otp` - View user OTP
- `POST /api/admin/users/:userId/send-otp` - Send new OTP
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:userId` - Update user
- `DELETE /api/admin/users/:userId` - Delete user
- `PUT /api/admin/users/:userId/ban` - Ban user
- `PUT /api/admin/users/:userId/unban` - Unban user
- `PUT /api/admin/users/:userId/wallet` - Adjust wallet
- `PUT /api/admin/users/:userId/role` - Change role (super_admin only)

#### **Verification**
- `GET /api/admin/verification/queue` - Get pending verifications
- `PUT /api/admin/verification/:docId/approve` - Approve document
- `PUT /api/admin/verification/:docId/reject` - Reject document

#### **Rides**
- `GET /api/admin/rides` - List all rides
- `PUT /api/admin/rides/:rideId/cancel` - Cancel ride
- `PUT /api/admin/rides/:rideId/adjust-price` - Adjust price

#### **Safety**
- `GET /api/admin/reports` - Get reports
- `PUT /api/admin/reports/:reportId/review` - Review report
- `GET /api/admin/sos-alerts` - Get SOS alerts
- `PUT /api/admin/sos-alerts/:alertId/resolve` - Resolve alert

#### **Configuration**
- `GET /api/admin/routes` - Get routes
- `POST /api/admin/routes` - Create route
- `PUT /api/admin/routes/:routeId` - Update route
- `DELETE /api/admin/routes/:routeId` - Delete route
- `POST /api/admin/init-routes` - Initialize Zimbabwe routes
- `GET /api/admin/pricing-templates` - Get pricing templates
- `POST /api/admin/pricing-templates` - Create template
- `PUT /api/admin/pricing-templates/:id` - Update template
- `GET /api/admin/promo-codes` - Get promo codes
- `POST /api/admin/promo-codes` - Create promo code
- `PUT /api/admin/promo-codes/:id` - Update promo code
- `DELETE /api/admin/promo-codes/:id` - Delete promo code

#### **Audit**
- `GET /api/admin/audit-logs` - Get audit logs

### **Authentication**
All admin endpoints use Bearer token authentication:
```
Authorization: Bearer <your-auth-token>
```

The token is automatically included by the frontend when you're logged in.

---

## 🐛 Troubleshooting

### **Problem:** Can't access admin panel - "Access Denied"
**Solution:**
1. Check your role in database:
   ```sql
   SELECT role FROM users WHERE phone_number = '+263YOUR_PHONE';
   ```
2. If role is `user`, update to `admin` or `super_admin`
3. Logout and login again to refresh token

### **Problem:** Dashboard metrics not loading
**Solution:**
1. Check browser console for errors (F12)
2. Verify backend is running: `https://q3k4fsea3tg38xxu8kgvz4h2nvu6gtwh.app.specular.dev/api/admin/dashboard/metrics`
3. Check if you're logged in
4. Refresh the page

### **Problem:** Can't view OTP for user
**Solution:**
1. Verify user exists in database
2. Try "Send OTP" to generate new one
3. Check backend logs for errors

### **Problem:** "Initialize Routes" button not working
**Solution:**
1. Routes may already be initialized
2. Check Configuration → Routes to see existing routes
3. If empty, check backend logs for errors

### **Problem:** Images not loading in verification queue
**Solution:**
1. Check if image URLs are valid
2. Verify storage/CDN is accessible
3. Check browser console for CORS errors

---

## 📱 Mobile Admin Access

### **Via App Profile Screen**
1. Open ZimCommute app
2. Login with admin account
3. Go to **Profile** tab
4. Tap **"Admin Dashboard"** button (only visible to admins)
5. Access admin features

**Note:** Web interface is recommended for desktop use. Mobile app admin is best for quick checks on the go.

---

## 🔒 Security Best Practices

### **1. Protect Admin Credentials**
- Use strong passwords
- Never share admin credentials
- Logout when done
- Use secure networks

### **2. Regular Monitoring**
- Check SOS alerts multiple times daily
- Review reports weekly
- Monitor audit logs regularly
- Track unusual activity

### **3. Document Actions**
- Always add notes when taking actions
- Reasons are logged in audit trail
- Helps with accountability and disputes

### **4. Data Privacy**
- Only access user data when necessary
- Don't share user information
- Follow data protection regulations
- Secure OTP codes

### **5. Backup Strategy**
- Export data regularly
- Keep backups secure
- Test restore procedures
- Document backup locations

---

## 📞 Support & Resources

### **Documentation**
- **Production Deployment:** `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Quick Start:** `ADMIN_PANEL_QUICK_START.md`
- **Backend API:** Check backend README
- **Expo Docs:** https://docs.expo.dev

### **Getting Help**
1. Check browser console for errors (F12)
2. Review backend logs
3. Check this documentation
4. Contact technical support

---

## ✅ Admin Checklist

### **Daily Tasks**
- [ ] Check SOS alerts (multiple times)
- [ ] Review new reports
- [ ] Monitor active rides
- [ ] Check dashboard metrics
- [ ] Respond to urgent issues

### **Weekly Tasks**
- [ ] Review verification queue
- [ ] Analyze user growth
- [ ] Check revenue reports
- [ ] Review audit logs
- [ ] Update promo codes if needed

### **Monthly Tasks**
- [ ] Export data for records
- [ ] Update pricing if needed
- [ ] Create new promo codes
- [ ] Review system performance
- [ ] Analyze trends and insights

---

## 🎉 You're Ready!

**Admin Panel URL:** `https://your-domain.com/admin-web`

**Current Backend:** `https://q3k4fsea3tg38xxu8kgvz4h2nvu6gtwh.app.specular.dev`

### **Next Steps:**
1. ✅ Create your first admin user (see Step 1)
2. ✅ Access the admin panel
3. ✅ Initialize Zimbabwe routes
4. ✅ Configure pricing templates
5. ✅ Create launch promo codes
6. ✅ Start managing your platform!

**Remember:**
- Be fair and consistent
- Document all actions
- Respond to emergencies quickly
- Monitor metrics regularly
- Keep user data secure

Happy administrating! 🚀🇿🇼

---

## 📊 Quick Reference

### **User Roles**
- `user` - Regular user
- `admin` - Admin access
- `super_admin` - Full access

### **Verification Levels**
- `PhoneVerified` - Phone verified
- `IDUploaded` - ID uploaded
- `FullyVerified` - Fully verified

### **Ride Status**
- `active` - Active ride
- `completed` - Completed
- `cancelled` - Cancelled

### **Report Categories**
- `Safety` - Safety concerns
- `Behavior` - Behavior issues
- `Payment` - Payment disputes
- `Vehicle` - Vehicle problems

### **SOS Alert Status**
- `active` - Active emergency
- `resolved` - Resolved

### **Promo Code Types**
- `percentage` - Percentage discount
- `fixed` - Fixed amount discount

---

**Last Updated:** 2024
**Version:** 1.0.0
**Platform:** ZimCommute Admin Panel
