
# 🎯 Admin Panel Quick Start Guide

## 🌐 Accessing the Admin Panel

### Web Interface (Recommended)
**URL:** `https://your-domain.com/admin-web`

**Login:**
1. Open the URL in your browser
2. Login with your phone number and OTP
3. You'll be redirected to the admin dashboard

**Requirements:**
- Admin or super_admin role
- Active internet connection
- Modern web browser (Chrome, Firefox, Safari, Edge)

---

## 🔐 Getting Admin Access

### If You're Not an Admin Yet:

**Option 1: Database Update (Requires Supabase Access)**
```sql
-- In Supabase SQL Editor
UPDATE users 
SET role = 'admin' 
WHERE phone_number = '+263YOUR_PHONE';
```

**Option 2: Ask an Existing Super Admin**
Contact a super_admin to promote your account via the admin panel.

---

## 📊 Admin Dashboard Overview

### Main Sections

#### 1. **Dashboard** 📊
- Real-time metrics
- User statistics
- Revenue tracking
- Quick action buttons

#### 2. **User Management** 👥
**What you can do:**
- Search users by name or phone
- View user details and OTP codes
- Ban/unban users
- Adjust wallet balances
- Create new users manually
- Update user information

**Common Tasks:**
```
Search User → View Details → Take Action
- View OTP: See current OTP code
- Send OTP: Generate and send new OTP
- Ban User: Temporarily suspend account
- Adjust Wallet: Add/remove funds
- Delete User: Permanently remove account
```

#### 3. **Verification Queue** ✅
**What you can do:**
- Review ID documents
- Approve verified users
- Reject with reasons
- View document images

**Workflow:**
```
Pending Documents → View Image → Approve/Reject
- Check ID quality
- Verify information matches
- Approve: User gets verified badge
- Reject: User notified with reason
```

#### 4. **Ride Management** 🚗
**What you can do:**
- View all rides (active, completed, cancelled)
- Cancel problematic rides
- Adjust ride pricing
- Monitor ride details

**Common Actions:**
```
View Rides → Select Ride → Take Action
- Cancel: Stop ride with reason
- Adjust Price: Change ride cost
- View Details: See full ride info
```

#### 5. **SOS Alerts** 🚨
**What you can do:**
- Monitor active emergencies
- View alert details
- Resolve alerts with notes
- Track alert history

**Emergency Response:**
```
Active Alert → View Details → Contact User → Resolve
- Check location
- Contact emergency services if needed
- Mark as resolved with notes
```

#### 6. **Reports** 📋
**What you can do:**
- Review user reports
- Categorize by type (Safety, Behavior, Payment)
- Take moderation actions
- Resolve incidents

**Report Types:**
- Safety concerns
- Vehicle issues
- Behavior problems
- Payment disputes

#### 7. **Configuration** ⚙️

**Routes** 🗺️
- Manage city-to-city routes
- Set distances and durations
- Configure suggested pricing
- Mark popular routes

**Pricing Templates** 💰
- Create pricing models
- Set base prices
- Configure per-km rates
- Set commission rates

**Promo Codes** 🎟️
- Create discount codes
- Set expiration dates
- Limit usage count
- Track redemptions

#### 8. **Analytics** 📈
**What you can view:**
- Revenue reports
- User growth trends
- Ride statistics
- Export data (CSV)

---

## 🚀 Common Admin Tasks

### Task 1: Help User Login (View OTP)
```
1. Go to User Management
2. Search for user by phone number
3. Click "View OTP"
4. Share OTP with user (securely)
```

### Task 2: Ban Problematic User
```
1. Go to User Management
2. Search for user
3. Click "Ban User"
4. Enter reason
5. Confirm
```

### Task 3: Approve Driver Verification
```
1. Go to Verification Queue
2. Click on pending document
3. View ID image
4. Click "Approve" if valid
5. User gets verified badge
```

### Task 4: Resolve SOS Alert
```
1. Go to SOS Alerts
2. Click on active alert
3. View location and details
4. Contact user/emergency services
5. Click "Resolve" with notes
```

### Task 5: Create Promo Code
```
1. Go to Configuration → Promo Codes
2. Click "Create Promo Code"
3. Enter code (e.g., "LAUNCH50")
4. Set discount (percentage or fixed)
5. Set expiration date
6. Save
```

### Task 6: Adjust User Wallet
```
1. Go to User Management
2. Search for user
3. Click "Adjust Wallet"
4. Enter amount (positive to add, negative to deduct)
5. Enter reason
6. Confirm
```

---

## 📱 Mobile Admin Access

### Via App Profile Screen
1. Open ZimCommute app
2. Go to Profile tab
3. Tap "Admin Dashboard" (only visible to admins)
4. Access admin features

**Note:** Web interface is recommended for desktop use. Mobile app admin is best for quick checks on the go.

---

## 🔔 Notifications & Alerts

### Priority Alerts
- **🚨 SOS Alerts:** Immediate attention required
- **📋 Reports:** Review within 24 hours
- **✅ Verifications:** Review within 48 hours

### Dashboard Badges
Red badges indicate urgent items requiring attention.

---

## 💡 Pro Tips

1. **Use Search Effectively:**
   - Search by phone number for exact matches
   - Search by name for partial matches
   - Use filters to narrow results

2. **Document Everything:**
   - Always add notes when taking actions
   - Reasons are logged in audit trail
   - Helps with accountability

3. **Regular Monitoring:**
   - Check SOS alerts multiple times daily
   - Review reports weekly
   - Monitor metrics daily

4. **Data Export:**
   - Export user data for backups
   - Export ride data for accounting
   - Export revenue for financial reports

5. **Security:**
   - Never share your admin credentials
   - Logout when done
   - Use strong passwords
   - Review audit logs regularly

---

## 🆘 Troubleshooting

### Can't Access Admin Panel
**Problem:** "Access Denied" message
**Solution:** 
1. Check if you have admin role in database
2. Logout and login again
3. Contact super_admin to verify your role

### Metrics Not Loading
**Problem:** Dashboard shows loading forever
**Solution:**
1. Refresh the page
2. Check internet connection
3. Check if backend is running
4. Clear browser cache

### Can't View OTP
**Problem:** OTP not showing for user
**Solution:**
1. Check if user exists
2. Try "Send OTP" to generate new one
3. Check backend logs for errors

---

## 📞 Getting Help

### Support Channels
- Check backend logs for API errors
- Review browser console for frontend errors
- Contact technical support if issues persist

### Documentation
- **Full Deployment Guide:** See `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **API Documentation:** Check backend README
- **Expo Docs:** https://docs.expo.dev

---

## ✅ Admin Checklist

### Daily Tasks
- [ ] Check SOS alerts
- [ ] Review new reports
- [ ] Monitor active rides
- [ ] Check dashboard metrics

### Weekly Tasks
- [ ] Review verification queue
- [ ] Analyze user growth
- [ ] Check revenue reports
- [ ] Review audit logs

### Monthly Tasks
- [ ] Export data for records
- [ ] Update pricing if needed
- [ ] Create new promo codes
- [ ] Review system performance

---

## 🎉 You're Ready to Admin!

**Quick Access:** `https://your-domain.com/admin-web`

**Remember:**
- Be fair and consistent
- Document all actions
- Respond to emergencies quickly
- Monitor metrics regularly

Happy administrating! 🚀
