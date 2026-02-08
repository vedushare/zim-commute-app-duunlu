
# ZimCommute Admin System - Quick Testing Guide

## 🚀 Quick Start

### 1. Create Admin User (Choose One Method)

**Method A: Direct Database Update (Easiest)**
```sql
-- Connect to your PostgreSQL database
UPDATE users 
SET role = 'admin' 
WHERE phone_number = '+263771234567';
```

**Method B: Via Backend API**
```bash
# First, get a user ID from the database
# Then update the role
curl -X PUT https://q3k4fsea3tg38xxu8kgvz4h2nvu6gtwh.app.specular.dev/api/admin/users/{USER_ID}/role \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

### 2. Initialize Zimbabwe Routes
```bash
curl -X POST https://q3k4fsea3tg38xxu8kgvz4h2nvu6gtwh.app.specular.dev/api/admin/init-routes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Sign In to App
1. Open ZimCommute app
2. Enter phone: `+263771234567`
3. Enter OTP (check your SMS or backend logs)
4. Complete profile if needed
5. Go to Profile tab
6. Tap "Admin Dashboard" (should now be visible)

## 📋 Testing Checklist

### Dashboard
- [ ] Metrics load correctly (users, drivers, passengers, rides, revenue)
- [ ] Quick action buttons navigate to correct screens
- [ ] Analytics preview shows data
- [ ] Period selector works (daily/weekly/monthly)
- [ ] Pull to refresh works

### User Management
- [ ] User list loads with pagination
- [ ] Search by phone/name works
- [ ] Filter by role works (all/driver/passenger)
- [ ] Filter by status works (all/active/banned)
- [ ] Ban user modal opens
- [ ] Ban user with reason works
- [ ] Unban user works
- [ ] Wallet adjustment modal opens
- [ ] Wallet adjustment works (positive and negative amounts)
- [ ] User details screen loads (tap on user card)

### Verification Queue
- [ ] Document list loads
- [ ] Filter by status works (pending/approved/rejected)
- [ ] Image preview shows
- [ ] Full-screen image view works
- [ ] Approve document works
- [ ] Reject document modal opens
- [ ] Reject with reason works
- [ ] Status updates correctly after action

### Ride Management
- [ ] Ride list loads
- [ ] Filter by status works (all/active/completed/cancelled)
- [ ] Ride details display correctly
- [ ] Pagination works
- [ ] Pull to refresh works

### Safety Reports
- [ ] Report list loads
- [ ] Filter by status works (pending/reviewed/resolved)
- [ ] Filter by category works (all/Safety/Vehicle/Behavior/Payment)
- [ ] Review modal opens
- [ ] Status selection works (reviewed/resolved)
- [ ] Action selection works (none/warn/ban)
- [ ] Admin notes required
- [ ] Review submission works
- [ ] Report status updates

### SOS Alerts
- [ ] Alert list loads
- [ ] Filter by status works (active/resolved)
- [ ] Active alerts highlighted
- [ ] Location information displays
- [ ] Resolve modal opens
- [ ] Resolution notes required
- [ ] Resolve submission works
- [ ] Alert status updates

### Analytics
- [ ] Period selector works (daily/weekly/monthly)
- [ ] Ride completion rate displays
- [ ] Popular routes list shows
- [ ] User growth chart renders
- [ ] Revenue trends chart renders
- [ ] Export buttons visible (web only)

### Configuration
- [ ] Navigation buttons work
- [ ] Routes config screen accessible
- [ ] Pricing templates screen accessible
- [ ] Promo codes screen accessible
- [ ] Audit logs screen accessible

## 🧪 Test Scenarios

### Scenario 1: Ban a User
1. Go to Admin Dashboard → Manage Users
2. Find a user (search or scroll)
3. Tap "Ban" button
4. Enter reason: "Test ban - violating terms"
5. Confirm
6. Verify user card shows "BANNED" badge
7. Tap "Unban" to restore

