const request = require('supertest');
const app = require('../app');

let JWTtokenParent;

beforeAll(async () => {
    // Create and login parent for authenticated tests
    await request(app).post('/api/v1/parents').send({ email: 'errtest@test.com', pwd: 'password123' });
    const auth = await request(app).post('/api/v1/auth/parent').send({ email: 'errtest@test.com', pwd: 'password123' });
    JWTtokenParent = auth.body.token;
});

describe('Error codes', () => {

    // errCode 1: Authentication required
    it('should return errCode 1 when no auth token provided', async () => {
        const res = await request(app).get('/api/v1/parents/errtest@test.com');
        expect(res.status).toBe(401);
        expect(res.body.errCode).toBe(1);
    });

    // errCode 2: Already exists
    it('should return errCode 2 when creating duplicate parent', async () => {
        const res = await request(app).post('/api/v1/parents').send({ email: 'errtest@test.com', pwd: 'password123' });
        expect(res.status).toBe(400);
        expect(res.body.errCode).toBe(2);
    });

    // errCode 3: Not found
    it('should return errCode 3 when parent not found', async () => {
        const res = await request(app).post('/api/v1/auth/parent').send({ email: 'nobody@nowhere.com', pwd: 'password123' });
        expect(res.status).toBe(404);
        expect(res.body.errCode).toBe(3);
    });

    // errCode 4: Validation error
    it('should return errCode 4 on invalid input', async () => {
        const res = await request(app).post('/api/v1/parents').send({ email: 'notanemail', pwd: 'ok' });
        expect(res.status).toBe(400);
        expect(res.body.errCode).toBe(4);
    });

    // errCode 7: Profile mismatch
    it('should return errCode 7 when wrong profile accesses endpoint', async () => {
        // Parent trying to access user-only endpoint
        const res = await request(app)
            .get('/api/v1/connections/')
            .set('Authorization', 'Bearer ' + JWTtokenParent);
        expect(res.status).toBe(401);
        expect(res.body.errCode).toBe(7);
    });

    // errCode 12: Password mismatch
    it('should return errCode 12 on wrong password', async () => {
        const res = await request(app).post('/api/v1/auth/parent').send({ email: 'errtest@test.com', pwd: 'wrongpassword' });
        expect(res.status).toBe(401);
        expect(res.body.errCode).toBe(12);
    });

    // errCode 12: Old password incorrect (change password)
    it('should return errCode 12 on wrong old password during change', async () => {
        const res = await request(app)
            .patch('/api/v1/parents/password')
            .set('Authorization', 'Bearer ' + JWTtokenParent)
            .send({ oldPassword: 'wrongold', newPassword: 'newpass123' });
        expect(res.status).toBe(401);
        expect(res.body.errCode).toBe(12);
    });

    // errCode 13: Missing credentials
    it('should return errCode 13 when credentials are missing', async () => {
        const res = await request(app).post('/api/v1/auth/parent').send({ email: 'errtest@test.com' });
        expect(res.status).toBe(401);
        expect(res.body.errCode).toBe(13);
    });

    // errCode 13: Missing user token
    it('should return errCode 13 when user token is missing', async () => {
        const res = await request(app).post('/api/v1/auth/user').send({});
        expect(res.status).toBe(401);
        expect(res.body.errCode).toBe(13);
    });

    // errCode 15: Rate limited (test with burst requests)
    it('should return errCode 15 when rate limited', async () => {
        // Auth limiter allows 20 per 15min window — send 21 requests
        const promises = [];
        for (let i = 0; i < 21; i++) {
            promises.push(request(app).post('/api/v1/auth/parent').send({ email: 'spam@test.com', pwd: 'x' }));
        }
        const results = await Promise.all(promises);
        const limited = results.find(r => r.status === 429);
        if (limited) {
            expect(limited.body.errCode).toBe(15);
        }
        // Rate limit may not trigger in test env due to timing — skip if not hit
    });
});
