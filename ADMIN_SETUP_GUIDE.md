
# ZimCommute Admin Setup Guide

## Overview
This guide explains how to set up and use the admin functionality in ZimCommute. The admin system allows authorized users to manage platform users, view OTPs, and perform administrative tasks.

## Database Architecture

### Admin Roles
The system supports three user roles:
- **user**: Regular platform users (drivers and passengers)
- **admin**: Can manage users, view OTPs, handle reports, etc.
- **super_admin**: Has all admin permissions plus the ability to promote other users to admin

### Admin Tables
- **users**: Contains `role` column ('user', 'admin', 'super_admin')
- **otp_verifications**: Stores OTP codes for phone verification
- **admin_audit_logs**: Tracks all admin actions for accountability

## Creating the First Admin

### Step 1: Create a User Account
1. Open the ZimCommute app
2. Sign up with a phone number
3. Complete OTP verification
4. Note your user ID (you can find this in the database)

### Step 2: Promote User to Super Admin
Run this SQL query in Supabase SQL Editor:

```sql
-- Replace <user_id> with the actual UUID of the user
SELECT promote_user_to_admin('<user_id>', 'super_admin');

-- Example:
-- SELECT promote_user_to_admin('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'super_admin');
```

### Step 3: Verify Admin Access
1. Log out and log back in to the app
2. Navigate to the admin section
3. You should now see the admin dashboard

## Admin Features

### 1. User Management (`/admin/users`)
**View OTP**
- Click the key icon next to any user
- View the current OTP code, expiration time, and verification status
- Useful for helping users who didn't receive their OTP

**Send OTP**
- Click the send icon next to any user
- Generates and sends a new OTP to the user's phone
- Previous OTPs are automatically invalidated

**Create User**
- Click "Create User" button
- Fill in user details:
  - Phone Number (required, format: +263... or 07...)
  - Full Name
  - Email
  - User Type (Passenger/Driver)
  - Home City
  - Verification Level
- User is created immediately

**Edit User**
- Click the edit icon next to any user
- Update user details
- Changes are saved immediately

**Delete User**
- Click the delete icon next to any user
- Confirm deletion
- User and all related data are permanently removed

**Ban/Unban User**
- Click the ban/unban icon
- Provide a reason for banning
- Banned users cannot access the platform

**Adjust Wallet**
- Click the wallet icon
- Enter amount (positive to add, negative to deduct)
- Provide a reason for the adjustment
- Wallet balance is updated immediately

### 2. Verification Management (`/admin/verification`)
- Review uploaded ID documents
- Approve or reject verification requests
- View document images
- Add rejection reasons

### 3. Ride Management (`/admin/rides`)
- View all rides on the platform
- Cancel rides with reason
- Adjust ride pricing
- Monitor ride status

### 4. Safety & Moderation (`/admin/reports`)
- Review user reports
- Investigate safety incidents
- Take action on reported users
- View SOS alerts

### 5. Configuration
**Routes Config** (`/admin/routes-config`)
- Manage popular routes
- Set suggested pricing
- Configure distance and duration

**Pricing Templates** (`/admin/pricing-templates`)
- Create pricing templates
- Set base price and per-km rates
- Configure commission rates

**Promo Codes** (`/admin/promo-codes`)
- Create promotional codes
- Set discount types (percentage/fixed)
- Configure validity periods
- Track usage

### 6. Analytics & Audit (`/admin/dashboard`)
- View platform metrics
- Monitor user growth
- Track revenue
- Review admin audit logs

## Backend API Endpoints

### Admin User Management
```
GET    /api/admin/users                    - List all users
GET    /api/admin/users/:userId            - Get user details
GET    /api/admin/users/:userId/otp        - View user's OTP
POST   /api/admin/users/:userId/send-otp   - Send OTP to user
POST   /api/admin/users                    - Create new user
PUT    /api/admin/users/:userId            - Update user details
DELETE /api/admin/users/:userId            - Delete user
PUT    /api/admin/users/:userId/ban        - Ban user
PUT    /api/admin/users/:userId/unban      - Unban user
PUT    /api/admin/users/:userId/wallet     - Adjust wallet balance
PUT    /api/admin/users/:userId/role       - Change user role (super_admin only)
```

