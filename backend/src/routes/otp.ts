export function register(app, fastify) {
    app.post('/api/otp/send', async (req, reply) => {
        // code to send OTP
    });
    app.post('/api/otp/verify', async (req, reply) => {
        // code to verify OTP
    });
    app.post('/api/otp/resend', async (req, reply) => {
        // code to resend OTP
    });
}
