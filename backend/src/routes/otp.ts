import { sendOTPSMS } from '../utils/sms.js';

// After OTP creation in POST /api/otp/send
app.post('/api/otp/send', async (req, res) => {
    const { phoneNumber } = req.body;
    // ...existing OTP generation logic...

    try {
        await sendOTPSMS(otp, phoneNumber);
    } catch (err) {
        app.logger.error(err, phoneNumber);
    }
    
    res.status(200).json({ success: true });
});

// After OTP creation in POST /api/otp/resend
app.post('/api/otp/resend', async (req, res) => {
    const { phoneNumber } = req.body;
    // ...existing OTP generation logic...

    try {
        await sendOTPSMS(otp, phoneNumber);
    } catch (err) {
        app.logger.error(err, phoneNumber);
    }
    
    res.status(200).json({ success: true });
});

// ...other existing routes (e.g., /api/otp/verify remain unchanged) ...