### Required Backend Implementation
The following endpoints need to be implemented in the backend:

1. **GET /api/admin/users/:userId/otp**
   - Retrieves the most recent OTP for a user
   - Returns: `{ success, otp, phoneNumber, expiresAt, verified, attempts, createdAt }`
   - Logs admin action in audit trail

2. **POST /api/admin/users/:userId/send-otp**
   - Generates and sends a new OTP to the user
   - Invalidates any existing OTPs
   - Returns: `{ success, message, otp, phoneNumber, expiresAt }`
   - Logs admin action in audit trail

3. **POST /api/admin/users**
   - Creates a new user with provided details
   - Required: phoneNumber
   - Optional: fullName, email, userType, homeCity, verificationLevel
   - Returns: `{ success, user }`
   - Logs admin action in audit trail

4. **PUT /api/admin/users/:userId**
   - Updates user details
   - Accepts: fullName, email, userType, homeCity, verificationLevel
   - Returns: `{ success, message }`
   - Logs admin action in audit trail

5. **DELETE /api/admin/users/:userId**
   - Permanently deletes a user
   - Cascades to related records (rides, bookings, etc.)
   - Returns: `{ success, message }`
   - Logs admin action in audit trail

## Security Considerations

### Authentication
- All admin endpoints require authentication
- Admin role is verified on every request
- JWT tokens are used for authentication

### Authorization
- Regular users cannot access admin endpoints
- Admins can manage users and content
- Super admins can promote other users to admin

### Audit Trail
- All admin actions are logged in `admin_audit_logs`
- Logs include: admin ID, action type, target, timestamp, details
- Logs are immutable and cannot be deleted

### Row Level Security (RLS)
- Admins can view all users
- Admins can update/delete users
- Admins can view/create OTPs
- Regular users can only access their own data

## Testing Admin Functionality

### 1. Create Test Users
```sql
-- Create a test passenger
INSERT INTO users (phone_number, full_name, user_type, verification_level)
VALUES ('+263771234567', 'Test Passenger', 'Passenger', 'PhoneVerified');

-- Create a test driver
INSERT INTO users (phone_number, full_name, user_type, verification_level)
VALUES ('+263777654321', 'Test Driver', 'Driver', 'FullyVerified');
```

### 2. Test OTP Viewing
1. Log in as admin
2. Navigate to User Management
3. Click the key icon next to a user
4. Verify OTP details are displayed

### 3. Test OTP Sending
1. Click the send icon next to a user
2. Verify new OTP is generated
3. Check that old OTP is invalidated

### 4. Test User Creation
1. Click "Create User" button
2. Fill in phone number: +263771111111
3. Fill in other details
4. Verify user is created successfully

### 5. Test User Deletion
1. Click delete icon next to a test user
2. Confirm deletion
3. Verify user is removed from list

## Troubleshooting

### "Unauthorized" Error
- Verify your user has admin or super_admin role
- Check that you're logged in
- Try logging out and back in

### "User not found" Error
- Verify the user ID is correct
- Check that the user hasn't been deleted

### "Failed to fetch OTP" Error
- User may not have any OTPs yet
- Try sending a new OTP first

### Backend Endpoint Not Found
- Verify backend is running
- Check that admin routes are registered
- Review backend logs for errors

## Best Practices

1. **Always provide reasons** when banning users or adjusting wallets
2. **Review audit logs regularly** to monitor admin activity
3. **Use the least privilege principle** - only promote users to admin when necessary
4. **Document admin actions** in the reason fields
5. **Test in development** before performing actions in production
6. **Backup data** before bulk operations

## Support

For issues or questions:
1. Check the audit logs for error details
2. Review backend logs for API errors
3. Contact the development team
4. Refer to the main README.md for general app information

---

**Last Updated**: January 2025
**Version**: 1.0.0
