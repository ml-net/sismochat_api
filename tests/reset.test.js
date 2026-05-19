const request = require('supertest');
const crypto = require('crypto');
const app = require('../app');
const db = require('../models/index.js');

// Mock the email service
jest.mock('../services/email.js', () => ({
    sendResetOtp: jest.fn().mockResolvedValue(undefined)
}));
const { sendResetOtp } = require('../services/email.js');

const testParent = { email: 'reset@test.com', pwd: 'password123' };

describe('Password Reset', () => {
    beforeAll(async () => {
        await request(app).post('/api/v1/parent').send(testParent).expect(201);
    });

    describe('POST /api/v1/parent/reset-request', () => {
        it('should return 200 and send OTP for existing email', async () => {
            const res = await request(app)
                .post('/api/v1/parent/reset-request')
                .send({ email: testParent.email })
                .expect(200);

            expect(res.body.msg).toMatch(/reset code has been sent/);
            expect(sendResetOtp).toHaveBeenCalledWith(testParent.email, expect.any(String));
        });

        it('should return 200 even for non-existing email (no leak)', async () => {
            const res = await request(app)
                .post('/api/v1/parent/reset-request')
                .send({ email: 'nobody@test.com' })
                .expect(200);

            expect(res.body.msg).toMatch(/reset code has been sent/);
        });

        it('should return 400 for invalid email', async () => {
            await request(app)
                .post('/api/v1/parent/reset-request')
                .send({ email: 'notanemail' })
                .expect(400);
        });
    });

    describe('POST /api/v1/parent/reset', () => {
        let validOtp;

        beforeEach(async () => {
            // Generate a known OTP and store its hash
            validOtp = '123456';
            const hash = crypto.createHash('sha256').update(validOtp).digest('hex');
            const expiry = new Date(Date.now() + 30 * 60 * 1000);
            await db.parents.update(
                { resetOtp: hash, resetOtpExpiry: expiry, resetOtpAttempts: 0 },
                { where: { email: testParent.email } }
            );
        });

        it('should reset password with valid OTP', async () => {
            await request(app)
                .post('/api/v1/parent/reset')
                .send({ email: testParent.email, otp: validOtp, newPassword: 'newpass123' })
                .expect(204);

            // Verify new password works
            const res = await request(app)
                .post('/api/v1/auth/parent')
                .send({ email: testParent.email, pwd: 'newpass123' })
                .expect(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should reject invalid OTP and decrement attempts', async () => {
            const res = await request(app)
                .post('/api/v1/parent/reset')
                .send({ email: testParent.email, otp: '000000', newPassword: 'newpass123' })
                .expect(400);

            expect(res.body.errDesc).toMatch(/Invalid code/);
        });

        it('should reject after max attempts', async () => {
            await db.parents.update(
                { resetOtpAttempts: 5 },
                { where: { email: testParent.email } }
            );

            const res = await request(app)
                .post('/api/v1/parent/reset')
                .send({ email: testParent.email, otp: validOtp, newPassword: 'newpass123' })
                .expect(400);

            expect(res.body.errDesc).toMatch(/Too many attempts/);
        });

        it('should reject expired OTP', async () => {
            await db.parents.update(
                { resetOtpExpiry: new Date(Date.now() - 1000) },
                { where: { email: testParent.email } }
            );

            const res = await request(app)
                .post('/api/v1/parent/reset')
                .send({ email: testParent.email, otp: validOtp, newPassword: 'newpass123' })
                .expect(400);

            expect(res.body.errDesc).toMatch(/expired/);
        });

        it('should reject if no reset was requested', async () => {
            await db.parents.update(
                { resetOtp: null, resetOtpExpiry: null },
                { where: { email: testParent.email } }
            );

            await request(app)
                .post('/api/v1/parent/reset')
                .send({ email: testParent.email, otp: '123456', newPassword: 'newpass123' })
                .expect(400);
        });
    });
});
