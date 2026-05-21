const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const db = require('../models/index.js');

const secret = process.env.JWT_SECRET || 'trytoguess';

const mockParentCert = {
    type: 'parent',
    id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    email: 'restore@test.com',
    pwdHash: '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012',
    children: [
        {
            id: 'cccccccc-dddd-eeee-ffff-111111111111',
            nick: 'RestoredChild',
            key: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA\n-----END PUBLIC KEY-----\n',
            permissions: { audio: true, sticker: true },
            deviceId: 'dddddddd-eeee-ffff-0000-222222222222',
            connections: [
                { from: 'cccccccc-dddd-eeee-ffff-111111111111', to: 'ffffffff-0000-1111-2222-333333333333', status: 0 }
            ]
        }
    ],
    issuedAt: new Date().toISOString()
};

describe('Sync endpoints', () => {
    it('POST /sync/restore with valid certificate should return 201', async () => {
        const cert = jwt.sign(mockParentCert, secret);
        const res = await request(app)
            .post('/api/v1/sync/restore')
            .send({ stateCert: cert })
            .expect(201);
        expect(res.body.msg).toBe('State restored');
    });

    it('POST /sync/restore should be idempotent (second call succeeds)', async () => {
        const cert = jwt.sign(mockParentCert, secret);
        await request(app)
            .post('/api/v1/sync/restore')
            .send({ stateCert: cert })
            .expect(201);
    });

    it('POST /sync/restore with invalid signature should return 401', async () => {
        const cert = jwt.sign(mockParentCert, 'wrongsecret');
        await request(app)
            .post('/api/v1/sync/restore')
            .send({ stateCert: cert })
            .expect(401);
    });

    it('POST /sync/restore without certificate should return 400', async () => {
        await request(app)
            .post('/api/v1/sync/restore')
            .send({})
            .expect(400);
    });

    it('POST /sync/restore should create parent and child in DB', async () => {
        const parent = await db.parents.findByPk(mockParentCert.id);
        expect(parent).not.toBeNull();
        expect(parent.email).toBe(mockParentCert.email);

        const child = await db.users.findByPk(mockParentCert.children[0].id);
        expect(child).not.toBeNull();
        expect(child.nick).toBe('RestoredChild');
    });

    it('GET /sync/cert should require auth', async () => {
        await request(app)
            .get('/api/v1/sync/cert')
            .expect(401);
    });
});
