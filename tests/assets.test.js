const request = require('supertest');
const app = require('../app');

describe('Assets endpoints', () => {
    describe('GET /api/v1/assets/emojis', () => {
        it('should return 200 with an array of emoji strings', async () => {
            const res = await request(app).get('/api/v1/assets/emojis');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
            expect(typeof res.body[0]).toBe('string');
        });

        it('should not require authentication', async () => {
            const res = await request(app).get('/api/v1/assets/emojis');
            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/v1/assets/stickers', () => {
        it('should return 200 with an array of sticker objects', async () => {
            const res = await request(app).get('/api/v1/assets/stickers');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('label');
            expect(res.body[0]).toHaveProperty('emoji');
        });

        it('should not require authentication', async () => {
            const res = await request(app).get('/api/v1/assets/stickers');
            expect(res.status).toBe(200);
        });

        it('sticker IDs should be unique', async () => {
            const res = await request(app).get('/api/v1/assets/stickers');
            const ids = res.body.map(s => s.id);
            expect(new Set(ids).size).toBe(ids.length);
        });
    });
});
