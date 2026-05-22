const request = require('supertest');
const app = require('../app');

describe('Status endpoint', () => {
    it('should return null message when STATUS_MESSAGE is not set', async () => {
        delete process.env.STATUS_MESSAGE;
        const res = await request(app).get('/api/v1/status');
        expect(res.status).toBe(200);
        expect(res.body.message).toBeNull();
    });

    it('should return the message when STATUS_MESSAGE is set', async () => {
        process.env.STATUS_MESSAGE = 'Maintenance in 10 minutes';
        const res = await request(app).get('/api/v1/status');
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Maintenance in 10 minutes');
        delete process.env.STATUS_MESSAGE;
    });
});
