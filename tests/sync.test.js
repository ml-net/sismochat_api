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

    it('POST /sync/restore should return fresh stateCert in response', async () => {
        const cert = jwt.sign(mockParentCert, secret);
        const res = await request(app)
            .post('/api/v1/sync/restore')
            .send({ stateCert: cert })
            .expect(201);
        expect(res.body.stateCert).toBeDefined();
    });

    it('POST /sync/restore should create inverse connections', async () => {
        // First restore a parent with a child that has a connection TO our child
        const otherParent = {
            type: 'parent',
            id: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
            email: 'other@test.com',
            pwdHash: '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012',
            children: [{
                id: 'eeeeeeee-ffff-0000-1111-444444444444',
                nick: 'OtherChild',
                key: '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----\n',
                permissions: { audio: true, sticker: true },
                deviceId: 'ffffffff-0000-1111-2222-555555555555',
                connections: [{ from: 'eeeeeeee-ffff-0000-1111-444444444444', to: mockParentCert.children[0].id, status: 0 }]
            }],
            issuedAt: new Date().toISOString()
        };
        // Restore other parent first (creates connection TO our child)
        await request(app)
            .post('/api/v1/sync/restore')
            .send({ stateCert: jwt.sign(otherParent, secret) })
            .expect(201);
        // Now restore our parent — should create inverse connection
        const res = await request(app)
            .post('/api/v1/sync/restore')
            .send({ stateCert: jwt.sign(mockParentCert, secret) })
            .expect(201);
        // Verify inverse connection exists
        const conn = await db.connections.findOne({ where: { from: mockParentCert.children[0].id, to: 'eeeeeeee-ffff-0000-1111-444444444444' } });
        expect(conn).not.toBeNull();
        expect(conn.status).toBe(0);
    });

    it('POST /sync/restore should create inverse when restoring outbound and other user exists', async () => {
        // Our parent has a connection FROM our child TO other child
        const parentWithOutbound = {
            type: 'parent',
            id: '11111111-2222-3333-4444-555555555555',
            email: 'outbound@test.com',
            pwdHash: '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012',
            children: [{
                id: '66666666-7777-8888-9999-aaaaaaaaaaaa',
                nick: 'OutboundChild',
                key: '-----BEGIN PUBLIC KEY-----\ntest2\n-----END PUBLIC KEY-----\n',
                permissions: { audio: true, sticker: true },
                deviceId: '77777777-8888-9999-aaaa-bbbbbbbbbbbb',
                connections: [{ from: '66666666-7777-8888-9999-aaaaaaaaaaaa', to: mockParentCert.children[0].id, status: 0 }]
            }],
            issuedAt: new Date().toISOString()
        };
        // mockParentCert's child already exists from earlier tests
        // Restore parent with outbound connection — other user exists → should create inverse
        await request(app)
            .post('/api/v1/sync/restore')
            .send({ stateCert: jwt.sign(parentWithOutbound, secret) })
            .expect(201);
        // Verify inverse: from mockChild to outboundChild
        const conn = await db.connections.findOne({ where: { from: mockParentCert.children[0].id, to: '66666666-7777-8888-9999-aaaaaaaaaaaa' } });
        expect(conn).not.toBeNull();
        expect(conn.status).toBe(0);
    });
});