### Scenario 2: Approve Verification
1. Go to Admin Dashboard → Verification Queue
2. Ensure filter is set to "Pending"
3. Tap on a document card
4. View the image
5. Tap "Approve"
6. Verify document moves to "Approved" filter

### Scenario 3: Review Safety Report
1. Go to Admin Dashboard → Safety Reports
2. Ensure filter is set to "Pending"
3. Tap "Review Report" on a report
4. Select status: "Resolved"
5. Select action: "Warn User"
6. Enter admin notes: "Investigated and resolved"
7. Submit
8. Verify report moves to "Resolved" filter

### Scenario 4: Adjust Wallet
1. Go to Admin Dashboard → Manage Users
2. Find a user
3. Tap "Wallet" button
4. Enter amount: "10.00" (positive to add)
5. Enter reason: "Test credit"
6. Confirm
7. Verify wallet balance updates

### Scenario 5: Resolve SOS Alert
1. Go to Admin Dashboard → SOS Alerts
2. Ensure filter is set to "Active"
3. Tap "Resolve Alert" on an alert
4. Enter notes: "False alarm - user contacted"
5. Confirm
6. Verify alert moves to "Resolved" filter

## 🐛 Common Issues & Solutions

### Issue: Admin Dashboard not showing
**Solution**: Verify user role is set to 'admin' in database
```sql
SELECT id, phone_number, role FROM users WHERE phone_number = '+263771234567';
```

### Issue: API returns 403 Forbidden
**Solution**: Check authentication token is valid and user has admin role

### Issue: Data not loading
**Solution**: 
1. Check backend URL in app.json
2. Verify backend is running
3. Check console logs for errors
4. Ensure authentication token is present

### Issue: Routes not showing
**Solution**: Initialize routes using the init endpoint
```bash
curl -X POST https://q3k4fsea3tg38xxu8kgvz4h2nvu6gtwh.app.specular.dev/api/admin/init-routes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Issue: Export not working
**Solution**: Export only works on web platform. Test on web browser.

## 📊 Sample Test Data

### Test Users
Create these users for testing:
- Driver: +263771111111
- Passenger: +263772222222
- Admin: +263771234567

### Test Rides
Create rides with different statuses:
- Active ride (departure time in future)
- Completed ride (departure time in past, status completed)
- Cancelled ride (status cancelled)

### Test Reports
Create safety reports with different categories:
- Safety concern
- Vehicle issue
- Behavior complaint
- Payment dispute

## 🔍 Debugging Tips

1. **Check Console Logs**
   - Look for `[API]` prefixed logs
   - Check for error messages
   - Verify request/response data

2. **Verify Backend Response**
   ```bash
   curl -X GET https://q3k4fsea3tg38xxu8kgvz4h2nvu6gtwh.app.specular.dev/api/admin/dashboard/metrics \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Check Authentication**
   - Verify token is stored in SecureStore
   - Check token is included in request headers
   - Ensure token hasn't expired

4. **Database Verification**
   ```sql
   -- Check user role
   SELECT * FROM users WHERE role = 'admin';
   
   -- Check routes
   SELECT * FROM routes_config;
   
   -- Check audit logs
   SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 10;
   ```

## ✅ Success Criteria

The integration is successful when:
- [x] Admin user can access admin dashboard
- [x] All admin screens load without errors
- [x] API calls return data successfully
- [x] User actions (ban, approve, review) work
- [x] Data updates reflect in UI
- [x] Error messages display properly
- [x] Loading states show during API calls
- [x] Pagination works correctly
- [x] Filters work as expected
- [x] Pull to refresh updates data

## 📞 Need Help?

If you encounter issues:
1. Check this guide first
2. Review console logs
3. Verify backend is running
4. Check database for correct data
5. Ensure user has admin role
6. Test API endpoints directly with curl

---

**Happy Testing!** 🎉

Remember: This is a test environment. Always test thoroughly before deploying to production.
