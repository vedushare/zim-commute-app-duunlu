
# ZimCommute Web Admin Panel Access Guide

## Overview
The ZimCommute admin panel is now accessible through a web browser, providing a dedicated interface for administrative operations separate from the mobile app.

## Access URL

### Development
When running the app locally with `npm run web`, access the admin panel at:
```
http://localhost:8081/admin-web
```

### Production
Once deployed, access the admin panel at:
```
https://your-app-domain.com/admin-web
```

## Features

The web admin panel provides access to all administrative functions:

### 📊 Dashboard
- Real-time metrics overview
- Total users (drivers and passengers)
- Active rides today
- Total revenue
- Verification queue length
- Pending reports
- Active SOS alerts

### 👥 User Management
- Search and filter users
- View user details and OTP codes
- Send OTP to users
- Ban/unban users
- Adjust user wallet balances
- Update user roles
- Create new users
- Delete users

### ✅ Verification Queue
- Review pending ID documents
- Approve or reject verification documents
- View document images
- Add rejection reasons

### 🚗 Ride Management
- View all rides (active, completed, cancelled)
- Cancel rides with reason
- Adjust ride pricing
- Filter by status and date

### 🚨 SOS Alerts
- Monitor active emergency alerts
- View alert location and user details
- Resolve alerts with notes
- Real-time alert notifications

### 📋 Reports
- Review user reports (safety, behavior, payment)
- Take action on reports
- Ban or warn users
- Add admin notes
- Mark reports as reviewed or resolved

### ⚙️ Configuration
- **Routes**: Manage popular routes, distances, and suggested pricing
- **Pricing Templates**: Configure base prices and commission rates
- **Promo Codes**: Create and manage discount codes
- **Audit Logs**: View all admin actions and changes

### 📈 Analytics
- User growth trends
- Ride completion rates
- Popular routes analysis
- Revenue trends
- Export data to CSV

## Authentication

### Requirements
- You must have an admin or super_admin role
- You must be logged in with valid credentials

### Login Process
1. Navigate to the admin panel URL
2. If not logged in, you'll be redirected to the phone login screen
3. Enter your phone number and verify with OTP
4. If you have admin privileges, you'll see the admin dashboard
5. If you don't have admin privileges, you'll see an "Access Denied" message

### Getting Admin Access
To get admin access, a super_admin must:
1. Log into the mobile app
2. Go to Profile → Admin Dashboard → User Management
3. Find your user account
4. Update your role to "admin" or "super_admin"

Alternatively, a super_admin can use the Supabase SQL editor to run:
```sql
UPDATE users 
SET role = 'admin' 
WHERE phone_number = '+263XXXXXXXXX';
```

## Navigation

The web admin panel features:
- **Sidebar Navigation**: Quick access to all admin sections
- **Badge Indicators**: Shows pending items (verifications, reports, SOS alerts)
- **Responsive Layout**: Optimized for desktop browsers
- **Real-time Updates**: Metrics refresh automatically

## Browser Compatibility

The web admin panel works best on:
- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

Minimum screen resolution: 1280x720

## Security

### Best Practices
- Always log out when finished
- Don't share your admin credentials
- Use a secure, private network
- Keep your browser updated
- Enable two-factor authentication (when available)

### Admin Actions Logging
All admin actions are logged in the audit logs, including:
- User modifications
- Role changes
- Bans and unbans
- Wallet adjustments
- Verification approvals/rejections
- Report reviews
- Configuration changes

## Mobile vs Web Admin

### Web Admin Panel (Recommended for Desktop)
- ✅ Larger screen for better visibility
- ✅ Easier data entry with keyboard
- ✅ Better for bulk operations
- ✅ Optimized layout for desktop
- ✅ Export functionality

### Mobile Admin (In-App)
- ✅ Access on the go
- ✅ Push notifications for alerts
- ✅ Quick actions
- ✅ Native mobile experience

Both interfaces use the same backend APIs and have identical functionality.

## Troubleshooting

### "Access Denied" Error
- **Cause**: Your account doesn't have admin privileges
- **Solution**: Contact a super_admin to grant you admin access

### "Failed to load dashboard" Error
- **Cause**: Backend API connection issue
- **Solution**: Check your internet connection and backend status

### Page Not Loading
- **Cause**: Incorrect URL or app not running
- **Solution**: Verify the URL and ensure the app is running

### Not Redirecting After Login
- **Cause**: Browser cache or session issue
- **Solution**: Clear browser cache and cookies, then try again

## Support

For technical support or to report issues:
1. Check the backend logs for API errors
2. Check the browser console for frontend errors
3. Contact the development team with error details

## API Endpoints Used

The web admin panel uses these backend endpoints:
- `GET /api/admin/dashboard/metrics` - Dashboard metrics
- `GET /api/admin/users` - User list
- `GET /api/admin/users/:id/otp` - View user OTP
- `POST /api/admin/users/:id/send-otp` - Send OTP to user
- `PUT /api/admin/users/:id/ban` - Ban user
- `PUT /api/admin/users/:id/unban` - Unban user
- `PUT /api/admin/users/:id/wallet` - Adjust wallet
- `GET /api/admin/verification/queue` - Verification queue
- `GET /api/admin/rides` - Ride list
- `GET /api/admin/sos-alerts` - SOS alerts
- `GET /api/admin/reports` - Reports list
- `GET /api/admin/routes` - Route configuration
- `GET /api/admin/promo-codes` - Promo codes
- `GET /api/admin/audit-logs` - Audit logs

All endpoints require authentication and admin role.

## Next Steps

1. **Deploy the app** to make the admin panel accessible online
2. **Set up admin accounts** for your team
3. **Configure routes and pricing** for your region
4. **Monitor the dashboard** regularly for alerts and metrics
5. **Review verification queue** to approve new drivers

---

**Note**: This admin panel is part of the ZimCommute carpooling platform. For more information, see the main README.md file.
